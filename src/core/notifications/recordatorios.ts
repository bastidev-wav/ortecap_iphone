import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { SecureStorageService } from '../storage/secureStorage';

/**
 * Recordatorios de clases como notificaciones LOCALES del iPhone: mismos
 * avisos que envía el servidor por push (24 h y 1 h antes, ver
 * EnviarRecordatoriosClase.php), pero programados en el propio teléfono,
 * así que funcionan sin Firebase y sin conexión a internet.
 */

export interface PrefsRecordatorios {
  activos: boolean;
  aviso24h: boolean;
  aviso1h: boolean;
}

export interface ClaseRecordable {
  id: number | string;
  fecha: string;
  hora_inicio: string;
  tipo_clase?: string | null;
  /** Texto extra al final del aviso, ej. "con Camila Rojas". */
  detalle?: string | null;
}

const PREFS_KEY = 'recordatorios';
const PREFIJO = 'ortecap-clase-';
const PREFIJO_PRUEBA = 'ortecap-prueba-';
// iOS solo mantiene 64 notificaciones locales pendientes por app.
const MAX_PROGRAMADOS = 60;

const PREFS_DEFAULT: PrefsRecordatorios = { activos: true, aviso24h: true, aviso1h: true };

let ultimasClases: ClaseRecordable[] = [];

interface PrefsState {
  prefs: PrefsRecordatorios;
  cargado: boolean;
  cargar: () => Promise<PrefsRecordatorios>;
  guardar: (cambios: Partial<PrefsRecordatorios>) => Promise<void>;
}

export const useRecordatoriosPrefs = create<PrefsState>((set, get) => ({
  prefs: PREFS_DEFAULT,
  cargado: false,
  async cargar() {
    if (get().cargado) return get().prefs;
    const prefs = await SecureStorageService.readPref(PREFS_KEY, PREFS_DEFAULT);
    set({ prefs, cargado: true });
    return prefs;
  },
  async guardar(cambios) {
    const prefs = { ...get().prefs, ...cambios };
    set({ prefs, cargado: true });
    await SecureStorageService.writePref(PREFS_KEY, prefs);
    await reprogramar();
  },
}));

const soportado = () => Platform.OS !== 'web';

/** true si el usuario permitió notificaciones; si [pedir], muestra el diálogo del sistema cuando aún no respondió. */
export async function permisoNotificaciones(pedir: boolean): Promise<boolean> {
  if (!soportado()) return false;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  if (!pedir || !actual.canAskAgain) return false;
  const nuevo = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return nuevo.granted;
}

async function cancelarPorPrefijo(prefijo: string) {
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    programadas
      .filter((n) => n.identifier.startsWith(prefijo))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

function inicioDe(clase: ClaseRecordable): dayjs.Dayjs | null {
  if (!clase.fecha || !clase.hora_inicio) return null;
  const d = dayjs(`${clase.fecha.substring(0, 10)} ${clase.hora_inicio.substring(0, 8)}`);
  return d.isValid() ? d : null;
}

/**
 * Reemplaza todos los recordatorios programados por los de [clases].
 * Es idempotente: se puede llamar cada vez que se cargan las clases.
 * Devuelve cuántos avisos quedaron programados.
 */
export async function sincronizarRecordatorios(clases: ClaseRecordable[]): Promise<number> {
  const porId = new Map<string, ClaseRecordable>();
  for (const c of clases) porId.set(String(c.id), c);
  ultimasClases = Array.from(porId.values());
  return reprogramar();
}

async function reprogramar(): Promise<number> {
  if (!soportado()) return 0;
  try {
    const prefs = await useRecordatoriosPrefs.getState().cargar();
    await cancelarPorPrefijo(PREFIJO);
    if (!prefs.activos || (!prefs.aviso24h && !prefs.aviso1h)) return 0;
    if (!(await permisoNotificaciones(true))) return 0;

    const ahora = dayjs();
    const avisos: { id: string; titulo: string; cuerpo: string; fecha: Date; claseId: string }[] = [];

    for (const clase of ultimasClases) {
      const inicio = inicioDe(clase);
      if (!inicio || !inicio.isAfter(ahora)) continue;

      const tipoTexto = clase.tipo_clase === 'teorica' ? 'teórica' : 'práctica';
      const cuerpo = `Clase ${tipoTexto} a las ${inicio.format('HH:mm')} hrs.${clase.detalle ? ` ${clase.detalle}` : ''}`;
      const claseId = String(clase.id);

      const antes24 = inicio.subtract(24, 'hour');
      if (prefs.aviso24h && antes24.isAfter(ahora)) {
        avisos.push({ id: `${PREFIJO}${claseId}-24h`, titulo: 'Tu clase es mañana', cuerpo, fecha: antes24.toDate(), claseId });
      }
      const antes1 = inicio.subtract(1, 'hour');
      if (prefs.aviso1h && antes1.isAfter(ahora)) {
        avisos.push({ id: `${PREFIJO}${claseId}-1h`, titulo: 'Tu clase empieza en 1 hora', cuerpo, fecha: antes1.toDate(), claseId });
      }
    }

    avisos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const aProgramar = avisos.slice(0, MAX_PROGRAMADOS);

    for (const a of aProgramar) {
      await Notifications.scheduleNotificationAsync({
        identifier: a.id,
        content: {
          title: a.titulo,
          body: a.cuerpo,
          sound: true,
          // La fecha se guarda también en `data`: iOS no devuelve el trigger
          // con el mismo formato con que se programó, y la pantalla de
          // recordatorios la necesita para listar los próximos avisos.
          data: { tipo: 'recordatorio_clase', agenda_clase_id: a.claseId, fecha_aviso: a.fecha.toISOString() },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.fecha },
      });
    }
    return aProgramar.length;
  } catch {
    // Un fallo al programar avisos nunca debe romper la pantalla que lo llamó.
    return 0;
  }
}

export interface AvisoProgramado {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: Date | null;
}

export async function avisosProgramados(): Promise<AvisoProgramado[]> {
  if (!soportado()) return [];
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  return programadas
    .filter((n) => n.identifier.startsWith(PREFIJO))
    .map((n) => {
      const raw = (n.content.data as Record<string, unknown> | undefined)?.fecha_aviso;
      const fecha = typeof raw === 'string' ? new Date(raw) : null;
      return {
        id: n.identifier,
        titulo: n.content.title ?? '',
        cuerpo: n.content.body ?? '',
        fecha: fecha && !Number.isNaN(fecha.getTime()) ? fecha : null,
      };
    })
    .sort((a, b) => (a.fecha?.getTime() ?? 0) - (b.fecha?.getTime() ?? 0));
}

/** Aviso de prueba en 5 segundos, para comprobar que el iPhone los muestra. */
export async function enviarPrueba(): Promise<boolean> {
  if (!(await permisoNotificaciones(true))) return false;
  await cancelarPorPrefijo(PREFIJO_PRUEBA);
  await Notifications.scheduleNotificationAsync({
    identifier: `${PREFIJO_PRUEBA}${Date.now()}`,
    content: { title: 'Recordatorio de prueba', body: 'Así te avisaremos antes de cada clase.', sound: true, data: { tipo: 'prueba' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
  return true;
}

/** Al cerrar sesión: el próximo usuario del teléfono no debe recibir avisos ajenos. */
export async function cancelarRecordatorios(): Promise<void> {
  ultimasClases = [];
  if (!soportado()) return;
  try {
    await cancelarPorPrefijo(PREFIJO);
  } catch {
    // nada que hacer
  }
}
