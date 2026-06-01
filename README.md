# HC Frontend — Sistema de Historia Clínica Digital UNJBG

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev)

Frontend SPA del sistema de historia clínica digital para la **Clínica Odontológica Basadrina** de la Universidad Nacional Jorge Basadre Grohmann, Tacna, Perú.

**v2.2.0** — React 18 + Vite 5 + TanStack Query + Tailwind CSS

---

## Características principales

| Área                | Detalle                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| **Framework**       | React 18 + Vite 5 (ESM, HMR)                                              |
| **Routing**         | React Router v7                                                           |
| **Estado servidor** | TanStack Query (React Query) v5                                           |
| **Estilos**         | Tailwind CSS v4 + CSS custom properties                                   |
| **Formularios**     | Estado local controlado (sin librerías externas)                          |
| **PDF**             | jsPDF + html2canvas (client-side) + `window.print()` para consentimientos |
| **Notificaciones**  | react-hot-toast                                                           |
| **Iconos**          | lucide-react                                                              |
| **Lint**            | ESLint + prettier (hook pre-commit)                                       |

---

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
# Editar .env: VITE_API_URL=http://localhost:3000/api

# Servidor de desarrollo (HMR activo)
npm run dev

# Build de producción
npm run build

# Previsualizar build
npm run preview
```

La aplicación queda disponible en `http://localhost:5173`.

---

## Variables de entorno

| Variable       | Descripción               | Ejemplo                     |
| -------------- | ------------------------- | --------------------------- |
| `VITE_API_URL` | URL base del backend REST | `http://localhost:3000/api` |

---

## Estructura del proyecto

```
hc-frontend/
├── public/
│   └── visorOdonto.js          # Script del odontograma SVG (cargado dinámicamente)
├── src/
│   ├── App.jsx                 # Router principal — define todas las rutas
│   ├── main.jsx                # Entry point — monta React + QueryClient + Router
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx      # Barra superior global
│   │   │   └── Sidebar.jsx     # Menú lateral genérico
│   │   ├── Notificaciones/
│   │   │   └── NotificacionBell.jsx  # Campana de notificaciones
│   │   ├── PdfExport/
│   │   │   └── ExportarPDF.jsx # Exportación PDF (jsPDF + html2canvas) — RF-08 ✅
│   │   ├── routes/
│   │   │   ├── ProtectedRoutes.jsx
│   │   │   └── PublicRoute.jsx
│   │   └── ui/                 # Componentes atómicos: Button, Card, Tab, etc.
│   │
│   ├── features/               # Componentes de dominio reutilizables
│   │   ├── patient/PatientCard.jsx
│   │   └── student/
│   │
│   ├── hooks/                  # Custom hooks (TanStack Query wrappers)
│   │   ├── useAuth.js          # useCurrentUser, useLogin
│   │   ├── useClinico.js       # Hooks para todos los módulos clínicos
│   │   ├── useHC.js            # Hooks de historia clínica
│   │   ├── useHistoria.js
│   │   └── ...
│   │
│   ├── layouts/                # Plantillas de página
│   │   ├── AdminLayout.jsx     # Panel administrador
│   │   ├── AuthLayout.jsx      # Páginas de autenticación
│   │   ├── HcLayout.jsx        # Historia clínica (sidebar + header paciente)
│   │   └── StudentLayout.jsx   # Dashboard estudiante/docente
│   │
│   ├── pages/
│   │   ├── Admin/              # Panel admin: dashboard, búsqueda, reportes, equipos
│   │   ├── Dashboard/          # Dashboard principal
│   │   ├── Docente/            # Dashboard docente
│   │   ├── Login/
│   │   ├── Student/
│   │   └── hc/                 # Módulos de la historia clínica
│   │       ├── Adjuntos/
│   │       ├── Anamnesis/
│   │       │   ├── Antecedente/
│   │       │   ├── Enfermedad_Actual/
│   │       │   ├── Filiacion/
│   │       │   └── Motivo_Consulta/
│   │       ├── Citas/
│   │       ├── ConsentimientoInformado/   # RF-09 ✅ (nuevo en v2.2.0)
│   │       │   ├── ConsentimientoInformado.jsx
│   │       │   └── consentimientoTemplates.js
│   │       ├── Diagnostico/
│   │       ├── Evolucion/
│   │       ├── ExamenFisico/
│   │       │   ├── ExamenFisicoMenu.jsx
│   │       │   ├── ExamenGeneral.jsx
│   │       │   ├── ExamenRegional.jsx
│   │       │   ├── ExamenBoca.jsx
│   │       │   ├── ExamenHigiene.jsx
│   │       │   ├── odonto.jsx      # Odontograma SVG + Registro de intervenciones (RF-06) ✅
│   │       │   └── odotools.jsx    # Panel de herramientas del odontograma
│   │       ├── FichaEvaluacion/
│   │       ├── FichaOperacion/
│   │       ├── HistorialVersiones/
│   │       ├── Medicamentos/
│   │       ├── Odontograma/
│   │       │   └── OdontogramaPage.jsx  # Conservado, desactivado temporalmente (ver ADR-0008)
│   │       └── ValidacionDocente/
│   │
│   ├── services/               # Fetch functions (capa de acceso a la API)
│   │   ├── fetchClinico.js     # Todos los módulos clínicos
│   │   ├── fetchHC.js
│   │   ├── fetchLogin.js
│   │   └── ...
│   │
│   └── stores/                 # Estado local global (Zustand / contexto simple)
│       ├── historiaStore.js
│       ├── useForm.js
│       └── usePatientStore.js
│
├── index.html
├── vite.config.js              # Alias @ui, @hooks, @services, @stores, @cmlayout
├── tailwind.config.js
└── package.json
```

