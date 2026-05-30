import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
  useAntecedentePersonal,
  useCreateAntecedentePersonal,
  useUpdateAntecedentePersonal,
  useAntecedenteMedico,
  useCreateAntecedenteMedico,
  useUpdateAntecedenteMedico,
  useAntecedenteFamiliar,
  useCreateAntecedenteFamiliar,
  useUpdateAntecedenteFamiliar,
  useAntecedenteCumplimiento,
  useCreateAntecedenteCumplimiento,
  useUpdateAntecedenteCumplimiento,
} from '@hooks/useAnamnesis';
import { useBloodType } from '@hooks/useCatalog';
import Button from '@ui/Button';
import './Antecedente.css';

const initialFormPersonal = {
  esta_embarazada: false,
  mac: false,
  otros: '',
  psicosocial: '',
  vacunas: '',
  hepatitis_b: false,
  grupo_sanguineo_desc: '',
  fuma: false,
  cigarrillos_dia: '',
  toma_te: false,
  tazas_te_dia: '',
  toma_alcohol: '',
  frecuencia_alcohol: '',
  aprieta_dientes: false,
  momento_aprieta: '',
  rechina: false,
  dolor_muscular: false,
  chupa_dedo: false,
  muerde_objetos: false,
  muerde_labios: false,
  otros_habitos: '',
  frecuencia_cepillado: '',
  cepillo_duro: false,
  cepillo_mediano: false,
  cepillo_blando: false,
  cepillo_electrico: false,
  cepillo_interproximal: false,
  tipo_interproximal: '',
  seda_dental: false,
  enjuague_bucal: false,
  otros_elementos_higiene: '',
};

const initialFormMedico = {
  salud_general: 'Regular',
  bajo_tratamiento: false,
  tipo_tratamiento: '',
  hospitalizaciones: '',
  tuvo_traumatismos: false,
  tipo_traumatismos: '',
  alergias: '',
  medicamentos_contraindicados: '',
  enf_hepatitis: false,
  enf_alergia_cronica: false,
  enf_corazon: false,
  enf_fiebre_reumatica: false,
  enf_anemia: false,
  enf_asma: false,
  enf_diabetes: false,
  enf_epilepsia: false,
  enf_coagulacion: false,
  enf_tbc: false,
  enf_hipertension: false,
  enf_ulcera: false,
  enf_neurologica: false,
  otras_enf_patologicas: '',
  odontologicos: '',
};

const initialFormFamiliar = {
  descripcion: '',
};

const initialFormCumplimiento = {
  motivo_dolor: false,
  motivo_control: false,
  frecuencia_control_meses: '',
  motivo_limpieza: false,
  frecuencia_limpieza_meses: '',
  actitud_tranquilo: false,
  actitud_aprensivo: false,
  actitud_panico: false,
  desagrado_atencion: '',
  fecha_consentimiento: '',
  firma_nombre: '',
  historia_elaborada_por: '',
};

// Componente para seleccionar grupo sanguíneo usando select HTML nativo
function BloodTypeSelectorComponent({ value, onChange }) {
  const { data: bloodTypeData, isLoading, error } = useBloodType();

  if (isLoading) return <div style={{ padding: '0.75rem' }}>Cargando...</div>;
  if (error)
    return (
      <div style={{ padding: '0.75rem', color: 'red' }}>
        Error cargando grupo sanguíneo
      </div>
    );

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="border-2 border-[var(--color-primary-soft)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--color-primary)]"
    >
      <option value="">Seleccione grupo sanguíneo</option>
      {bloodTypeData?.map((item) => (
        <option
          key={item.nombre || item.descripcion}
          value={item.nombre || item.descripcion}
        >
          {item.nombre || item.descripcion}
        </option>
      ))}
    </select>
  );
}

