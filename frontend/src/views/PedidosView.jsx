import { useState, useMemo, useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLES, ROLE_META, ESTADOS, PRIORIDAD_META } from '@/config/constants';
import { timeAgo } from '@/utils/helpers';
import { SVG, Btn, Badge, Select, Modal, EmptyState } from '@/components/ui';
import PedidoFormModal from '@/components/pedidos/PedidoFormModal';
import PedidoDetailModal from '@/components/pedidos/PedidoDetailModal';
import * as api from '@/utils/api';

export default function PedidosView() {
  const { pedidos, session, showToast, loadPedidos } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [filterPri, setFilterPri] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('rol');
  const [showCreate, setShowCreate] = useState(false);
  const [editPedido, setEditPedido] = useState(null);
  const [detailPedido, setDetailPedido] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const isAdmin = session.user.rol === ROLES.ADMIN;
  const userEstado = ROLE_META[session.user.rol].estadoVisible;

  // Oficina ve estado 3 (para finalizar) además de poder crear
  const getVisibleEstados = () => {
    if (isAdmin) return null; // all
    if (session.user.rol === ROLES.OFICINA) return [3]; // solo ve estado 3 para finalizar
    return [userEstado];
  };

  const visibleEstados = getVisibleEstados();

  const filtered = useMemo(() => {
    let list = pedidos;
    if (filterEstado === 'rol' && visibleEstados) {
      list = list.filter(p => visibleEstados.includes(p.estado_actual));
    } else if (filterEstado !== 'rol' && filterEstado !== 'todos') {
      list = list.filter(p => p.estado_actual === parseInt(filterEstado));
    }
    if (filterPri !== 'todos') list = list.filter(p => p.prioridad === filterPri);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.codigo.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q));
    }
    return list;
  }, [pedidos, filterEstado, filterPri, search, visibleEstados]);

  const advanceOrder = async (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    setActionLoading(pedidoId);
    try {
      if (pedido.estado_actual === 3) {
        // Oficina finaliza
        await api.finalizePedido(pedidoId);
        showToast(pedido.codigo + ' finalizado');
      } else {
        await api.advancePedido(pedidoId);
        const nextLabel = ESTADOS[pedido.estado_actual + 1]?.label || 'Siguiente';
        showToast(pedido.codigo + ' → ' + nextLabel);
      }
      await loadPedidos();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(null);
      setConfirmId(null);
    }
  };

  const handleExportCSV = async (pedido) => {
    try {
      await api.exportCSV(pedido.id);
      showToast('CSV descargado');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = async (pedido) => {
    if (!window.confirm('¿Eliminar ' + pedido.codigo + '?')) return;
    try {
      await api.deletePedido(pedido.id);
      showToast(pedido.codigo + ' eliminado', 'info');
      await loadPedidos();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const canAct = (p) => {
    if (isAdmin) return true;
    return ESTADOS[p.estado_actual]?.role === session.user.rol;
  };

  const canCreate = session.user.rol === ROLES.OFICINA || isAdmin;
  const canDelete = (p) => isAdmin || (session.user.rol === ROLES.OFICINA && p.estado_actual === 0);

  return (
    <div style={{ padding:28 }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pedidos..."
              style={{ padding:'8px 12px 8px 34px', background:'var(--bg-2)', border:'1px solid var(--border-2)',
                borderRadius:'var(--r2)', color:'var(--text-1)', fontSize:13, width:240 }} />
            <div style={{ position:'absolute', top:'50%', left:11, transform:'translateY(-50%)', pointerEvents:'none' }}>
              <SVG name="search" size={14} color="var(--text-4)" />
            </div>
          </div>
          <Select value={filterPri} onChange={e=>setFilterPri(e.target.value)} options={[
            {value:'todos',label:'Todas prioridades'},{value:'urgente',label:'Urgente'},{value:'alta',label:'Alta'},{value:'media',label:'Media'},{value:'baja',label:'Baja'}
          ]} />
          {isAdmin && <Select value={filterEstado} onChange={e=>setFilterEstado(e.target.value)} options={[
            {value:'todos',label:'Todos los estados'}, ...Object.entries(ESTADOS).map(([k,v])=>({value:k,label:v.label}))
          ]} />}
        </div>
        {canCreate && (
          <Btn variant="primary" icon="plus" onClick={()=>{setEditPedido(null);setShowCreate(true)}}>Nuevo Pedido</Btn>
        )}
      </div>

      <p style={{ fontSize:12, color:'var(--text-4)', marginBottom:14 }}>
        {filtered.length} pedido{filtered.length!==1?'s':''}
        {!isAdmin && visibleEstados && (' en ' + visibleEstados.map(e => ESTADOS[e]?.label).join(', '))}
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon="check" title="Sin pedidos pendientes" subtitle={search?'Intenta otro término':'Tu bandeja está vacía'} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((p, i) => {
            const est = ESTADOS[p.estado_actual], pri = PRIORIDAD_META[p.prioridad];
            const isConfirming = confirmId === p.id;
            const isLoading = actionLoading === p.id;
            return (
              <div key={p.id} className={'anim-fade d'+Math.min(i+1,8)} style={{
                background:'var(--bg-2)', border:'1px solid var(--border-1)', borderRadius:'var(--r3)',
                padding:'16px 20px', transition:'.15s var(--ease)', borderLeft:'3px solid '+est.color }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-3)'}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-1)';e.currentTarget.style.borderLeftColor=est.color}}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <code style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:500, color:est.color }}>{p.codigo}</code>
                      <Badge color={est.color} bg={est.bg} border={est.borderColor}>{est.label}</Badge>
                      <Badge color={pri.color} bg={pri.bg} border={pri.border}>{pri.label}</Badge>
                    </div>
                    <p style={{ fontSize:14, fontWeight:500, marginBottom:3 }}>{p.cliente}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:8 }}>
                      <span style={{ fontSize:11, color:'var(--text-4)', display:'flex', alignItems:'center', gap:4 }}>
                        <SVG name="clock" size={12} color="var(--text-4)" />{timeAgo(p.fecha_actualizacion)}</span>
                      <span style={{ fontSize:11, color:'var(--text-4)', display:'flex', alignItems:'center', gap:4 }}>
                        <SVG name="map" size={12} color="var(--text-4)" />{p.direccion?.split(',')[0]}</span>
                      {p.pdf_nombre && <span style={{ fontSize:11, color:'var(--text-4)', display:'flex', alignItems:'center', gap:4 }}>
                        <SVG name="file" size={12} color="var(--text-4)" />PDF</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <Btn variant="ghost" size="sm" icon="eye" onClick={()=>setDetailPedido(p)} />

                    {/* Export CSV button for oficina at state 3 */}
                    {p.estado_actual === 3 && canAct(p) && (
                      <Btn variant="outline" size="sm" icon="download" onClick={() => handleExportCSV(p)}>CSV</Btn>
                    )}

                    {canAct(p) && (isConfirming ? (
                      <div style={{ display:'flex', gap:4 }}>
                        <Btn variant="ghost" size="sm" onClick={()=>setConfirmId(null)}>No</Btn>
                        <Btn variant="primary" size="sm" icon="check" disabled={isLoading}
                          onClick={()=>advanceOrder(p.id)}
                          style={p.estado_actual===3?{background:'var(--success)'}:{}}>
                          {isLoading ? '...' : 'Confirmar'}
                        </Btn>
                      </div>
                    ) : (
                      <Btn variant="primary" size="sm" icon={p.estado_actual===3?'checkCirc':'chevronR'}
                        onClick={()=>setConfirmId(p.id)}
                        style={p.estado_actual===3?{background:'var(--success)'}:{}}>
                        {est.action}
                      </Btn>
                    ))}

                    {canDelete(p) && <>
                      {p.estado_actual === 0 && session.user.rol === ROLES.OFICINA && (
                        <Btn variant="ghost" size="sm" icon="edit" onClick={()=>{setEditPedido(p);setShowCreate(true)}} />
                      )}
                      <Btn variant="ghost" size="sm" icon="trash" danger onClick={()=>handleDelete(p)} />
                    </>}
                    {isAdmin && (
                      <Btn variant="ghost" size="sm" icon="edit" onClick={()=>{setEditPedido(p);setShowCreate(true)}} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PedidoFormModal open={showCreate} onClose={()=>{setShowCreate(false);setEditPedido(null)}} editPedido={editPedido} />
      <PedidoDetailModal open={!!detailPedido} onClose={()=>setDetailPedido(null)} pedido={detailPedido} onRefresh={loadPedidos} />
    </div>
  );
}
