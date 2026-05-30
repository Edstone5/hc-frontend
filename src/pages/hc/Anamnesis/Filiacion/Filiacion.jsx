import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import FormField from '@ui/FormField/FormField';
import Button from '@ui/Button';
import {
  useFiliacion,
  useUpdateFiliacion,
  useCreateFiliacion,
} from '@hooks/useAnamnesis';
import { usePatientByHistory, useAssignPatient } from '@hooks/useHistoria';
import { useCreatePatient, useUpdatePatient } from '@hooks/usePatients';
import { useCatalog } from '@hooks/useCatalog';
import './Filiacion.css';

function Filiacion() {
  // Catálogos para selects
  const { data: sexoCatalog } = useCatalog('catalogo_sexo');
  const { data: estadoCivilCatalog } = useCatalog('catalogo_estado_civil');
  const { data: ocupacionCatalog } = useCatalog('catalogo_ocupacion');
  const { id } = useParams();
  const { data, isLoading, error } = useFiliacion(id);
  const updateFiliacion = useUpdateFiliacion();
  const createFiliacion = useCreateFiliacion();
  const { data: patient } = usePatientByHistory(id);
  const createPatient = useCreatePatient();
  const assignPatient = useAssignPatient();
  const updatePatient = useUpdatePatient();
  const [filiacionData, setFiliacionData] = useState({});

  useEffect(() => {
    // Solo cargar datos si existen, ignorar null (404)
    if (data || patient) {
      setFiliacionData({
        nombres: (data?.nombres ?? patient?.nombre) || '',
        apellidos: (data?.apellidos ?? patient?.apellido) || '',
        dni: (data?.dni ?? patient?.dni) || '',
        fecha_nacimiento:
          (data?.fecha_nacimiento ?? patient?.fecha_nacimiento)?.split(
            'T'
          )[0] || '',
        sexo: (data?.sexo ?? patient?.sexo) || '',
        telefono: (data?.telefono ?? patient?.telefono) || '',
        email: (data?.email ?? patient?.email) || '',
        // Campos exclusivos de filiación
        edad: data?.edad || '',
        raza: data?.raza || '',
        lugar: data?.lugar || '',
        estado_civil: data?.estado_civil || '',
        nombre_conyuge: data?.nombre_conyuge || '',
        ocupacion: data?.ocupacion || '',
        lugar_procedencia: data?.lugar_procedencia || '',
        tiempo_residencia_tacna: data?.tiempo_residencia_tacna || '',
        direccion: data?.direccion || '',
        telefono_emergencia: data?.telefono_emergencia || '',
        ultima_visita_dentista:
          data?.ultima_visita_dentista?.split('T')[0] || '',
        motivo_visita_dentista: data?.motivo_visita_dentista || '',
        ultima_visita_medico: data?.ultima_visita_medico?.split('T')[0] || '',
        motivo_visita_medico: data?.motivo_visita_medico || '',
        contacto_emergencia: data?.contacto_emergencia || '',
        acompaniante: data?.acompaniante || '',
        fecha_elaboracion: data?.fecha_elaboracion?.split('T')[0] || '',
      });
    }
    // No hacer nada si ambos son null (es la primera vez)
  }, [data, patient]);

  const handleChange = (eOrValue) => {
    // Si viene de un input normal
    if (eOrValue && eOrValue.target) {
      const { name, value } = eOrValue.target;
      setFiliacionData((prev) => ({ ...prev, [name]: value }));
    } else if (
      typeof eOrValue === 'object' &&
      eOrValue !== null &&
      'name' in eOrValue &&
      'value' in eOrValue
    ) {
      // Si viene de un selector personalizado que pasa { name, value }
      setFiliacionData((prev) => ({
        ...prev,
        [eOrValue.name]: eOrValue.value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación: nombre y apellido obligatorios para paciente
    if (!filiacionData.nombres || !filiacionData.apellidos) {
      toast.error(
        'Por favor, ingresa nombre y apellido (obligatorios para crear paciente).'
      );
      return;
    }
    // Validación: edad y sexo obligatorios para filiación
    if (!filiacionData.edad || !filiacionData.sexo) {
      toast.error(
        'Por favor, ingresa edad y sexo (obligatorios para crear filiación).'
      );
      return;
    }
    // Validación: fecha de última visita al dentista no puede ser mayor a la fecha de elaboración
    if (
      filiacionData.ultima_visita_dentista &&
      filiacionData.fecha_elaboracion
    ) {
      const fechaVisita = new Date(filiacionData.ultima_visita_dentista);
      const fechaElaboracion = new Date(filiacionData.fecha_elaboracion);
      fechaVisita.setHours(0, 0, 0, 0);
      fechaElaboracion.setHours(0, 0, 0, 0);
      if (fechaVisita > fechaElaboracion) {
        toast.error(
          'La fecha de última visita al dentista no puede ser mayor a la fecha de elaboración.'
        );
        return;
      }
    }
    // Convertir edad a número antes de enviar
    const filiacionPayload = {
      id_historia: id, // ¡CRÍTICO! Incluir id_historia
      edad: filiacionData.edad ? Number(filiacionData.edad) : null,
      sexo: filiacionData.sexo || null,
      raza: filiacionData.raza || null,
      fecha_nacimiento: filiacionData.fecha_nacimiento
        ? filiacionData.fecha_nacimiento
        : null,
      lugar: filiacionData.lugar || null,
      estado_civil: filiacionData.estado_civil || null,
      nombre_conyuge: filiacionData.nombre_conyuge || null,
      ocupacion: filiacionData.ocupacion || null,
      lugar_procedencia: filiacionData.lugar_procedencia || null,
      tiempo_residencia_tacna: filiacionData.tiempo_residencia_tacna || null,
      direccion: filiacionData.direccion || null,
      ultima_visita_dentista: filiacionData.ultima_visita_dentista
        ? filiacionData.ultima_visita_dentista
        : null,
      motivo_visita_dentista: filiacionData.motivo_visita_dentista || null,
      ultima_visita_medico: filiacionData.ultima_visita_medico
        ? filiacionData.ultima_visita_medico
        : null,
      motivo_visita_medico: filiacionData.motivo_visita_medico || null,
      contacto_emergencia: filiacionData.contacto_emergencia || null,
      telefono_emergencia: filiacionData.telefono_emergencia || null,
      acompaniante: filiacionData.acompaniante || null,
      fecha_elaboracion: filiacionData.fecha_elaboracion
        ? filiacionData.fecha_elaboracion
        : null,
    };

    console.log(
      'Valor enviado ultima_visita_dentista:',
      filiacionPayload.ultima_visita_dentista
    );
    try {
      let patientId = patient?.id_paciente;
      // Si no hay paciente, crearlo y asociarlo
      if (!patientId) {
        const newPatient = await createPatient.mutateAsync({
          nombre: filiacionData.nombres,
          apellido: filiacionData.apellidos,
        });
        patientId = newPatient.id;
        await assignPatient.mutateAsync({
          idHistory: id,
          idPatient: patientId,
        });
      } else {
        // Si el paciente ya existe, actualizar sus datos principales
        await updatePatient.mutateAsync({
          id: patientId,
          data: {
            nombre: filiacionData.nombres,
            apellido: filiacionData.apellidos,
          },
        });
      }
      // Guardar filiación (PUT o POST según corresponda)
      if (data) {
        await updateFiliacion.mutateAsync({
          idHistoria: id,
          filiacion: filiacionPayload,
        });
      } else {
        await createFiliacion.mutateAsync(filiacionPayload);
      }
      toast.success('Filiación guardada correctamente');
    } catch (error) {
      console.error('Error al guardar filiación:', error);
      if (
        error.message &&
        error.message.includes('chk_filiacion_ultima_visita_dentista')
      ) {
        toast.error(
          'Error: La fecha de última visita al dentista no puede ser mayor a la fecha de elaboración. Por favor, corrige la fecha.'
        );
      } else {
        toast.error(
          `Error: ${error.message || 'No se pudo guardar la filiación'}`
        );
      }
    }
  };

  if (isLoading) return <div>Cargando...</div>;

  // Si hay error distinto a 404, mostrarlo
  if (error && error.message && !error.message.includes('No se pudo obtener')) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="filiacion-container">
      {/* Header Section */}
      <div className="filiacion-header">
        <h2 className="filiacion-header-title">Filiacion</h2>
        <div className="filiacion-header-info">
          <p className="filiacion-header-label">Historia Clínica Nº:</p>
          <p className="filiacion-header-value">HC-{id}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="filiacion-form">
        {/* Nombres y Apellidos - Full width */}
        <div className="form-row">
          <FormField
            label="Nombres"
            value={filiacionData.nombres || ''}
            name="nombres"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
          <FormField
            label="Apellidos"
            value={filiacionData.apellidos || ''}
            name="apellidos"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Edad, Sexo, Raza */}
        <div className="form-row">
          <FormField
            label="Edad"
            value={filiacionData.edad || ''}
            name="edad"
            type="number"
            isFormMode={true}
            onChange={handleChange}
          />
          {/* Select Sexo */}
          <div className="form-field">
            <label htmlFor="sexo">Sexo</label>
            <select
              id="sexo"
              name="sexo"
              value={filiacionData.sexo || ''}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Seleccione sexo</option>
              {sexoCatalog?.map((item) => (
                <option
                  key={item.id_sexo || item.descripcion}
                  value={item.descripcion}
                >
                  {item.descripcion}
                </option>
              ))}
            </select>
          </div>
          {/* Raza como texto */}
          <FormField
            label="Raza"
            value={filiacionData.raza || ''}
            name="raza"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Fecha de nacimiento (2 campos) */}
        <div className="form-row">
          <FormField
            label="Fecha de nacimiento"
            value={filiacionData.fecha_nacimiento || ''}
            name="fecha_nacimiento"
            type="date"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Estado civil, Nombre del cónyuge */}
        <div className="form-row">
          {/* Select Estado Civil */}
          <div className="form-field">
            <label htmlFor="estado_civil">Estado civil</label>
            <select
              id="estado_civil"
              name="estado_civil"
              value={filiacionData.estado_civil || ''}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Seleccione estado civil</option>
              {estadoCivilCatalog?.map((item) => (
                <option
                  key={item.id_estado_civil || item.descripcion}
                  value={item.descripcion}
                >
                  {item.descripcion}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Nombre del conyuge"
            value={filiacionData.nombre_conyuge || ''}
            name="nombre_conyuge"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Ocupación, Lugar de procedencia */}
        <div className="form-row">
          {/* Select Ocupación */}
          <div className="form-field">
            <label htmlFor="ocupacion">Ocupación</label>
            <select
              id="ocupacion"
              name="ocupacion"
              value={filiacionData.ocupacion || ''}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Seleccione ocupación</option>
              {ocupacionCatalog?.map((item) => (
                <option
                  key={item.id_ocupacion || item.descripcion}
                  value={item.descripcion}
                >
                  {item.descripcion}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Lugar de procedencia"
            value={filiacionData.lugar_procedencia || ''}
            name="lugar_procedencia"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Tiempo de residencia en Tacna */}
        <div className="form-row">
          <FormField
            label="Tiempo de residencia en Tacna"
            value={filiacionData.tiempo_residencia_tacna || ''}
            name="tiempo_residencia_tacna"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* ...el resto del formulario... */}

        {/* Dirección */}
        <div className="form-row">
          <FormField
            label="Direccion"
            value={filiacionData.direccion || ''}
            name="direccion"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Última visita dentista, Motivo */}
        <div className="form-row">
          <FormField
            label="Ultima vez que visito a su dentista"
            value={filiacionData.ultima_visita_dentista || ''}
            name="ultima_visita_dentista"
            type="date"
            isFormMode={true}
            onChange={handleChange}
          />
          <FormField
            label="¿Motivo?"
            value={filiacionData.motivo_visita_dentista || ''}
            name="motivo_visita_dentista"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Última visita médico, Motivo */}
        <div className="form-row">
          <FormField
            label="Ultima vez que visito a su medico"
            value={filiacionData.ultima_visita_medico || ''}
            name="ultima_visita_medico"
            type="date"
            isFormMode={true}
            onChange={handleChange}
          />
          <FormField
            label="¿Motivo?"
            value={filiacionData.motivo_visita_medico || ''}
            name="motivo_visita_medico"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Contacto de emergencia y teléfono */}
        <div className="form-row">
          <FormField
            label="En caso necesario comunicarse con (nombre y relación)"
            value={filiacionData.contacto_emergencia || ''}
            name="contacto_emergencia"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
          <FormField
            label="Teléfono"
            value={filiacionData.telefono_emergencia || ''}
            name="telefono_emergencia"
            type="tel"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Persona que lo acompaña */}
        <div className="form-row">
          <FormField
            label="Persona que lo acompaña (nombre y relación)"
            value={filiacionData.acompaniante || ''}
            name="acompaniante"
            type="text"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Fecha de elaboración */}
        <div className="form-row">
          <FormField
            label="Fecha de elaboración"
            value={filiacionData.fecha_elaboracion || ''}
            name="fecha_elaboracion"
            type="date"
            isFormMode={true}
            onChange={handleChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button type="submit" variant="primary">
            {data ? 'Actualizar' : 'Guardar'} filiación
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Filiacion;
