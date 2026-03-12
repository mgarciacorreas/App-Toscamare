import { useState, useEffect } from "react";
import { Modal, Btn, SVG } from "@/components/ui";
import * as api from "@/utils/api";

export default function PDFReviewModal({ open, onClose, pedido, onConfirm }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open && pedido) {
      setLoading(true);
      api.getPDFSignedUrl(pedido.id)
        .then(url => setPdfUrl(url))
        .catch(err => console.error("Error loading PDF:", err))
        .finally(() => setLoading(false));
    } else {
      setPdfUrl(null);
    }
  }, [open, pedido]);

  if (!pedido) return null;

  const handleFinalConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(pedido.id);
      onClose();
    } catch (e) {
      // Error handled by parent
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={"Revisar Documento Firmado - " + pedido.codigo} fullScreen>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, background: '#333' }}>
        
        {/* Header with quick close */}
        <div style={{ 
          padding: '12px 24px', 
          background: 'var(--bg-2)', 
          borderBottom: '1px solid var(--border-1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SVG name="file" size={18} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Revisión del Albarán Firmado</span>
          </div>
          <Btn variant="ghost" size="sm" icon="x" onClick={onClose}>Cerrar Revisión</Btn>
        </div>

        {/* PDF Viewer Area */}
        <div style={{ 
          flexGrow: 1, 
          background: '#525659', // Standard PDF viewer grey
          overflow: 'auto', 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 10px'
        }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div className="anim-spin"><SVG name="loader" size={32} color="#fff" /></div>
            </div>
          ) : pdfUrl ? (
            <div style={{ 
              width: '100%', 
              maxWidth: '850px', // Standard A4 width at readable scale
              height: 'fit-content',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <iframe 
                src={`${pdfUrl}#view=FitH`} // Fit Horizontal to container width
                style={{ 
                  width: '100%', 
                  height: 'calc(100vh - 180px)', // Fixed height based on viewport minus bars
                  border: 'none',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                  background: '#fff',
                  borderRadius: '4px'
                }} 
                title="Vista previa PDF firmado"
              />
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#fff' }}>No se pudo cargar el PDF para revisión</p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '24px 40px',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--border-1)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.2)',
          zIndex: 10
        }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>¿Todo correcto?</h4>
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Revisa que la firma sea legible antes de completar.</p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Btn variant="outline" onClick={onClose} disabled={confirming}>
              Volver a editar
            </Btn>
            <Btn 
              variant="primary" 
              icon="check" 
              size="lg"
              onClick={handleFinalConfirm}
              disabled={confirming || loading || !pdfUrl}
              style={{ paddingLeft: 30, paddingRight: 30 }}
            >
              {confirming ? "Finalizando..." : "Confirmar y Completar"}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