---

## Rutas de la aplicación

### Públicas

| Ruta     | Componente  | Descripción      |
| -------- | ----------- | ---------------- |
| `/login` | `Login.jsx` | Inicio de sesión |

### Panel Administrador (`/admin/*`)

| Ruta                    | Componente              | RF          |
| ----------------------- | ----------------------- | ----------- |
| `/admin`                | `AdminDashboard.jsx`    | RF-ADM-03   |
| `/admin/create-student` | `CreateStudent.jsx`     | RF-ADM-05   |
| `/admin/student/:id`    | `StudentDetailPage.jsx` | RF-ADM-04   |
| `/admin/busqueda`       | `Busqueda.jsx`          | RF-03       |
| `/admin/reportes`       | `Reportes.jsx`          | RF-12       |
| `/admin/equipos`        | `Equipos.jsx`           | RF-15       |
| `/admin/transferir/:id` | `TransferirHC.jsx`      | RF-03/RF-10 |

### Historia Clínica (`/historia/:id/*`)

| Ruta                                           | Componente                    | RF           |
| ---------------------------------------------- | ----------------------------- | ------------ |
| `/historia/:id/anamnesis`                      | `Anamnesis.jsx`               | RF-01        |
| `/historia/:id/anamnesis/filiacion`            | `Filiacion.jsx`               | RF-02        |
| `/historia/:id/anamnesis/motivo-consulta`      | `Motivo_Consulta.jsx`         | RF-02        |
| `/historia/:id/anamnesis/enfermedad-actual`    | `Enfermedad_Actual.jsx`       | RF-02        |
| `/historia/:id/anamnesis/antecedente-personal` | `Antecedente.jsx`             | RF-02        |
| `/historia/:id/examen-fisico`                  | `ExamenFisicoMenu.jsx`        | RF-01        |
| `/historia/:id/examen-fisico/general`          | `ExamenGeneral.jsx`           | RF-02        |
| `/historia/:id/examen-fisico/regional`         | `ExamenRegional.jsx`          | RF-02        |
| `/historia/:id/examen-fisico/boca`             | `ExamenBoca.jsx`              | RF-02        |
| `/historia/:id/examen-fisico/higiene`          | `ExamenHigiene.jsx`           | RF-02        |
| `/historia/:id/examen-fisico/odonto`           | `odonto.jsx`                  | **RF-06 ✅** |
| `/historia/:id/diagnostico-presuntivo`         | `DiagnosticoPresuntivo.jsx`   | RF-02        |
| `/historia/:id/derivacion-clinicas`            | `DerivacionClinicas.jsx`      | RF-02        |
| `/historia/:id/diagnostico-clinicas`           | `DiagnosticoClinicas.jsx`     | RF-02        |
| `/historia/:id/evolucion`                      | `Evolucion.jsx`               | RF-02        |
| `/historia/:id/odontograma`                    | _(desactivada, ver ADR-0008)_ | RF-06        |
| `/historia/:id/medicamentos`                   | `Medicamentos.jsx`            | **RF-07 ✅** |
| `/historia/:id/fichas-operacion`               | `FichaOperacion.jsx`          | **RF-18 ✅** |
| `/historia/:id/fichas-evaluacion`              | `FichaEvaluacion.jsx`         | RF-13/RF-14  |
| `/historia/:id/citas`                          | `Citas.jsx`                   | **RF-11 ✅** |
| `/historia/:id/adjuntos`                       | `Adjuntos.jsx`                | **RF-05 ✅** |
| `/historia/:id/validacion`                     | `ValidacionDocente.jsx`       | RF-04/RF-14  |
| `/historia/:id/historial`                      | `HistorialVersiones.jsx`      | RF-02        |
| `/historia/:id/consentimiento`                 | `ConsentimientoInformado.jsx` | **RF-09 ✅** |

