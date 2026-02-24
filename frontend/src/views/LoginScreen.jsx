import { useState, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLES, ROLE_META, ESTADOS } from '@/config/constants';
import { verifyPassword, createToken } from '@/utils/auth';
import { SVG, Btn, Input, Spinner } from '@/components/ui';

export default function LoginScreen() {
  const { db, login } = useContext(AppContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    setTimeout(() => {
      const user = db.usuarios.find(u => u.username === username && u.activo);
      if (!user || !verifyPassword(password, user.password)) {
        setError('Credenciales incorrectas'); setShaking(true);
        setTimeout(() => setShaking(false), 400); setLoading(false); return;
      }
      login(user, createToken({ id: user.id, rol: user.rol }));
    }, 500);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg-0)' }}>
      {/* Left panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
        background:'linear-gradient(145deg, #0E1017 0%, #14161E 50%, #0E1017 100%)',
        borderRight:'1px solid var(--border-1)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:.04,
          backgroundImage:'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
          backgroundSize:'60px 60px' }} />
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)', top:'30%', left:'40%', transform:'translate(-50%,-50%)' }} />
        <div className="anim-fade" style={{ position:'relative', zIndex:1, textAlign:'center', padding:40 }}>
          <div style={{ width:72, height:72, borderRadius:18, background:'var(--accent-dim)',
            border:'1px solid var(--accent-border)', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:28 }}>
            <SVG name="box" size={36} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize:30, fontWeight:700, letterSpacing:'-0.03em', lineHeight:1.2 }}>Toscamare</h1>
          <p style={{ color:'var(--text-3)', fontSize:14, marginTop:12, maxWidth:320 }}>
            Gestión de pedidos para minoristas y mayoristas
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:32, flexWrap:'wrap' }}>
            {Object.entries(ESTADOS).map(([k,v],i) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ padding:'4px 10px', borderRadius:5, fontSize:10, fontWeight:600,
                  color:v.color, background:v.bg, border:'1px solid '+v.borderColor, letterSpacing:'.03em' }}>{v.label}</span>
                {i < 3 && <SVG name="chevronR" size={12} color="var(--text-4)" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ width:460, display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 50px', background:'var(--bg-1)' }}>
        <div className="anim-fade d2">
          <h2 style={{ fontSize:22, fontWeight:600, marginBottom:6 }}>Iniciar Sesión</h2>
          <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:28 }}>Ingresa tus credenciales para acceder</p>
          <form onSubmit={handleSubmit}>
            <Input label="USUARIO" placeholder="Ej: almacen1" value={username} onChange={e=>setUsername(e.target.value)} style={{ marginBottom:16 }} />
            <Input label="CONTRASEÑA" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={{ marginBottom:24 }} />
            {error && (
              <div className={shaking?'anim-shake':'anim-fade'} style={{ padding:'10px 14px', marginBottom:16, borderRadius:'var(--r2)',
                background:'#E5484D12', border:'1px solid #E5484D30', color:'var(--danger)', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                <SVG name="alert" size={15} color="var(--danger)" />{error}
              </div>
            )}
            <Btn variant="primary" size="lg" icon="lock" disabled={loading} onClick={handleSubmit} style={{ width:'100%' }}>
              {loading ? <><Spinner /> Validando...</> : 'Iniciar Sesión'}
            </Btn>
          </form>
          <div style={{ marginTop:32, padding:18, background:'var(--bg-0)', borderRadius:'var(--r2)', border:'1px solid var(--border-1)' }}>
            <p style={{ fontSize:10, fontWeight:600, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>
              Cuentas demo — Contraseña: 1234
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px' }}>
              {db.usuarios.filter(u=>u.rol!==ROLES.ADMIN).map(u => (
                <div key={u.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <code style={{ fontFamily:'var(--mono)', fontSize:12, color:ROLE_META[u.rol].color }}>{u.username}</code>
                  <span style={{ fontSize:10, color:'var(--text-4)' }}>{ROLE_META[u.rol].label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border-1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <code style={{ fontFamily:'var(--mono)', fontSize:12, color:ROLE_META.admin.color }}>admin</code>
              <span style={{ fontSize:10, color:'var(--text-4)' }}>Admin (pw: admin)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}