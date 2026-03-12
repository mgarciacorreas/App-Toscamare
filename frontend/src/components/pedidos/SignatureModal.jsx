import { useState, useRef, useEffect } from "react";
import { Modal, Btn, SVG } from "@/components/ui";
import SignatureCanvas from "react-signature-canvas";
import * as api from "@/utils/api";

export default function SignatureModal({ open, onClose, pedido }) {
  const sigRef = useRef(null);
  const wrapperRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const lastDataRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [penWidths, setPenWidths] = useState({ min: 1.5, max: 3.5 });
  const [bgUrl, setBgUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [rawPenBase, setRawPenBase] = useState(0.9); // Base thickness for minWidth

  useEffect(() => {
    if (open && pedido) {
      lastDataRef.current = localStorage.getItem('firma_' + pedido.id) || null;
    }
  }, [open, pedido]);

  // Load PDF background
  useEffect(() => {
    if (open && pedido) {
      setLoadingPdf(true);
      api.getPDFPreviewUrl(pedido.id)
        .then(url => setBgUrl(url))
        .catch(err => console.error("Error loading PDF preview:", err))
        .finally(() => setLoadingPdf(false));
    } else {
      setBgUrl(null);
    }
  }, [open, pedido]);

  // Handle Fullscreen events syncing with state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Attempt to enter browser fullscreen automatically when opened
  useEffect(() => {
    if (open && !document.fullscreenElement) {
      // Small timeout to ensure wrapperRef is mounted
      setTimeout(() => {
        wrapperRef.current?.requestFullscreen().catch(() => {
          // Silent catch if browser blocks automatic fullscreen
        });
      }, 100);
    }
  }, [open]);

  // Resize canvas so drawing tracks pointer accurately and pen width scales with container
  useEffect(() => {
    if (!open) return;
    
    let resizeTimer;
    const resizeCanvas = () => {
      if (!canvasContainerRef.current || !sigRef.current) return;
      const parent = canvasContainerRef.current;
      const canvas = sigRef.current.getCanvas();
      
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (w === 0 || h === 0) return;
      
      // Update pen thickness proportionally (increased as requested)
      const scale = w / 350;
      setPenWidths({ 
        min: Math.max(0.5, rawPenBase * scale), 
        max: Math.max(1, (rawPenBase + 2) * scale) 
      });
      
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const targetW = w * ratio;
      const targetH = h * ratio;
      
      if (canvas.width === targetW && canvas.height === targetH) return;
      
      const currentData = sigRef.current.isEmpty() ? null : sigRef.current.toDataURL();
      if (currentData) {
        lastDataRef.current = currentData;
      }
      
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.getContext("2d").scale(ratio, ratio);
      
      sigRef.current.clear();
      
      if (lastDataRef.current && lastDataRef.current !== "data:,") {
        setTimeout(() => {
          if (sigRef.current) sigRef.current.fromDataURL(lastDataRef.current);
        }, 30);
      }
    };

    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 50);
    });
    
    if (canvasContainerRef.current) {
      // Small delay initially to let the img dictate the container size
      setTimeout(resizeCanvas, 50);
      observer.observe(canvasContainerRef.current);
    }
    
    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [open, bgUrl, rawPenBase]);

  const handleClear = () => {
    sigRef.current?.clear();
    lastDataRef.current = null;
  };

  const handleSaveLocal = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      onClose();
      return;
    }
    const dataURL = sigRef.current.toDataURL("image/png");
    localStorage.setItem('firma_' + pedido.id, dataURL);
    onClose();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => {
        console.error(`Error entering full-screen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!pedido) return null;

  return (
    <Modal open={open} onClose={onClose} title={"Firma - " + pedido.codigo} fullScreen={isFullscreen}>
      <div 
        ref={wrapperRef} 
        style={{ 
          background: isFullscreen ? 'var(--bg-0)' : 'transparent',
          padding: isFullscreen ? '24px' : '0',
          display: 'flex', 
          flexDirection: 'column',
          height: isFullscreen ? '100vh' : 'auto',
          width: isFullscreen ? '100vw' : 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Redundant header removed as Modal provides one */}

        {!isFullscreen && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              Firme directamente sobre el albarán en la vista previa.
            </p>
            <Btn variant="ghost" size="sm" icon="maximize" onClick={toggleFullscreen} title="Pantalla completa">
              Pantalla completa
            </Btn>
          </div>
        )}
        {isFullscreen && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn variant="ghost" size="sm" icon="minimize" onClick={toggleFullscreen} title="Salir pantalla completa">
              Salir pantalla completa
            </Btn>
          </div>
        )}

        <div style={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: isFullscreen ? 'row' : 'column', 
          gap: 20, 
          overflow: 'hidden',
          minHeight: 0 // important for flex children to shrink
        }}>
          {/* Main Content: Canvas */}
          <div style={{ 
            flexGrow: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'relative',
            background: isFullscreen ? 'rgba(0,0,0,0.03)' : 'transparent',
            borderRadius: 'var(--r3)',
            overflow: 'auto',
            padding: isFullscreen ? 20 : 0
          }}>
            <div
              ref={canvasContainerRef}
              style={{
                position: 'relative',
                borderRadius: "var(--r2)",
                background: "var(--bg-2)",
                overflow: 'hidden',
                maxHeight: '100%',
                maxWidth: '100%',
                display: 'inline-block', // shrinkwrap to img
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                border: "1px solid var(--border-2)"
              }}
            >
              {loadingPdf && (
                <div style={{ width: 300, height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--text-4)" }}>Cargando factura...</p>
                </div>
              )}
              {!loadingPdf && bgUrl && (
                <img 
                  src={bgUrl} 
                  alt="Documento" 
                  style={{ 
                    display: "block", 
                    maxWidth: "100%", 
                    maxHeight: isFullscreen ? 'calc(100vh - 100px)' : '50vh', 
                    objectFit: "contain",
                    pointerEvents: "none",
                    userSelect: "none"
                  }} 
                />
              )}
              {!loadingPdf && !bgUrl && (
                <div style={{ width: 300, height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--text-4)" }}>No se pudo cargar el PDF</p>
                </div>
              )}

              {bgUrl && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
                  <SignatureCanvas
                    ref={sigRef}
                    penColor="#000" // Negro
                    minWidth={penWidths.min}
                    maxWidth={penWidths.max}
                    canvasProps={{
                      className: "sigCanvas",
                      style: { 
                        width: "100%", 
                        height: "100%", 
                        display: "block",
                        cursor: "crosshair"
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls: Sidebar or Footer */}
          <div style={{ 
            width: isFullscreen ? 280 : '100%',
            flexShrink: 0,
            display: "flex", 
            flexDirection: "column",
            gap: 20,
            padding: isFullscreen ? '24px' : '20px 0 0 0',
            background: isFullscreen ? 'var(--bg-1)' : 'transparent',
            borderRadius: "var(--r3)",
            border: isFullscreen ? '1px solid var(--border-1)' : 'none',
            justifyContent: isFullscreen ? 'flex-start' : 'center'
          }}>
            {isFullscreen && (
              <div style={{ marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Controles</h3>
                <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Ajusta el trazo y guarda cuando termines.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                  Grosor del lápiz
                </span>
                <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                  {rawPenBase.toFixed(1)}
                </span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="5" 
                step="0.5" 
                value={rawPenBase} 
                onChange={(e) => setRawPenBase(parseFloat(e.target.value))}
                style={{ 
                  accentColor: 'var(--accent)', 
                  cursor: 'pointer',
                  width: '100%',
                  height: 6,
                  borderRadius: 3
                }} 
              />
            </div>

            <div style={{ marginTop: isFullscreen ? 'auto' : 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Btn 
                variant="primary" 
                icon="check" 
                size="lg"
                onClick={handleSaveLocal}
                style={{ 
                  width: '100%',
                  paddingTop: 14,
                  paddingBottom: 14,
                  boxShadow: '0 8px 16px var(--accent-30)'
                }}
              >
                Guardar Firma
              </Btn>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn 
                  variant="outline" 
                  icon="trash" 
                  onClick={handleClear}
                  style={{ flex: 1 }}
                >
                  Borrar
                </Btn>
                <Btn 
                  variant="secondary" 
                  onClick={onClose}
                  style={{ flex: 1 }}
                >
                  Cerrar
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
