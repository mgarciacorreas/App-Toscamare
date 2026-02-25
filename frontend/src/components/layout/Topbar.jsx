import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLES, ROLE_META } from '@/config/constants';
import { SVG } from '@/components/ui';

export default function Topbar({ title, subtitle, actions }) {
  const { logout, pedidos, session } = useContext(AppContext);
  const meta = ROLE_META[session.user.rol];

  const pendingCount = pedidos.filter(p => {
    if (meta.estadoVisible === -1) return true; // admin sees all
    if (session.user.rol === ROLES.OFICINA) return p.estado_actual === 3;
    return p.estado_actual === meta.estadoVisible;
  }).length;

  return (
    <header style={{ padding:'16px 28px', background:'var(--bg-1)', borderBottom:'1px solid var(--border-1)',
      display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:600, letterSpacing:'-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>{subtitle}</p>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {actions}
        <div className="tooltip" data-tip={pendingCount+' pendientes'} style={{ position:'relative' }}>
          <button style={{ width:36, height:36, borderRadius:'var(--r2)', background:'var(--bg-2)',
            border:'1px solid var(--border-2)', cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', color:'var(--text-3)' }}>
            <SVG name="bell" size={16} />
          </button>
          {pendingCount > 0 && <span style={{ position:'absolute', top:-3, right:-3, width:16, height:16,
            borderRadius:'50%', background:'var(--accent)', color:'#0A0C10', fontSize:9, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center' }}>{pendingCount}</span>}
        </div>
        <button onClick={logout} className="tooltip" data-tip="Cerrar sesión" style={{
          width:36, height:36, borderRadius:'var(--r2)', background:'var(--bg-2)',
          border:'1px solid var(--border-2)', cursor:'pointer', display:'flex', alignItems:'center',
          justifyContent:'center', color:'var(--text-3)' }}>
          <SVG name="logout" size={16} />
        </button>
      </div>
    </header>
  );
}
