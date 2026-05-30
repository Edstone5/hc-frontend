/**
 * Componente reutilizable para exportar cualquier sección de la HC a PDF.
 *
 * Uso:
 *   <ExportarPDF targetId="seccion-diagnostico" nombreArchivo="diagnostico-presuntivo" />
 *
 * El elemento con `id={targetId}` será capturado con html2canvas y convertido a PDF.
 * Decisión ADR: PDF generado en el browser (jsPDF + html2canvas), sin endpoint backend.
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown } from 'lucide-react';

export default function ExportarPDF({
  targetId,
  nombreArchivo = 'historia-clinica',
  titulo,
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Importación dinámica para no aumentar el bundle inicial
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
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // márgenes 10mm cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Metadata del documento
      pdf.setProperties({
        title: titulo || nombreArchivo,
        subject: 'Historia Clínica — UNJBG Clínica Basadrina',
        author: 'Sistema HC Digital',
        creator: 'Sistema HC Digital',
      });

      // Header
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(
        `Generado: ${new Date().toLocaleString('es-PE')} — Clínica Odontológica Basadrina UNJBG`,
        10,
        8
      );
      pdf.line(10, 10, pdfWidth - 10, 10);

      // Contenido (paginado si supera A4)
      let yOffset = 15;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const pageContentHeight = Math.min(remainingHeight, pdfHeight - 20);
        const sourceHeight = (pageContentHeight / imgWidth) * canvas.width;

        // Crear canvas temporal para la página
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(
          pageImgData,
          'PNG',
          10,
          yOffset,
          imgWidth,
          pageContentHeight
        );

        remainingHeight -= pageContentHeight;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset = 15;
        }
      }

      pdf.save(
        `${nombreArchivo}-${new Date().toISOString().split('T')[0]}.pdf`
      );
      toast.success('PDF generado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
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
