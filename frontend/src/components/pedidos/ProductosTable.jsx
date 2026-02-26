import { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLES } from '@/config/constants';
import { Btn } from '@/components/ui';
import * as api from '@/utils/api';

export default function ProductosTable({ pedidoId, editable }) {
  const { session, showToast } = useContext(AppContext);
  const [productos, setProductos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');

  const isAlmacen = session.user.rol === ROLES.ALMACEN || session.user.rol === ROLES.ADMIN;

  useEffect(() => {
    if (pedidoId) api.fetchProductos(pedidoId).then(setProductos).catch(() => {});
  }, [pedidoId]);

  const startEdit = (prod) => {
    setEditingId(prod.id);
    setEditVal(prod.cantidad_preparada ?? prod.cantidad_solicitada ?? '');
  };

  const saveEdit = async (prod) => {
    try {
      await api.updateProductoCantidad(pedidoId, prod.id, Number(editVal));
      setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, cantidad_preparada: Number(editVal) } : p));
      setEditingId(null);
      showToast('Cantidad actualizada');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (productos.length === 0) return <p style={{ fontSize:12, color:'var(--text-4)' }}>Sin productos</p>;

  return (
    <div style={{ background:'var(--bg-1)', border:'1px solid var(--border-1)', borderRadius:'var(--r2)', overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>
          {['Producto', 'Solicitada', 'Preparada', 'Unidad', ...(editable && isAlmacen ? [''] : [])].map(h => (
            <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--text-4)',
              textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'1px solid var(--border-1)', background:'var(--bg-0)' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {productos.map((p, i) => (
            <tr key={p.id} style={{ borderBottom: i < productos.length-1 ? '1px solid var(--border-1)' : 'none' }}>
              <td style={{ padding:'8px 12px', fontSize:13, fontWeight:500 }}>{p.nombre}</td>
              <td style={{ padding:'8px 12px', fontSize:13 }}>{p.cantidad_solicitada}</td>
              <td style={{ padding:'8px 12px', fontSize:13 }}>
                {editingId === p.id ? (
                  <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} min="0" step="0.01" autoFocus
                    style={{ width:80, padding:'4px 6px', background:'var(--bg-2)', border:'1px solid var(--accent)',
                      borderRadius:4, color:'var(--text-1)', fontSize:13 }}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(p); if (e.key === 'Escape') setEditingId(null); }} />
                ) : (
                  <span style={{ color: p.cantidad_preparada != null ? 'var(--success)' : 'var(--text-4)' }}>
                    {p.cantidad_preparada ?? '—'}
                  </span>
                )}
              </td>
              <td style={{ padding:'8px 12px', fontSize:12, color:'var(--text-3)' }}>{p.unidad}</td>
              {editable && isAlmacen && (
                <td style={{ padding:'8px 12px', width:80 }}>
                  {editingId === p.id ? (
                    <div style={{ display:'flex', gap:4 }}>
                      <Btn variant="primary" size="sm" icon="check" onClick={() => saveEdit(p)} />
                      <Btn variant="ghost" size="sm" icon="x" onClick={() => setEditingId(null)} />
                    </div>
                  ) : (
                    <Btn variant="ghost" size="sm" icon="edit" onClick={() => startEdit(p)} />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
