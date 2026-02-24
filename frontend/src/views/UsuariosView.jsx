import { useState, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLE_META } from '@/config/constants';
import { hashPassword } from '@/utils/auth';
import { generateId, now, formatDate } from '@/utils/helpers';
import { SVG, Btn, Badge, Modal, Input, Select } from '@/components/ui';

export default function UsuariosView() {
  const { db, setDb, showToast, addLog, session } = useContext(AppContext);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nombre:'', username:'', password:'', rol:'almacen' });

  const createUser = () => {
    if (!form.nombre||!form.username||!form.password) { showToast('Completa todos los campos','error'); return; }
    if (db.usuarios.some(u=>u.username===form.username)) { showToast('Username ya existe','error'); return; }
    setDb(prev => ({ ...prev, usuarios: [...prev.usuarios, { id:generateId(), ...form, password:hashPassword(form.password), activo:true, creado:now() }] }));
    addLog(session.user.nombre, 'Creó usuario', form.username+' ('+ROLE_META[form.rol].label+')', 'usuario');
    showToast('Usuario '+form.username+' creado'); setShowCreate(false);
    setForm({ nombre:'', username:'', password:'', rol:'almacen' });
  };

  const toggleUser = (u) => {
    setDb(prev => ({ ...prev, usuarios: prev.usuarios.map(usr => usr.id===u.id ? { ...usr, activo:!usr.activo } : usr) }));
    addLog(session.user.nombre, u.activo?'Desactivó usuario':'Activó usuario', u.username, 'usuario');
    showToast(u.username+' '+(u.activo?'desactivado':'activado'));
  };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <span style={{ fontSize:12, color:'var(--text-4)' }}>{db.usuarios.length} usuarios</span>
        <Btn variant="primary" icon="plus" onClick={()=>setShowCreate(true)}>Nuevo Usuario</Btn>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
        {db.usuarios.map((u,i) => {
          const meta = ROLE_META[u.rol];
          return (
            <div key={u.id} className={'anim-fade d'+Math.min(i+1,8)} style={{ background:'var(--bg-2)', border:'1px solid var(--border-1)',
              borderRadius:'var(--r3)', padding:'18px 20px', opacity:u.activo?1:.5, transition:'.15s var(--ease)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:meta.color+'14', border:'1px solid '+meta.color+'30',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <SVG name="user" size={20} color={meta.color} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:500 }}>{u.nombre}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                    <code style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>@{u.username}</code>
                    <Badge color={meta.color} style={{ fontSize:10 }}>{meta.label}</Badge>
                  </div>
                </div>
                {u.id !== session.user.id && <Btn variant={u.activo?'outline':'primary'} size="sm" onClick={()=>toggleUser(u)}>
                  {u.activo?'Desactivar':'Activar'}</Btn>}
              </div>
              <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-4)' }}>
                <span>Creado: {formatDate(u.creado)}</span>
                <span style={{ color:u.activo?'var(--success)':'var(--danger)' }}>{u.activo?'● Activo':'● Inactivo'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Crear Usuario">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Input label="NOMBRE" placeholder="Nombre completo" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Input label="USERNAME" placeholder="usuario123" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} />
            <Input label="CONTRASEÑA" type="password" placeholder="••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
          </div>
          <Select label="ROL" value={form.rol} onChange={e=>setForm(f=>({...f,rol:e.target.value}))} options={Object.entries(ROLE_META).map(([k,v])=>({value:k,label:v.label}))} />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
            <Btn variant="secondary" onClick={()=>setShowCreate(false)}>Cancelar</Btn>
            <Btn variant="primary" icon="plus" onClick={createUser}>Crear</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}