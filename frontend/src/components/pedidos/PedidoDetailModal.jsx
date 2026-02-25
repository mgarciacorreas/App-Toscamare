import { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLES, ESTADOS, PRIORIDAD_META, CHECKLIST_ITEMS } from '@/config/constants';
import { formatDateTime } from '@/utils/helpers';
import { Modal, Badge, SVG, Btn } from '@/components/ui';
import ProductosTable from './ProductosTable';
import * as api from '@/utils/api';

export default function PedidoDetailModal({ open, onClose, pedido, onRefresh }) {
  const { session, showToast } = useContext(AppContext);
  const [checklist, setChecklist] = useState({
    checklist_mercancia: false,
    checklist_estado: false,
    checklist_documentacion: false,
  });
  const [savingChecklist, setSavingChecklist] = useState(false);

  useEffect(() => {
    if (pedido) {
      setChecklist({
        checklist_mercancia: pedido.checklist_mercancia || false,
        checklist_estado: pedido.checklist_estado || false,
        checklist_documentacion: pedido.checklist_documentacion || false,
      });
    }
  }, [pedido]);

  if (!pedido) return null;
  const est = ESTADOS[pedido.estado_actual];
  const pri = PRIORIDAD_META[pedido.prioridad];
  const isTransportista = session.user.rol === ROLES.TRANSPORTISTA || session.user.rol === ROLES.ADMIN;
  const showChecklist = pedido.estado_actual === 2 && isTransportista;

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveChecklist = async () => {
    setSavingChecklist(true);
    try {
      await api.updateChecklist(pedido.id, checklist);
      showToast('Checklist actualizado');
      if (onRefresh) onRefresh();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSavingChecklist(false);
    }
  };

  const canEditProducts = pedido.estado_actual === 0 && (session.user.rol === ROLES.ALMACEN || session.user.rol === ROLES.ADMIN);

  return (
    <Modal open={open} onClose={onClose} title={'Detalle — ' + pedido.codigo} wide>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:18 }}>
            <Badge color={est.color} bg={est.bg} border={est.borderColor}>{est.label}</Badge>
            <Badge color={pri.color} bg={pri.bg} border={pri.border}>{pri.label}</Badge>
          </div>
          {[['Cliente',pedido.cliente],['Dirección',pedido.direccion]].map(([k,v]) => (
            <div key={k} style={{ marginBottom:14 }}>
              <span style={{ fontSize:11, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em' }}>{k}</span>
              <p style={{ fontSize: k==='Cliente'?15:13, fontWeight: k==='Cliente'?500:400, color: k==='Cliente'?'var(--text-1)':'var(--text-2)', marginTop:2 }}>{v}</p>
            </div>
          ))}

          {/* Productos */}
          <div style={{ marginTop:16 }}>
            <span style={{ fontSize:11, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:8 }}>
              Productos
            </span>
            <ProductosTable pedidoId={pedido.id} editable={canEditProducts} />
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:16, background:'var(--bg-1)', borderRadius:'var(--r2)', border:'1px solid var(--border-1)' }}>
            <span style={{ fontSize:11, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:10 }}>Información</span>
            {[['Teléfono',pedido.telefono||'—'],['Creado',formatDateTime(pedido.fecha_creacion)],['Actualizado',formatDateTime(pedido.fecha_actualizacion)],
              ['PDF',pedido.pdf_nombre||'Sin PDF']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, marginBottom:6 }}>
                <span style={{ color:'var(--text-4)' }}>{k}</span>
                {k === 'PDF' && pedido.pdf_ruta ? (
                  <a href={api.getPDFUrl(pedido.id)} target="_blank" rel="noopener noreferrer"
                    style={{ color:'var(--accent)', fontSize:12, textDecoration:'none' }}>
                    Descargar
                  </a>
                ) : (
                  <span style={{ color:'var(--text-2)', fontFamily: k==='PDF'?'var(--mono)':'inherit', fontSize: k==='PDF'?12:13 }}>{v}</span>
                )}
              </div>
            ))}
          </div>

          {pedido.notas && (
            <div style={{ padding:16, background:'#F59E0B08', borderRadius:'var(--r2)', border:'1px solid #F59E0B20' }}>
              <span style={{ fontSize:11, color:'var(--accent)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>Notas</span>
              <p style={{ fontSize:13, color:'var(--text-2)', marginTop:6 }}>{pedido.notas}</p>
            </div>
          )}

          {/* Checklist transportista */}
          {showChecklist && (
            <div style={{ padding:16, background:'#10B98108', borderRadius:'var(--r2)', border:'1px solid #10B98120' }}>
              <span style={{ fontSize:11, color:'var(--success)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:12 }}>
                Checklist de Carga
              </span>
              {CHECKLIST_ITEMS.map(item => (
                <label key={item.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', cursor:'pointer',
                  borderBottom:'1px solid var(--border-1)' }}>
                  <input type="checkbox" checked={checklist[item.key]}
                    onChange={() => toggleCheck(item.key)}
                    style={{ width:18, height:18, accentColor:'var(--success)' }} />
                  <span style={{ fontSize:13, color: checklist[item.key] ? 'var(--text-1)' : 'var(--text-3)' }}>{item.label}</span>
                </label>
              ))}
              <Btn variant="primary" size="sm" icon="check" disabled={savingChecklist} onClick={saveChecklist}
                style={{ marginTop:12, background:'var(--success)', width:'100%' }}>
                {savingChecklist ? 'Guardando...' : 'Guardar Checklist'}
              </Btn>
            </div>
          )}

          {/* Progress */}
          <div style={{ padding:16, background:'var(--bg-1)', borderRadius:'var(--r2)', border:'1px solid var(--border-1)' }}>
            <span style={{ fontSize:11, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:12 }}>Progreso</span>
            <div style={{ display:'flex', alignItems:'center' }}>
              {Object.entries(ESTADOS).map(([k,v],i) => {
                const done = pedido.estado_actual > parseInt(k);
                const current = pedido.estado_actual === parseInt(k);
                return (
                  <div key={k} style={{ flex:1, display:'flex', alignItems:'center' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0,
                      background: done?v.color:current?v.color+'30':'var(--bg-3)',
                      border: current?'2px solid '+v.color:done?'none':'1px solid var(--border-2)',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {done && <SVG name="check" size={12} color="#0A0C10" />}
                      {current && <span style={{ width:6, height:6, borderRadius:'50%', background:v.color }} />}
                    </div>
                    {i < 3 && <div style={{ flex:1, height:2, background: done?v.color:'var(--border-2)', margin:'0 2px' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
