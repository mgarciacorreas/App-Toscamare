import { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '@/context/AppContext';
import { Modal, Btn, Input, Select, TextArea, SVG } from '@/components/ui';
import * as api from '@/utils/api';

export default function PedidoFormModal({ open, onClose, editPedido }) {
  const { showToast, loadPedidos } = useContext(AppContext);
  const [form, setForm] = useState({ cliente:'', direccion:'', telefono:'', prioridad:'media', notas:'' });
  const [productos, setProductos] = useState([{ nombre:'', cantidad_solicitada:'', unidad:'uds' }]);
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (editPedido) {
      setForm({ cliente:editPedido.cliente, direccion:editPedido.direccion, telefono:editPedido.telefono||'', prioridad:editPedido.prioridad, notas:editPedido.notas||'' });
      // Load existing products
      api.fetchProductos(editPedido.id).then(setProductos).catch(() => {});
    } else {
      setForm({ cliente:'', direccion:'', telefono:'', prioridad:'media', notas:'' });
      setProductos([{ nombre:'', cantidad_solicitada:'', unidad:'uds' }]);
    }
    setPdfFile(null);
  }, [editPedido, open]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const updateProd = (idx, key, val) => {
    setProductos(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  };

  const addProdRow = () => setProductos(prev => [...prev, { nombre:'', cantidad_solicitada:'', unidad:'uds' }]);

  const removeProdRow = (idx) => {
    if (productos.length <= 1) return;
    setProductos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.cliente || !form.direccion) { showToast('Completa cliente y dirección', 'error'); return; }
    const validProds = productos.filter(p => p.nombre && p.cantidad_solicitada);
    if (validProds.length === 0 && !editPedido) { showToast('Añade al menos un producto', 'error'); return; }

    setSaving(true);
    try {
      if (editPedido) {
        await api.updatePedido(editPedido.id, form);
        showToast(editPedido.codigo + ' actualizado');
      } else {
        const pedido = await api.createPedido({
          ...form,
          productos: validProds.map(p => ({ nombre: p.nombre, cantidad_solicitada: Number(p.cantidad_solicitada), unidad: p.unidad })),
        });
        // Upload PDF if selected
        if (pdfFile && pedido.id) {
          await api.uploadPDF(pedido.id, pdfFile);
        }
        showToast('Pedido ' + pedido.codigo + ' creado');
      }
      await loadPedidos();
      onClose();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editPedido ? 'Editar ' + editPedido.codigo : 'Nuevo Pedido'} wide>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Input label="CLIENTE *" placeholder="Nombre del cliente" value={form.cliente} onChange={set('cliente')} />
          <Input label="TELÉFONO" placeholder="555-0000" value={form.telefono} onChange={set('telefono')} />
        </div>
        <Input label="DIRECCIÓN *" placeholder="Dirección completa" value={form.direccion} onChange={set('direccion')} />

        {/* PDF Upload */}
        <div>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:6 }}>
            PDF del pedido
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }}
              onChange={e => setPdfFile(e.target.files[0] || null)} />
            <Btn variant="secondary" size="sm" icon="upload" onClick={() => fileRef.current?.click()}>
              {pdfFile ? pdfFile.name : (editPedido?.pdf_nombre || 'Seleccionar PDF')}
            </Btn>
            {pdfFile && <Btn variant="ghost" size="sm" icon="x" onClick={() => { setPdfFile(null); if(fileRef.current) fileRef.current.value=''; }} />}
          </div>
        </div>

        {/* Productos */}
        {!editPedido && <>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'.04em' }}>
            Productos *
          </span>
          <div style={{ background:'var(--bg-1)', border:'1px solid var(--border-1)', borderRadius:'var(--r2)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                {['Producto','Cantidad','Unidad',''].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--text-4)',
                    textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'1px solid var(--border-1)', background:'var(--bg-0)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i} style={{ borderBottom: i < productos.length-1 ? '1px solid var(--border-1)' : 'none' }}>
                    <td style={{ padding:'6px 8px' }}>
                      <input value={p.nombre} onChange={e => updateProd(i, 'nombre', e.target.value)} placeholder="Nombre del producto"
                        style={{ width:'100%', padding:'6px 8px', background:'var(--bg-2)', border:'1px solid var(--border-2)',
                          borderRadius:4, color:'var(--text-1)', fontSize:13 }} />
                    </td>
                    <td style={{ padding:'6px 8px', width:100 }}>
                      <input type="number" value={p.cantidad_solicitada} onChange={e => updateProd(i, 'cantidad_solicitada', e.target.value)}
                        placeholder="0" min="0" step="0.01"
                        style={{ width:'100%', padding:'6px 8px', background:'var(--bg-2)', border:'1px solid var(--border-2)',
                          borderRadius:4, color:'var(--text-1)', fontSize:13 }} />
                    </td>
                    <td style={{ padding:'6px 8px', width:90 }}>
                      <select value={p.unidad} onChange={e => updateProd(i, 'unidad', e.target.value)}
                        style={{ width:'100%', padding:'6px 8px', background:'var(--bg-2)', border:'1px solid var(--border-2)',
                          borderRadius:4, color:'var(--text-1)', fontSize:13 }}>
                        <option value="uds">uds</option>
                        <option value="kg">kg</option>
                        <option value="cajas">cajas</option>
                        <option value="pallets">pallets</option>
                        <option value="litros">litros</option>
                      </select>
                    </td>
                    <td style={{ padding:'6px 8px', width:40 }}>
                      {productos.length > 1 && <Btn variant="ghost" size="sm" icon="x" danger onClick={() => removeProdRow(i)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Btn variant="secondary" size="sm" icon="plus" onClick={addProdRow}>Añadir producto</Btn>
        </>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Select label="PRIORIDAD" value={form.prioridad} onChange={set('prioridad')} options={[
            {value:'urgente',label:'Urgente'},{value:'alta',label:'Alta'},{value:'media',label:'Media'},{value:'baja',label:'Baja'}
          ]} />
          <TextArea label="NOTAS" placeholder="Instrucciones especiales..." value={form.notas} onChange={set('notas')} style={{ minHeight:0 }} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" icon={editPedido ? 'edit' : 'plus'} disabled={saving} onClick={handleSave}>
            {saving ? 'Guardando...' : (editPedido ? 'Guardar Cambios' : 'Crear Pedido')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
