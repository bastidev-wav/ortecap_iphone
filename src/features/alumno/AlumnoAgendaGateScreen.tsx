import React from 'react';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { LoadingView } from '../../shared/components/StateViews';
import { AlumnoHorarioReferenciaScreen } from './AlumnoHorarioReferenciaScreen';
import { AlumnoReservarScreen } from './AlumnoReservarScreen';
import { AlumnoRepository } from './alumnoRepository';

/**
 * Cursos profesionales (A2-A5) y Guardia de Seguridad (OS10): no reservan
 * clases individuales, solo consultan su horario de referencia.
 */
const CLASES_SIN_RESERVA_INDIVIDUAL = ['A2', 'A3', 'A4', 'A5', 'OS10'];

/**
 * Punto de entrada de la pestaña "Reservar": muestra el calendario de
 * reservas normal, o el horario de referencia de solo lectura, según el
 * tipo de curso del alumno autenticado.
 */
export function AlumnoAgendaGateScreen() {
  const { data, loading, error } = useApiQuery(() => AlumnoRepository.dashboard());

  if (loading && !data) return <LoadingView />;

  // Si el dashboard falla, priorizamos mostrar el flujo normal de reservas
  // (con su propio manejo de error) antes que dejar al alumno sin pantalla.
  if (error || !data) return <AlumnoReservarScreen />;

  const matricula = data.matricula as Record<string, unknown> | null;
  const claseLicencia = matricula?.clase_licencia as string | undefined;
  if (claseLicencia && CLASES_SIN_RESERVA_INDIVIDUAL.includes(claseLicencia)) {
    return <AlumnoHorarioReferenciaScreen />;
  }
  return <AlumnoReservarScreen />;
}
