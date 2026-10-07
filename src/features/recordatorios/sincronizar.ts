import dayjs from 'dayjs';

import { AppRole } from '../../core/auth/types';
import { ClaseRecordable, sincronizarRecordatorios } from '../../core/notifications/recordatorios';
import { AlumnoRepository } from '../alumno/alumnoRepository';
import { InstructorRepository } from '../instructor/instructorRepository';

const ESTADOS_SIN_AVISO = ['realizada', 'cancelada', 'bloqueado'];

/** Clases del alumno (prácticas y teóricas) tal como vienen en `mis_clases`. */
export function clasesAlumno(misClases: Record<string, unknown>[]): ClaseRecordable[] {
  return misClases
    .filter((c) => !ESTADOS_SIN_AVISO.includes(String(c.estado ?? '')))
    .map((c) => ({
      id: c.id as number,
      fecha: String(c.fecha ?? ''),
      hora_inicio: String(c.hora_inicio ?? ''),
      tipo_clase: (c.tipo_clase as string) ?? null,
    }));
}

/** Bloques del instructor con alumno (prácticas reservadas o teóricas con inscritos). */
export function clasesInstructor(bloques: Record<string, unknown>[]): ClaseRecordable[] {
  return bloques
    .filter((b) => {
      if (b.tipo_clase === 'teorica') return ((b.inscritos as unknown[]) ?? []).length > 0;
      return b.estado === 'reservado';
    })
    .map((b) => {
      const nombre = [b.alumno_nombre, b.alumno_apellido].filter(Boolean).join(' ');
      return {
        id: b.id as number,
        fecha: String(b.fecha ?? ''),
        hora_inicio: String(b.hora_inicio ?? ''),
        tipo_clase: (b.tipo_clase as string) ?? null,
        detalle: b.tipo_clase === 'teorica' ? `${((b.inscritos as unknown[]) ?? []).length} alumnos inscritos.` : nombre ? `Con ${nombre}.` : null,
      };
    });
}

/**
 * Trae del servidor las clases futuras del usuario y deja programados sus
 * recordatorios. Se llama al abrir la app; nunca lanza.
 */
export async function sincronizarRecordatoriosDesdeServidor(rol: AppRole): Promise<number> {
  try {
    if (rol === 'alumno') {
      const datos = await AlumnoRepository.disponibles({ tipo: 'practica' });
      return sincronizarRecordatorios(clasesAlumno((datos.mis_clases as Record<string, unknown>[]) ?? []));
    }
    if (rol === 'instructor') {
      const [estaSemana, proxima] = await Promise.all([
        InstructorRepository.agenda(dayjs().format('YYYY-MM-DD')),
        InstructorRepository.agenda(dayjs().add(7, 'day').format('YYYY-MM-DD')),
      ]);
      const bloques = [
        ...((estaSemana.bloques as Record<string, unknown>[]) ?? []),
        ...((proxima.bloques as Record<string, unknown>[]) ?? []),
      ];
      return sincronizarRecordatorios(clasesInstructor(bloques));
    }
  } catch {
    // Sin red, pago pendiente, etc.: se reintenta la próxima vez que abra la app.
  }
  return 0;
}
