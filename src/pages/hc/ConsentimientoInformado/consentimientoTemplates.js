/**
 * Templates de Consentimiento Informado — Clínica Odontológica UNJBG
 * RF-09: Alineados con Anexo 6 del reglamento de la clínica.
 *
 * Cada template es una función que recibe los datos del paciente/tutor
 * y retorna el texto completo del documento.
 *
 * Decisión: Los templates viven en el frontend para permitir impresión
 * sin depender de la red. Si en el futuro se requiere versionar templates
 * por año académico, moverlos al backend.
 */

export const TIPOS_TEMPLATE = [
  {
    value: 'adulto_general',
    label: 'Adulto — Procedimientos generales',
    descripcion:
      'Para tratamientos odontológicos generales en pacientes mayores de 18 años.',
  },
  {
    value: 'cirugia_oral',
    label: 'Cirugía Oral / Exodoncia',
    descripcion:
      'Para extracciones, cirugías menores y procedimientos invasivos.',
  },
  {
    value: 'menor_de_edad',
    label: 'Menor de edad',
    descripcion:
      'Para pacientes menores de 18 años. Requiere firma del padre/madre/tutor.',
  },
  {
    value: 'anestesia_local',
    label: 'Anestesia Local',
    descripcion:
      'Consentimiento específico para la aplicación de anestesia local.',
  },
];

const INSTITUCION = `CLÍNICA ODONTOLÓGICA BASADRINA
Universidad Nacional Jorge Basadre Grohmann — UNJBG
Ciudad Universitaria, Tacna — Perú`;

const firma = (nombrePaciente, responsable, fecha) => `
CONSENTIMIENTO Y FIRMA
───────────────────────────────────────────────────────────────

Nombre del paciente:  ${nombrePaciente}
${responsable ? `Nombre del responsable/tutor: ${responsable}\n` : ''}
Fecha:  ${fecha || new Date().toLocaleDateString('es-PE')}


___________________________             ___________________________
Firma del paciente / tutor              Firma del alumno tratante


___________________________
Firma del Docente responsable
`;

// ── Templates ────────────────────────────────────────────────────────────────

export function templateAdultoGeneral({ nombrePaciente, fecha }) {
  return `${INSTITUCION}

CONSENTIMIENTO INFORMADO — TRATAMIENTO ODONTOLÓGICO GENERAL

Yo, ${nombrePaciente}, identificado(a) con DNI o documento de identidad,
declaro que:

1. He sido informado(a) por el alumno tratante sobre el diagnóstico de mi
   condición oral, los procedimientos odontológicos que se realizarán, los
   beneficios esperados, los posibles riesgos y complicaciones inherentes al
   tratamiento, y las alternativas terapéuticas disponibles.

2. He tenido la oportunidad de formular preguntas, las cuales han sido
   respondidas de manera satisfactoria.

3. Comprendo que la Clínica Odontológica Basadrina es un centro de formación
   universitaria y que los tratamientos serán realizados por alumnos supervisados
   directamente por docentes habilitados.

4. Autorizo la toma de fotografías, radiografías y cualquier otro registro
   diagnóstico necesario para la atención y con fines académicos, manteniendo
   la confidencialidad de mis datos personales.

5. Me comprometo a asistir puntualmente a las citas programadas y a seguir las
   indicaciones post-operatorias brindadas.

6. Soy libre de retirar este consentimiento en cualquier momento sin que ello
   afecte negativamente la atención que recibo.

${firma(nombrePaciente, null, fecha)}`;
}

