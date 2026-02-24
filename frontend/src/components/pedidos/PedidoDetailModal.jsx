import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { ESTADOS, PRIORIDAD_META } from '@/config/constants';
import { formatDateTime } from '@/utils/helpers';
import { Modal, Badge, SVG } from '@/components/ui';

export default function PedidoDetailModal({ open, onClose, pedido }) {
  const { db } = useContext(AppContext);
  if (!pedido) return null;
  const est = ESTADOS[pedido.estado_actual];
  const pri = PRIORIDAD_META[pedido.prioridad];
  const asignado = pedido.asignado_a ? db.usuarios.find(u => u.id === pedido.asignado_a) : null;

  return (
    <Modal open={open} onClose={onClose} title={'Detalle — ' + pedido.codigo} wide>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:18 }}>
            <Badge color={est.color} bg={est.bg} border={est.borderColor}>{est.label}</Badge>
            <Badge color={pri.color} bg={pri.bg} border={pri.border}>{pri.label}</Badge>
          </div>
          {[['Cliente',pedido.cliente],['Descripción',pedido.descripcion],['Dirección',pedido.direccion]].map(([k,v]) => (
            <div key={k} style={{ marginBottom:14 }}>
              <span style={{ fontSize:11, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em' }}>{k}</span>
              <p style={{ fontSize: k==='Cliente'?15:13, fontWeight: k==='Cliente'?500:400, color: k==='Cliente'?'var(--text-1)':'var(--text-2)', marginTop:2 }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:16, background:'var(--bg-1)', borderRadius:'var(--r2)', border:'1px solid var(--border-1)' }}>
            <span style={{ fontSize:11, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:10 }}>Información</span>
            {[['Teléfono',pedido.telefono||'—'],['Creado',formatDateTime(pedido.fecha_creacion)],['Actualizado',formatDateTime(pedido.fecha_actualizacion)],
              ['PDF',pedido.pdf_ruta],['Asignado',asignado?asignado.nombre:'Sin asignar']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                <span style={{ color:'var(--text-4)' }}>{k}</span>
                <span style={{ color:'var(--text-2)', fontFamily: k==='PDF'?'var(--mono)':'inherit', fontSize: k==='PDF'?12:13 }}>{v}</span>
              </div>
            ))}
          </div>
          {pedido.notas && (
            <div style={{ padding:16, background:'#F59E0B08', borderRadius:'var(--r2)', border:'1px solid #F59E0B20' }}>
              <span style={{ fontSize:11, color:'var(--accent)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>Notas</span>
              <p style={{ fontSize:13, color:'var(--text-2)', marginTop:6 }}>{pedido.notas}</p>
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