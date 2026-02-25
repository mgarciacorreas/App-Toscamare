import { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLE_META } from '@/config/constants';
import { formatDate } from '@/utils/helpers';
import { SVG, Btn, Badge, Modal, Input, Select } from '@/components/ui';
import * as api from '@/utils/api';

export default function UsuariosView() {
  const { usuarios, showToast, session, loadUsuarios } = useContext(AppContext);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nombre:'', email:'', password:'', rol:'almacen' });

  useEffect(() => { loadUsuarios(); }, [loadUsuarios]);

  const createUser = async () => {
    if (!form.nombre||!form.email) { showToast('Completa nombre y email','error'); return; }
    try {
      await api.createUsuario(form);
      showToast('Usuario '+form.email+' creado');
      setShowCreate(false);
      setForm({ nombre:'', email:'', password:'', rol:'almacen' });
      loadUsuarios();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const toggleUser = async (u) => {
    try {
      await api.updateUsuario(u.id, { activo: !u.activo });
      showToast(u.email+' '+(u.activo?'desactivado':'activado'));
      loadUsuarios();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <span style={{ fontSize:12, color:'var(--text-4)' }}>{usuarios.length} usuarios</span>
        <Btn variant="primary" icon="plus" onClick={()=>setShowCreate(true)}>Nuevo Usuario</Btn>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
        {usuarios.map((u,i) => {
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
                    <code style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>{u.email}</code>
                    <Badge color={meta.color} style={{ fontSize:10 }}>{meta.label}</Badge>
                  </div>
                </div>
                {u.id !== session.user.id && <Btn variant={u.activo?'outline':'primary'} size="sm" onClick={()=>toggleUser(u)}>
                  {u.activo?'Desactivar':'Activar'}</Btn>}
              </div>
              <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-4)' }}>
                <span>Creado: {formatDate(u.created_at)}</span>
                <span style={{ color:u.activo?'var(--success)':'var(--danger)' }}>{u.activo?'● Activo':'● Inactivo'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Crear Usuario">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Input label="NOMBRE" placeholder="Nombre completo" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} />
          <Input label="EMAIL" placeholder="usuario@empresa.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          <Input label="CONTRASEÑA (opcional si usa Microsoft)" type="password" placeholder="••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
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