export function templateCirugiaOral({ nombrePaciente, fecha }) {
  return `${INSTITUCION}

CONSENTIMIENTO INFORMADO — CIRUGÍA ORAL / EXODONCIA

Yo, ${nombrePaciente}, declaro que:

1. Se me ha informado sobre la necesidad de realizar el procedimiento quirúrgico
   indicado (exodoncia simple, exodoncia compleja, cirugía periapical u otro
   procedimiento de cirugía oral).

2. Entiendo que durante el procedimiento se realizará anestesia local y que
   podré sentir presión o movimiento, pero no dolor agudo. De presentarse
   molestias, debo comunicarlo inmediatamente al alumno tratante.

3. Reconozco que todo procedimiento quirúrgico conlleva riesgos inherentes,
   que incluyen pero no se limitan a: inflamación post-operatoria, hematoma,
   infección, dolor, alveolitis, y en casos excepcionales, lesión a estructuras
   anatómicas adyacentes.

4. He recibido información sobre los cuidados post-operatorios y las
   indicaciones de higiene para la zona intervenida.

5. En caso de cualquier complicación post-operatoria, me comprometo a acudir
   a la clínica en el horario de atención o a una emergencia si la situación
   lo requiere.

6. Autorizo al equipo docente a tomar decisiones clínicas necesarias durante
   el procedimiento, en beneficio de mi salud.

${firma(nombrePaciente, null, fecha)}`;
}

export function templateMenorDeEdad({
  nombrePaciente,
  nombreResponsable,
  fecha,
}) {
  return `${INSTITUCION}

CONSENTIMIENTO INFORMADO — PACIENTE MENOR DE EDAD

Yo, ${nombreResponsable || '___________________________'},
en calidad de padre / madre / tutor legal del menor:

Nombre del paciente:  ${nombrePaciente}

Declaro que:

1. He sido informado(a) por el alumno tratante sobre el diagnóstico de la
   condición oral del menor, los procedimientos a realizar, los beneficios
   esperados, los posibles riesgos, complicaciones y alternativas terapéuticas.

2. Autorizo la realización de los procedimientos odontológicos necesarios para
   la salud bucal del menor, incluyendo la toma de radiografías y fotografías
   con fines clínicos y académicos.

3. Me comprometo a acompañar al menor en cada cita programada y a asegurar
   el seguimiento de las indicaciones brindadas por el equipo tratante.

4. Comprendo que los tratamientos serán realizados por alumnos supervisados
   por docentes habilitados de la Clínica Odontológica Basadrina — UNJBG.

5. Soy libre de retirar este consentimiento en cualquier momento sin perjuicio
   de la atención del menor.

${firma(nombrePaciente, nombreResponsable || '___________________________', fecha)}`;
}

export function templateAnestesiaLocal({ nombrePaciente, fecha }) {
  return `${INSTITUCION}

CONSENTIMIENTO INFORMADO — ANESTESIA LOCAL ODONTOLÓGICA

Yo, ${nombrePaciente}, declaro que:

1. Se me ha informado que el procedimiento odontológico programado requiere
   la aplicación de anestesia local para garantizar mi comodidad y la correcta
   ejecución del tratamiento.

2. Se me ha explicado el tipo de anestésico a utilizar, la técnica de
   aplicación (infiltrativa o troncular según corresponda) y el tiempo de
   duración aproximado del efecto.

3. Declaro no ser alérgico(a) a ningún tipo de anestésico local. En caso de
   duda, he informado al alumno tratante para que se realicen las pruebas
   correspondientes o se busque una alternativa.

4. Comprendo que los efectos secundarios más frecuentes son: entumecimiento
   temporal de labios, lengua o mejillas, molestia leve en el punto de
   inyección y, en casos poco frecuentes, hematoma o trismo transitorio.

5. Entiendo que debo informar inmediatamente si experimento palpitaciones,
   mareos, dificultad para respirar u otra reacción inusual durante el
   procedimiento.

6. Autorizo la aplicación de anestesia local en la cantidad y técnica que el
   equipo tratante considere necesaria para la correcta ejecución del
   tratamiento planificado.

${firma(nombrePaciente, null, fecha)}`;
}

export const GENERADORES_TEMPLATE = {
  adulto_general: templateAdultoGeneral,
  cirugia_oral: templateCirugiaOral,
  menor_de_edad: templateMenorDeEdad,
  anestesia_local: templateAnestesiaLocal,
};
