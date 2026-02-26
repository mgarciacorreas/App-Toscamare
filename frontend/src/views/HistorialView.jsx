import { useState, useMemo, useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { PRIORIDAD_META } from '@/config/constants';
import { formatDate } from '@/utils/helpers';
import { SVG, Badge, EmptyState } from '@/components/ui';

export default function HistorialView() {
  const { historial, loadHistorial } = useContext(AppContext);
  const [search, setSearch] = useState('');

  useEffect(() => { loadHistorial(); }, [loadHistorial]);

  const filtered = useMemo(() => {
    if (!search) return historial;
    const q = search.toLowerCase();
    return historial.filter(h => h.codigo.toLowerCase().includes(q) || h.cliente.toLowerCase().includes(q));
  }, [historial, search]);

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ position:'relative' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar en historial..."
            style={{ padding:'8px 12px 8px 34px', background:'var(--bg-2)', border:'1px solid var(--border-2)',
              borderRadius:'var(--r2)', color:'var(--text-1)', fontSize:13, width:260 }} />
          <div style={{ position:'absolute', top:'50%', left:11, transform:'translateY(-50%)', pointerEvents:'none' }}>
            <SVG name="search" size={14} color="var(--text-4)" />
          </div>
        </div>
        <span style={{ fontSize:12, color:'var(--text-4)' }}>{filtered.length} registros</span>
      </div>

      {filtered.length === 0 ? <EmptyState icon="archive" title="Sin registros" subtitle="Los pedidos finalizados aparecerán aquí" /> : (
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--border-1)', borderRadius:'var(--r3)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Código','Cliente','Prioridad','Creado','Finalizado','Finalizado por'].map(h => (
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-4)',
                  textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'1px solid var(--border-1)', background:'var(--bg-1)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((h,i) => {
                const pri = PRIORIDAD_META[h.prioridad];
                return (
                  <tr key={h.id} className={'anim-fade d'+Math.min(i+1,8)} style={{ borderBottom: i<filtered.length-1?'1px solid var(--border-1)':'none' }}>
                    <td style={{ padding:'11px 16px' }}><code style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--success)' }}>{h.codigo}</code></td>
                    <td style={{ padding:'11px 16px', fontSize:13, fontWeight:500 }}>{h.cliente}</td>
                    <td style={{ padding:'11px 16px' }}><Badge color={pri?.color||'#6B7280'} style={{ fontSize:10 }}>{pri?.label||h.prioridad}</Badge></td>
                    <td style={{ padding:'11px 16px', fontSize:12, color:'var(--text-3)', whiteSpace:'nowrap' }}>{formatDate(h.fecha_creacion)}</td>
                    <td style={{ padding:'11px 16px', whiteSpace:'nowrap' }}>
                      <span style={{ fontSize:12, color:'var(--success)', background:'#30A46C12', padding:'3px 8px', borderRadius:4 }}>{h.fecha_entrega ? formatDate(h.fecha_entrega) : '—'}</span></td>
                    <td style={{ padding:'11px 16px', fontSize:12, color:'var(--text-3)' }}>{h.entregado_por || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