---

## Módulo ExportarPDF (RF-08)

El componente `ExportarPDF.jsx` genera PDFs client-side capturando el DOM.

### Props

| Prop            | Tipo     | Requerido | Descripción                                           |
| --------------- | -------- | --------- | ----------------------------------------------------- |
| `targetId`      | `string` | ✅        | ID del elemento DOM a capturar                        |
| `nombreArchivo` | `string` | —         | Nombre base del archivo `.pdf`                        |
| `titulo`        | `string` | —         | Título que aparece en el header del PDF               |
| `idHistoria`    | `string` | —         | UUID de la HC (para auditoría)                        |
| `usuario`       | `string` | —         | Nombre del usuario autenticado (aparece en el header) |

### Uso

```jsx
import ExportarPDF from '@components/PdfExport/ExportarPDF';
import { useCurrentUser } from '@hooks/useAuth';

const { data: user } = useCurrentUser();

<div id="contenido-para-pdf">
  {/* contenido clínico */}
</div>

<ExportarPDF
  targetId="contenido-para-pdf"
  nombreArchivo="diagnostico-presuntivo"
  titulo="Diagnóstico Presuntivo"
  idHistoria={id}
  usuario={`${user?.nombre} ${user?.apellido}`}
/>
```

### Características del PDF generado (v2.2.0)

- Header institucional con nombre de usuario y timestamp
- Footer con "Pág. X de N" en cada hoja
- Botones de UI excluidos del capture (`data-pdf-hidden="true"`)
- Exportación registrada en auditoría del backend

---

## Módulo Consentimiento Informado (RF-09)

**Ruta:** `/historia/:id/consentimiento`

### Tipos de template disponibles

| Valor             | Descripción                        |
| ----------------- | ---------------------------------- |
| `adulto_general`  | Procedimientos generales en adulto |
| `cirugia_oral`    | Exodoncias y cirugías menores      |
| `menor_de_edad`   | Paciente menor — requiere tutor    |
| `anestesia_local` | Anestesia local                    |

### Flujo

1. Seleccionar tipo de consentimiento
2. Completar nombre del paciente (y tutor si es menor)
3. **Vista previa** del documento de texto
4. **Imprimir / PDF** usando `window.print()` con `@media print` dedicado
5. **Guardar registro** en la BD (historial de consentimientos de la HC)

---

## Odontograma (RF-06)

> **Actualización 2026-05-31 (ADR-0023):** corregida la ubicación de las
> anotaciones de **Fusión** y **Germinación** (sección "Anomalías
> morfológicas" del panel). Calculaban la posición con `getCTM()` (píxeles
> CSS, ~0..320) mientras el overlay dibuja en unidades viewBox (0..1400), por
> lo que el círculo/elipse caía escalado sobre otro diente — mismo problema de
> espacio de coordenadas que el bug 7.3→3.8 (ADR-0018). Ahora usan
> `centerOfTooth`/`getToothBBox` (vía `getElementToSvgMatrix`), igual que el
> resto de herramientas del odontograma.

**Acceso:** Examen Físico → Odontograma (`/historia/:id/examen-fisico/odonto`)

La vista contiene dos secciones complementarias:

1. **SVG interactivo** con 24 herramientas de anotación clínica (panel `odotools.jsx`)
   - Coronas (CM, CF, CMC, CV, CLM, CT)
   - Defectos de esmalte, edéntulo, diastema, implantes
   - Aparatos ortodónticos fijos y removibles
   - Prótesis: PPF (fija), PDC (completa), PPR (parcial removible)
   - Panel organizado en 6 secciones clínicas; selección de diente por clic y
     color NTS-188 (azul = buen estado, rojo = mal estado). Ver ADR-0016.
   - **Lista "Tratamientos aplicados"** con borrado individual por ítem: cada
     herramienta aplicada se registra (sigla, diente, color) y puede eliminarse
     independientemente para corregir errores de selección sin borrar todo. El
     borrado de un ítem también remueve su trazo del SVG. Ver ADR-0017.
   - Guarda versiones en localStorage por paciente y SVG en BD (`odontograma_svg`)