function AntecedentePersonal() {
  const { id } = useParams();
  const { data: dataPersonal, isLoading: loadingPersonal } =
    useAntecedentePersonal(id);
  const { data: dataMedico, isLoading: loadingMedico } =
    useAntecedenteMedico(id);
  const { data: dataFamiliar, isLoading: loadingFamiliar } =
    useAntecedenteFamiliar(id);
  const { data: dataCumplimiento, isLoading: loadingCumplimiento } =
    useAntecedenteCumplimiento(id);

  const createPersonal = useCreateAntecedentePersonal();
  const updatePersonal = useUpdateAntecedentePersonal();
  const createMedico = useCreateAntecedenteMedico();
  const updateMedico = useUpdateAntecedenteMedico();
  const createFamiliar = useCreateAntecedenteFamiliar();
  const updateFamiliar = useUpdateAntecedenteFamiliar();
  const createCumplimiento = useCreateAntecedenteCumplimiento();
  const updateCumplimiento = useUpdateAntecedenteCumplimiento();

  const [formPersonal, setFormPersonal] = useState(initialFormPersonal);
  const [formMedico, setFormMedico] = useState(initialFormMedico);
  const [formFamiliar, setFormFamiliar] = useState(initialFormFamiliar);
  const [formCumplimiento, setFormCumplimiento] = useState(
    initialFormCumplimiento
  );
  const [editModePersonal, setEditModePersonal] = useState(false);
  const [editModeMedico, setEditModeMedico] = useState(false);
  const [editModeFamiliar, setEditModeFamiliar] = useState(false);
  const [editModeCumplimiento, setEditModeCumplimiento] = useState(false);

  // Función para normalizar datos desde la BD
  const normalizeDataFromDB = async (dbData, initialFormRef) => {
    console.log('id_grupo_sanguineo value:', dbData.id_grupo_sanguineo);
    const normalized = {};

    // PRIMERO: Convertir id_grupo_sanguineo a nombre si existe
    if (dbData.id_grupo_sanguineo) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/catalogo/catalogo_grupo_sanguineo/${dbData.id_grupo_sanguineo}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched blood type name:', data.nombre);
          normalized['grupo_sanguineo_desc'] = data.nombre || '';
        }
      } catch (err) {
        console.error('Error converting ID to blood type name:', err);
      }
    }

    // SEGUNDO: Procesar todos los otros campos
    Object.keys(initialFormRef).forEach((key) => {
      // Skip id_grupo_sanguineo y grupo_sanguineo_desc ya que fueron procesados
      if (key === 'id_grupo_sanguineo' || key === 'grupo_sanguineo_desc')
        return;

      const value = dbData[key];
      const initialValue = initialFormRef[key];

      // Si el valor inicial es booleano, convertir el valor de BD a booleano
      if (typeof initialValue === 'boolean') {
        // Maneja: true, false, 1, 0, "true", "false", "1", "0", null, undefined
        if (value === null || value === undefined) {
          normalized[key] = false;
        } else if (typeof value === 'boolean') {
          normalized[key] = value;
        } else if (typeof value === 'number') {
          normalized[key] = value !== 0;
        } else if (typeof value === 'string') {
          normalized[key] =
            value.toLowerCase() === 'true' || value === '1' || value === 'yes';
        } else {
          normalized[key] = Boolean(value);
        }
      }
      // Si el valor inicial es string, mantener como string (o vacío si null)
      else if (typeof initialValue === 'string') {
        if (value === null || value === undefined) {
          normalized[key] = '';
        }
        // Convertir fechas ISO a formato yyyy-MM-dd
        else if (
          (key.includes('fecha') || key.includes('date')) &&
          typeof value === 'string'
        ) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            normalized[key] = `${year}-${month}-${day}`;
          } else {
            normalized[key] = String(value);
          }
        } else {
          normalized[key] = String(value);
        }
      }
      // Para otros tipos, mantener el valor tal cual
      else {
        normalized[key] = value || initialValue;
      }
    });

    console.log('Final normalized data:', normalized);
    return normalized;
  };

  useEffect(() => {
    if (dataPersonal) {
      normalizeDataFromDB(dataPersonal, initialFormPersonal).then(
        (normalizedData) => {
          console.log(
            'grupo_sanguineo_desc:',
            normalizedData.grupo_sanguineo_desc
          );
          console.log('Normalized data:', normalizedData);
          setFormPersonal({ ...initialFormPersonal, ...normalizedData });
          setEditModePersonal(true);
        }
      );
    } else {
      setFormPersonal(initialFormPersonal);
      setEditModePersonal(false);
    }
  }, [dataPersonal]);

  useEffect(() => {
    if (dataMedico) {
      normalizeDataFromDB(dataMedico, initialFormMedico).then(
        (normalizedData) => {
          setFormMedico({ ...initialFormMedico, ...normalizedData });
          setEditModeMedico(true);
        }
      );
    } else {
      setFormMedico(initialFormMedico);
      setEditModeMedico(false);
    }
  }, [dataMedico]);

  useEffect(() => {
    if (dataFamiliar) {
      normalizeDataFromDB(dataFamiliar, initialFormFamiliar).then(
        (normalizedData) => {
          setFormFamiliar({ ...initialFormFamiliar, ...normalizedData });
          setEditModeFamiliar(true);
        }
      );
    } else {
      setFormFamiliar(initialFormFamiliar);
      setEditModeFamiliar(false);
    }
  }, [dataFamiliar]);

  useEffect(() => {
    if (dataCumplimiento) {
      normalizeDataFromDB(dataCumplimiento, initialFormCumplimiento).then(
        (normalizedData) => {
          setFormCumplimiento({
            ...initialFormCumplimiento,
            ...normalizedData,
          });
          setEditModeCumplimiento(true);
        }
      );
    } else {
      setFormCumplimiento(initialFormCumplimiento);
      setEditModeCumplimiento(false);
    }
  }, [dataCumplimiento]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue =
      type === 'checkbox'
        ? checked
        : type === 'number'
          ? value === ''
            ? ''
            : Number(value)
          : value;

    // Determina si pertenece a formulario personal, médico, familiar o cumplimiento
    if (name in initialFormPersonal) {
      setFormPersonal((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    } else if (name in initialFormMedico) {
      setFormMedico((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    } else if (name in initialFormFamiliar) {
      setFormFamiliar((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    } else if (name in initialFormCumplimiento) {
      setFormCumplimiento((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
  };

  // Función para limpiar campos vacíos y convertirlos a null SOLO para envío
  const cleanFormDataForSubmit = (data) => {
    const cleaned = {};
    Object.keys(data).forEach((key) => {
      let value = data[key];
      // Si es string vacío, undefined o NaN, convertir a null
      if (
        value === '' ||
        value === undefined ||
        (typeof value === 'number' && isNaN(value))
      ) {
        cleaned[key] = null;
      }
      // Convertir fechas yyyy-MM-dd a ISO format
      else if (
        (key.includes('fecha') || key.includes('date')) &&
        typeof value === 'string' &&
        value.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        const date = new Date(value + 'T00:00:00Z');
        cleaned[key] = date.toISOString();
      } else {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();

    if (!id) {
      toast.error('Error: ID de historia no disponible.');
      return;
    }

    try {
      // Ejecutar todas las operaciones en paralelo
      const promises = [];

      // Personal
      const cleanedPersonal = cleanFormDataForSubmit(formPersonal);
      if (editModePersonal) {
        promises.push(
          updatePersonal.mutateAsync({ idHistoria: id, data: cleanedPersonal })
        );
      } else {
        promises.push(
          createPersonal.mutateAsync({ ...cleanedPersonal, id_historia: id })
        );
      }

      // Médico
      const cleanedMedico = cleanFormDataForSubmit(formMedico);
      if (editModeMedico) {
        promises.push(
          updateMedico.mutateAsync({ idHistoria: id, data: cleanedMedico })
        );
      } else {
        promises.push(
          createMedico.mutateAsync({ ...cleanedMedico, id_historia: id })
        );
      }

      // Familiar
      const cleanedFamiliar = cleanFormDataForSubmit(formFamiliar);
      if (editModeFamiliar) {
        promises.push(
          updateFamiliar.mutateAsync({ idHistoria: id, data: cleanedFamiliar })
        );
      } else {
        promises.push(
          createFamiliar.mutateAsync({ ...cleanedFamiliar, id_historia: id })
        );
      }

      // Cumplimiento
      const cleanedCumplimiento = cleanFormDataForSubmit(formCumplimiento);
      if (editModeCumplimiento) {
        promises.push(
          updateCumplimiento.mutateAsync({
            idHistoria: id,
            data: cleanedCumplimiento,
          })
        );
      } else {
        promises.push(
          createCumplimiento.mutateAsync({
            ...cleanedCumplimiento,
            id_historia: id,
          })
        );
      }

      await Promise.all(promises);
      toast.success('Todos los antecedentes se guardaron correctamente.');
    } catch (error) {
      toast.error('Error al guardar los antecedentes: ' + error.message);
    }
  };

  if (
    loadingPersonal ||
    loadingMedico ||
    loadingFamiliar ||
    loadingCumplimiento
  )
    return <div>Cargando...</div>;

  return (
    <div className="antecedente-container">
      {/* Header Section */}
      <div className="antecedente-header">
        <h2 className="antecedente-header-title">Antecedentes</h2>
        <div className="antecedente-header-info">
          <p className="antecedente-header-label">Historia Clínica Nº:</p>
          <p className="antecedente-header-value">HC-{id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmitAll} className="antecedente-form">
        {/* ========== ANTECEDENTES PERSONALES Y MÉDICOS ========== */}
        <div className="antecedente-section">
          <h3 className="section-title">Antecedentes Personales</h3>

          <div className="subsection">
            <h4 className="subsection-title">Fisiologicos :</h4>
            <div className="fisiologicos-inline">
              <label>
                Mujeres en edad fértil: ¿Está embarazada?
                <input
                  type="checkbox"
                  name="esta_embarazada"
                  checked={formPersonal.esta_embarazada}
                  onChange={handleChange}
                />
              </label>
              <label>
                MAC
                <input
                  type="checkbox"
                  name="mac"
                  checked={formPersonal.mac}
                  onChange={handleChange}
                />
              </label>
              <div className="fisiologicos-otros">
                <label htmlFor="otros">Otros</label>
                <input
                  id="otros"
                  type="text"
                  name="otros"
                  value={formPersonal.otros}
                  onChange={handleChange}
                  className="input-text-auto"
                />
              </div>
            </div>
          </div>

          <div className="subsection">
            <h4 className="subsection-title">Generales :</h4>
            <label className="label-block">
              Psicosociales:
              <textarea
                name="psicosocial"
                value={formPersonal.psicosocial}
                onChange={handleChange}
                className="textarea"
                rows={2}
              />
            </label>
            <label className="label-block mt-2">
              Inmunizaciones y vacunas mujeres 15-19:
              <input
                type="text"
                name="vacunas"
                value={formPersonal.vacunas}
                onChange={handleChange}
                className="input-text"
              />
            </label>
          </div>

          <div className="subsection">
            <div className="form-inline-group">
              <label>
                Hepatitis B
                <input
                  type="checkbox"
                  name="hepatitis_b"
                  checked={formPersonal.hepatitis_b}
                  onChange={handleChange}
                />
              </label>
              <label htmlFor="grupo_sanguineo_desc">Grupo sanguíneo</label>
              <BloodTypeSelectorComponent
                value={formPersonal.grupo_sanguineo_desc}
                onChange={(value) =>
                  handleChange({
                    target: { name: 'grupo_sanguineo_desc', value },
                  })
                }
                id="grupo_sanguineo_desc"
              />
            </div>

            <div className="mt-4">Hábitos nocivos:</div>
            <div className="form-inline-group">
              <label>
                ¿Fuma?
                <input
                  type="checkbox"
                  name="fuma"
                  checked={formPersonal.fuma}
                  onChange={handleChange}
                />
              </label>
              <label>
                Aproximadamente
                <input
                  type="number"
                  name="cigarrillos_dia"
                  value={formPersonal.cigarrillos_dia}
                  onChange={handleChange}
                  className="input-number"
                />
                Cigarrillos al día.
              </label>
              <label>
                ¿Toma té, café?
                <input
                  type="checkbox"
                  name="toma_te"
                  checked={formPersonal.toma_te}
                  onChange={handleChange}
                />
              </label>
              <label>
                Aproximadamente
                <input
                  type="number"
                  name="tazas_te_dia"
                  value={formPersonal.tazas_te_dia}
                  onChange={handleChange}
                  className="input-number"
                />
                Tazas al día.
              </label>
            </div>
          </div>

          <div className="subsection">
            <div className="mt-2">Bucales:</div>
            <div className="form-inline-group">
              <label>
                ¿Aprieta sus dientes?
                <input
                  type="checkbox"
                  name="aprieta_dientes"
                  checked={formPersonal.aprieta_dientes}
                  onChange={handleChange}
                />
              </label>
              <label>
                ¿En qué momento del día?
                <input
                  type="text"
                  name="momento_aprieta"
                  value={formPersonal.momento_aprieta}
                  onChange={handleChange}
                  className="input-text"
                  style={{ width: '200px' }}
                />
              </label>
              <label>
                ¿Rechina sus dientes durante la noche?
                <input
                  type="checkbox"
                  name="rechina"
                  checked={formPersonal.rechina}
                  onChange={handleChange}
                />
              </label>
              <label>
                ¿Por la mañana le duele los músculos de la cara o el cuello?
                <input
                  type="checkbox"
                  name="dolor_muscular"
                  checked={formPersonal.dolor_muscular}
                  onChange={handleChange}
                />
              </label>
              <label>
                ¿Se chupa el dedo?
                <input
                  type="checkbox"
                  name="chupa_dedo"
                  checked={formPersonal.chupa_dedo}
                  onChange={handleChange}
                />
              </label>
              <label>
                ¿Muerde otros objetos?
                <input
                  type="checkbox"
                  name="muerde_objetos"
                  checked={formPersonal.muerde_objetos}
                  onChange={handleChange}
                />
              </label>
              <label>
                ¿Se muerde el labio, lengua?
                <input
                  type="checkbox"
                  name="muerde_labios"
                  checked={formPersonal.muerde_labios}
                  onChange={handleChange}
                />
              </label>
              <div className="fisiologicos-otros">
                <label htmlFor="otros_habitos">Otros</label>
                <input
                  id="otros_habitos"
                  type="text"
                  name="otros_habitos"
                  value={formPersonal.otros_habitos}
                  onChange={handleChange}
                  className="input-text-auto"
                />
              </div>
            </div>
          </div>

          <div className="subsection">
            <div className="mt-2">Hábitos de higiene bucal:</div>
            <div className="form-inline-group">
              <label>
                ¿Con qué frecuencia se cepilla sus dientes?
                <input
                  type="number"
                  name="frecuencia_cepillado"
                  value={formPersonal.frecuencia_cepillado}
                  onChange={handleChange}
                  className="input-number"
                />
                Veces al día.
              </label>
            </div>
            <div className="mt-2">Marque los elementos que emplea:</div>
            <div className="form-inline-group">
              <label>
                Cepillo:
                <input
                  type="checkbox"
                  name="cepillo_duro"
                  checked={formPersonal.cepillo_duro}
                  onChange={handleChange}
                />{' '}
                Duro
                <input
                  type="checkbox"
                  name="cepillo_mediano"
                  checked={formPersonal.cepillo_mediano}
                  onChange={handleChange}
                />{' '}
                Mediano
                <input
                  type="checkbox"
                  name="cepillo_blando"
                  checked={formPersonal.cepillo_blando}
                  onChange={handleChange}
                />{' '}
                Blando
                <input
                  type="checkbox"
                  name="cepillo_electrico"
                  checked={formPersonal.cepillo_electrico}
                  onChange={handleChange}
                />{' '}
                Eléctrico
              </label>
            </div>
            <div className="form-inline-group">
              <div className="fisiologicos-otros">
                <label>
                  Cepillo interproximal
                  <input
                    type="checkbox"
                    name="cepillo_interproximal"
                    checked={formPersonal.cepillo_interproximal}
                    onChange={handleChange}
                  />
                  (Tipo)
                </label>
                <input
                  type="text"
                  name="tipo_interproximal"
                  value={formPersonal.tipo_interproximal}
                  onChange={handleChange}
                  className="input-text-auto"
                />
              </div>
            </div>
            <div className="form-inline-group">
              <label>
                Seda dental
                <input
                  type="checkbox"
                  name="seda_dental"
                  checked={formPersonal.seda_dental}
                  onChange={handleChange}
                />
              </label>
              <label>
                Enjuague bucal
                <input
                  type="checkbox"
                  name="enjuague_bucal"
                  checked={formPersonal.enjuague_bucal}
                  onChange={handleChange}
                />
              </label>
              <div className="fisiologicos-otros">
                <label htmlFor="otros_elementos_higiene">Otros</label>
                <input
                  id="otros_elementos_higiene"
                  type="text"
                  name="otros_elementos_higiene"
                  value={formPersonal.otros_elementos_higiene}
                  onChange={handleChange}
                  className="input-text-auto"
                />
              </div>
            </div>
          </div>
        </div>
        {/* ========== ANTECEDENTES MÉDICOS ========== */}
        <div className="antecedente-section">
          <h3 className="section-title">Antecedentes Médicos</h3>

          <div className="subsection">
            <h4 className="subsection-title">
              ¿Cuál es la estimación de su salud general?
            </h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="salud_general"
                  value="Buena"
                  checked={formMedico.salud_general === 'Buena'}
                  onChange={handleChange}
                />{' '}
                Buena
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="salud_general"
                  value="Regular"
                  checked={formMedico.salud_general === 'Regular'}
                  onChange={handleChange}
                />{' '}
                Regular
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="salud_general"
                  value="Mala"
                  checked={formMedico.salud_general === 'Mala'}
                  onChange={handleChange}
                />{' '}
                Mala
              </label>
            </div>
          </div>

          <div className="subsection">
            <div className="form-inline-group-block">
              <label>
                ¿Esta bajo tratamiento medico?
                <input
                  type="checkbox"
                  name="bajo_tratamiento"
                  checked={formMedico.bajo_tratamiento}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                ¿De que tipo?
                <input
                  type="text"
                  name="tipo_tratamiento"
                  value={formMedico.tipo_tratamiento}
                  onChange={handleChange}
                  className="input-full-width"
                />
              </label>
            </div>
          </div>

          <div className="subsection">
            <label className="label-block">
              ¿Estuvo hospitalizado, ha tenido operaciones? (Tipo,
              complicaciones)
              <textarea
                name="hospitalizaciones"
                value={formMedico.hospitalizaciones}
                onChange={handleChange}
                className="textarea"
                rows={2}
              />
            </label>
            <div className="form-inline-group-block">
              <label>
                ¿Ha tenido traumatismo, accidentes?
                <input
                  type="checkbox"
                  name="tuvo_traumatismos"
                  checked={formMedico.tuvo_traumatismos}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                ¿De que tipo?
                <input
                  type="text"
                  name="tipo_traumatismos"
                  value={formMedico.tipo_traumatismos}
                  onChange={handleChange}
                  className="input-full-width"
                />
              </label>
            </div>
          </div>

          <div className="subsection">
            <div className="form-inline-group-block">
              <label>
                ¿Es alérgico a algún medicamento, anestésico o alimento? ¿Cuál
                es?
                <input
                  type="text"
                  name="alergias"
                  value={formMedico.alergias}
                  onChange={handleChange}
                  className="input-full-width"
                />
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                Tiene algún medicamento prohibido o contraindicado? ¿Cual es?
                <input
                  type="text"
                  name="medicamentos_contraindicados"
                  value={formMedico.medicamentos_contraindicados}
                  onChange={handleChange}
                  className="input-full-width"
                />
              </label>
            </div>
          </div>

          <div className="subsection">
            <h4 className="subsection-title mb-2">
              Ha tenido alguna de las siguientes enfermedades:
            </h4>
            <div className="checkbox-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_hepatitis"
                  checked={formMedico.enf_hepatitis}
                  onChange={handleChange}
                />{' '}
                Hepatitis
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_alergia_cronica"
                  checked={formMedico.enf_alergia_cronica}
                  onChange={handleChange}
                />{' '}
                Alergia
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_corazon"
                  checked={formMedico.enf_corazon}
                  onChange={handleChange}
                />{' '}
                Algun tipo de enf. al corazon
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_fiebre_reumatica"
                  checked={formMedico.enf_fiebre_reumatica}
                  onChange={handleChange}
                />{' '}
                Fiebre Reumática
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_anemia"
                  checked={formMedico.enf_anemia}
                  onChange={handleChange}
                />{' '}
                Anemia
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_asma"
                  checked={formMedico.enf_asma}
                  onChange={handleChange}
                />{' '}
                Asma
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_diabetes"
                  checked={formMedico.enf_diabetes}
                  onChange={handleChange}
                />{' '}
                Diabetes
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_epilepsia"
                  checked={formMedico.enf_epilepsia}
                  onChange={handleChange}
                />{' '}
                Epilepsia
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_coagulacion"
                  checked={formMedico.enf_coagulacion}
                  onChange={handleChange}
                />{' '}
                Problemas de coagulacion o cicatrizacion
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_tbc"
                  checked={formMedico.enf_tbc}
                  onChange={handleChange}
                />{' '}
                TBC
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_hipertension"
                  checked={formMedico.enf_hipertension}
                  onChange={handleChange}
                />{' '}
                Hipertension
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_ulcera"
                  checked={formMedico.enf_ulcera}
                  onChange={handleChange}
                />{' '}
                Ulcera estomacal duodenal
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="enf_neurologica"
                  checked={formMedico.enf_neurologica}
                  onChange={handleChange}
                />{' '}
                Afeccion neurologica o psiquica
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                Especifique o indique otra que no haya sido mencionada:
                <input
                  type="text"
                  name="otras_enf_patologicas"
                  value={formMedico.otras_enf_patologicas}
                  onChange={handleChange}
                  className="input-full-width"
                />
              </label>
            </div>
          </div>

          <div className="subsection">
            <label className="label-block" htmlFor="odontologicos">
              Antecedentes Odontologicos:
            </label>
            <textarea
              id="odontologicos"
              name="odontologicos"
              value={formMedico.odontologicos}
              onChange={handleChange}
              className="textarea"
              rows={2}
            />
          </div>
        </div>
        {/* ========== ANTECEDENTES FAMILIARES ========== */}
        <div className="antecedente-section">
          <h3 className="section-title">Antecedentes Familiares</h3>

          <label className="label-block" htmlFor="descripcion">
            Antecedentes Familiares:
            <div className="description-text">
              (Vivos, sanos, fallecidos, motivo, si alguno ha parecido diabetes,
              cáncer, infarto, alergias o problemas de coagulación, quién?
              Antecedentes Enf.periodontal? y/o desdentamiento prematuro).
            </div>
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formFamiliar.descripcion}
            onChange={handleChange}
            className="textarea"
            rows={4}
            placeholder="Ingrese los antecedentes familiares relevantes..."
          />
        </div>{' '}
        {/* ========== ANTECEDENTE CUMPLIMIENTO Y CONSENTIMIENTO ========== */}
        <div className="antecedente-section">
          <h3 className="section-title">Motivación y Consentimiento</h3>

          <div className="subsection">
            <h4 className="subsection-title">Voy al dentista:</h4>
            <div className="form-inline-group-block">
              <label>
                <input
                  type="checkbox"
                  name="motivo_dolor"
                  checked={formCumplimiento.motivo_dolor}
                  onChange={handleChange}
                />
                <span>
                  Solo cuando tengo dolor u otro problema de importancia
                </span>
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                <input
                  type="checkbox"
                  name="motivo_control"
                  checked={formCumplimiento.motivo_control}
                  onChange={handleChange}
                />
                <span>
                  Regularmente en el año, por control y prevención. En promedio
                </span>
                <input
                  type="number"
                  name="frecuencia_control_meses"
                  value={formCumplimiento.frecuencia_control_meses}
                  onChange={handleChange}
                  className="input-number"
                  placeholder="meses"
                />
                <span className="ml-1">meses</span>
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                <input
                  type="checkbox"
                  name="motivo_limpieza"
                  checked={formCumplimiento.motivo_limpieza}
                  onChange={handleChange}
                />
                <span>Solo para hacerme limpiezas. En promedio</span>
                <input
                  type="number"
                  name="frecuencia_limpieza_meses"
                  value={formCumplimiento.frecuencia_limpieza_meses}
                  onChange={handleChange}
                  className="input-number"
                  placeholder="meses"
                />
                <span className="ml-1">meses</span>
              </label>
            </div>
          </div>

          <div className="subsection">
            <h4 className="subsection-title">
              Con respecto a la atención dental:
            </h4>
            <div className="form-inline-group-block">
              <label>
                <input
                  type="checkbox"
                  name="actitud_tranquilo"
                  checked={formCumplimiento.actitud_tranquilo}
                  onChange={handleChange}
                />
                <span>Soy muy tranquilo(a)</span>
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                <input
                  type="checkbox"
                  name="actitud_aprensivo"
                  checked={formCumplimiento.actitud_aprensivo}
                  onChange={handleChange}
                />
                <span>Soy aprensivo y nervioso(a)</span>
              </label>
            </div>
            <div className="form-inline-group-block">
              <label>
                <input
                  type="checkbox"
                  name="actitud_panico"
                  checked={formCumplimiento.actitud_panico}
                  onChange={handleChange}
                />
                <span>Le tengo pánico</span>
              </label>
            </div>
          </div>

          <div className="subsection">
            <div className="form-inline-group-block">
              <label>
                Lo que más me desagrada de la atención dental es:
                <input
                  type="text"
                  name="desagrado_atencion"
                  value={formCumplimiento.desagrado_atencion}
                  onChange={handleChange}
                  className="input-full-width mt-2"
                  placeholder="Ej: el ruido, agujas, etc."
                />
              </label>
            </div>
          </div>

          <div className="border-top">
            <p className="consent-text">
              Por este medio certifico haber contestado de la manera más precisa
              posible y veraz y doy mi consentimiento para ser examinado(a) o
              ser atendido(a) de urgencia si la situación así lo amerite.
            </p>

            <div className="grid-2-cols">
              <label>
                Fecha:
                <input
                  type="date"
                  name="fecha_consentimiento"
                  value={formCumplimiento.fecha_consentimiento}
                  onChange={handleChange}
                  className="input-full-width"
                />
              </label>
              <label>
                Firma y Nombre:
                <input
                  type="text"
                  name="firma_nombre"
                  value={formCumplimiento.firma_nombre}
                  onChange={handleChange}
                  className="input-full-width"
                  placeholder="Nombre completo y/o firma"
                />
              </label>
            </div>

            <label className="label-block mt-4">
              Historia clínica elaborada por Alumno:
              <input
                type="text"
                name="historia_elaborada_por"
                value={formCumplimiento.historia_elaborada_por}
                onChange={handleChange}
                className="input-full-width"
                placeholder="Nombre del alumno"
              />
            </label>
          </div>
        </div>
        {/* BOTÓN ÚNICO */}
        <div
          className="antecedente-section"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            type="submit"
            className="button-submit"
            style={{ width: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}
          >
            {editModePersonal ||
            editModeMedico ||
            editModeFamiliar ||
            editModeCumplimiento
              ? 'Actualizar'
              : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AntecedentePersonal;
