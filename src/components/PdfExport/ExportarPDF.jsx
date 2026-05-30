/**
 * Componente reutilizable para exportar cualquier sección de la HC a PDF.
 *
 * Uso:
 *   <ExportarPDF
 *     targetId="seccion-diagnostico"
 *     nombreArchivo="diagnostico-presuntivo"
 *     idHistoria="uuid-de-la-hc"           ← para registro de auditoría
 *     usuario="Dr. Juan Perez"              ← nombre visible en el header del PDF
 *   />
 *
 * Decisión ADR-RF08: PDF generado en el browser (jsPDF + html2canvas) para evitar
 * latencia de servidor y permitir vista previa fiel al DOM. Se agrega:
 *   - Header con institución + usuario autenticado + timestamp
 *   - Footer con número de página y nombre de archivo
 *   - Registro de auditoría en backend (POST /hc/:id/exportar-pdf)
 *     capturado por auditoriaMW sin bloquear la descarga
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function ExportarPDF({
  targetId,
  nombreArchivo = 'historia-clinica',
  titulo,
  idHistoria,
  usuario = 'Usuario del sistema',
}) {
  const [loading, setLoading] = useState(false);

  /** Registra la exportación en la tabla auditoria (best-effort, no bloquea). */
  const registrarEnAuditoria = async () => {
    if (!idHistoria) return;
    try {
      await fetch(`${API}/hc/${idHistoria}/exportar-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombreArchivo, usuario }),
      });
    } catch {
      // Silencio intencional: el fallo de auditoría no debe bloquear la descarga
    }
  };

  /** Dibuja encabezado de institución + usuario en cada página del PDF. */
  const dibujarHeader = (pdf, pdfWidth, titulo) => {
    // Banda azul superior
    pdf.setFillColor(37, 99, 235); // Azul primary
    pdf.rect(0, 0, pdfWidth, 14, 'F');

    // Nombre de institución
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(undefined, 'bold');
    pdf.text('CLÍNICA ODONTOLÓGICA BASADRINA — UNJBG', 10, 5.5);

    // Título del documento
    pdf.setFont(undefined, 'normal');
    pdf.text(titulo || nombreArchivo, 10, 10);

    // Usuario y timestamp alineados a la derecha
    const fechaStr = new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    pdf.text(`${usuario}  |  ${fechaStr}`, pdfWidth - 10, 5.5, {
      align: 'right',
    });

    // Restablecer color para el contenido
    pdf.setTextColor(40, 40, 40);
    pdf.setFont(undefined, 'normal');
  };

  /** Dibuja pie de página con nro. de hoja y nombre de archivo. */
  const dibujarFooter = (
    pdf,
    pdfWidth,
    pdfHeight,
    paginaActual,
    totalPaginas
  ) => {
    const y = pdfHeight - 5;
    pdf.setFontSize(7);
    pdf.setTextColor(130, 130, 130);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, y - 3, pdfWidth - 10, y - 3);
    pdf.text(`${nombreArchivo} — Documento oficial`, 10, y);
    pdf.text(`Pág. ${paginaActual} de ${totalPaginas}`, pdfWidth - 10, y, {
      align: 'right',
    });
    pdf.setTextColor(40, 40, 40);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Importación dinámica: no aumenta el bundle principal
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const elemento = document.getElementById(targetId);
      if (!elemento) {
        toast.error('No se encontró el contenido para exportar');
        return;
      }

      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        // Ignorar botones de edición/acción para que no aparezcan en el PDF
        ignoreElements: (el) =>
          el.tagName === 'BUTTON' ||
          el.getAttribute('data-pdf-hidden') === 'true',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const HEADER_H = 18; // mm reservados para header
      const FOOTER_H = 10; // mm reservados para footer
      const MARGIN = 10; // mm márgenes laterales
      const imgWidth = pdfWidth - MARGIN * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageContentH = pdfHeight - HEADER_H - FOOTER_H;

      // Calcular número de páginas antes de dibujar
      const totalPaginas = Math.ceil(imgHeight / pageContentH);

      // Metadata del documento (visible en propiedades del PDF)
      pdf.setProperties({
        title: titulo || nombreArchivo,
        subject: 'Historia Clínica — UNJBG Clínica Basadrina',
        author: usuario,
        creator: 'Sistema HC Digital v1.0',
        keywords: `historia clinica, odontologia, UNJBG, ${idHistoria ?? ''}`,
      });

      let sourceY = 0;
      let remainingHeight = imgHeight;

      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        if (pagina > 1) pdf.addPage();

        dibujarHeader(pdf, pdfWidth, titulo);

        const pageContentHeight = Math.min(remainingHeight, pageContentH);
        const sourceHeight = (pageContentHeight / imgWidth) * canvas.width;

        // Sub-canvas con sólo el fragmento de esta página
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.ceil(sourceHeight);
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          Math.ceil(sourceHeight),
          0,
          0,
          canvas.width,
          Math.ceil(sourceHeight)
        );

        pdf.addImage(
          pageCanvas.toDataURL('image/png'),
          'PNG',
          MARGIN,
          HEADER_H,
          imgWidth,
          pageContentHeight
        );

        dibujarFooter(pdf, pdfWidth, pdfHeight, pagina, totalPaginas);

        remainingHeight -= pageContentHeight;
        sourceY += sourceHeight;
      }

      const nombreFinal = `${nombreArchivo}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(nombreFinal);
      toast.success('PDF generado correctamente');

      // Registrar en auditoría (asíncrono, no bloquea UI)
      registrarEnAuditoria();
    } catch (e) {
      console.error('[ExportarPDF]', e);
      toast.error('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      data-pdf-hidden="true"
      className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-colors
        ${
          loading
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
        }`}
    >
      <FileDown size={16} />
      {loading ? 'Generando PDF...' : 'Exportar PDF'}
    </button>
  );
}