2. **Registro de intervenciones** (integrado desde `OdontogramaPage.jsx` en v2.2.0)
   - Formulario por diente: número FDI, superficie, diagnóstico, tratamiento, alumno, fecha
   - Tabla de historial persistida en la base de datos
   - Ver ADR-0008 para justificación de la consolidación

> **Nota:** La lista "Tratamientos aplicados" (visual, de sesión) es distinta del
> "Registro de intervenciones" (formal, persistido en BD con diagnóstico/tratamiento).
> La primera traza lo dibujado en el editor SVG; la segunda es el registro clínico oficial.

### Modelo clínico (NTS N° 188-MINSA/2022) — multi-hallazgo por superficie

La unidad de registro es la **superficie** del diente (vestibular, lingual/palatina,
mesial, distal, oclusal/incisal), no el diente completo. Por eso **un diente admite
varios tratamientos a la vez** (p.ej. caries en oclusal + obturación en mesial), más
estados de diente completo (corona, ausente, implante, movilidad…). Color **azul =
buen estado / tratamiento realizado**; **rojo = mal estado / patología**.

**Reglas de exclusión clínica** (ver ADR-0020/0021/0022/0024): una pieza marcada como
**AUSENTE** (PDA: DNE/DEX/DAO) no admite otros tratamientos en el mismo odontograma (se
bloquea); marcar ausente una pieza que ya tiene registros se permite con advertencia
(válido en evolución). Además, una **matriz de exclusión mutua** impide combinaciones
contradictorias en la misma pieza y tipo: tamaño (macrodoncia vs microdoncia),
giroversión (derecha vs izquierda), corona total (un solo tipo) y **doble formación
(fusión vs germinación)**. Las reglas viven en el dominio del backend (responde 409) con
espejo en el cliente para UX inmediata. Combinaciones legítimas por superficie (p.ej.
caries + obturación) no se bloquean.

---

## Convenciones del proyecto

### Nomenclatura

- **Componentes React**: PascalCase (`PatientCard.jsx`)
- **Custom hooks**: camelCase con prefijo `use` (`useCurrentUser`)
- **Servicios fetch**: camelCase con prefijo `fetch` (`fetchConsentimientos`)
- **Páginas**: PascalCase en carpeta con el nombre del módulo

### Alias de Vite

| Alias       | Ruta real               |
| ----------- | ----------------------- |
| `@ui`       | `src/components/ui`     |
| `@hooks`    | `src/hooks`             |
| `@services` | `src/services`          |
| `@stores`   | `src/stores`            |
| `@cmlayout` | `src/components/layout` |

### Convención de ramas y commits

Ver [`../hc-backend/docs/GIT_FLOW.md`](../hc-backend/docs/GIT_FLOW.md) —
el flujo de trabajo es compartido con el backend.

---

## Historial de versiones del frontend

| Versión | Fecha      | Cambios principales                                                                                                                    |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| v2.2.0  | 2026-05-30 | RF-09: Consentimiento Informado completo. RF-08: ExportarPDF con usuario + auditoría. RF-06: Odontograma consolidado en Examen Físico. |
| v2.1.0  | 2026-05    | Dashboard docente, fichas de evaluación, citas, validación docente.                                                                    |
| v2.0.0  | 2026-05    | MVP: HC completa, examen físico, odontograma SVG, adjuntos, medicamentos.                                                              |

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo (localhost:5173)
npm run build     # Build optimizado en dist/
npm run preview   # Previsualizar dist/ en localhost:4173
npm run lint      # ESLint sobre src/
npm test          # Vitest en modo watch
npm run test:run  # Vitest una sola pasada (CI / verificación)
```

---

## Tests (Vitest + Testing Library)

La suite usa **Vitest** con entorno **jsdom** (`vitest.config.js`) y
`@testing-library/react`. Cubre los servicios `fetch*`, los hooks de React Query
y el render del panel del odontograma (`test/odontogramaToolsPanel.test.jsx`).

```bash
npm run test:run   # 25 archivos, 136 tests
```

> Antes la suite no podía ejecutarse completa porque faltaba la dependencia
> `jsdom` (los tests que tocan el DOM fallaban con `Cannot find package 'jsdom'`).
> Resuelto en ADR-0025: se añadió `jsdom` como devDependency y se actualizaron dos
> tests obsoletos de `useHistoria` (esperaban `window.alert`; el código migró a
> `react-hot-toast`).

---

_Proyecto académico — Ingeniería de Software II 2026-I, UNJBG. Grupo 4._
