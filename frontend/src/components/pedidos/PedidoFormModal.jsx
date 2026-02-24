import { useState, useEffect, useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { Modal, Btn, Input, Select, TextArea } from "@/components/ui";
import { generateId, now } from "@/utils/helpers";

export default function PedidoFormModal({ open, onClose, editPedido }) {
  const { db, setDb, session, showToast, addLog } = useContext(AppContext);
  const [form, setForm] = useState({
    cliente: "",
    direccion: "",
    telefono: "",
    descripcion: "",
    prioridad: "media",
    notas: "",
  });

  useEffect(() => {
    if (editPedido)
      setForm({
        cliente: editPedido.cliente,
        direccion: editPedido.direccion,
        telefono: editPedido.telefono,
        descripcion: editPedido.descripcion,
        prioridad: editPedido.prioridad,
        notas: editPedido.notas,
      });
    else
      setForm({
        cliente: "",
        direccion: "",
        telefono: "",
        descripcion: "",
        prioridad: "media",
        notas: "",
      });
  }, [editPedido, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.cliente || !form.descripcion || !form.direccion) {
      showToast("Completa los campos obligatorios", "error");
      return;
    }
    if (editPedido) {
      setDb((prev) => ({
        ...prev,
        pedidos_activos: prev.pedidos_activos.map((p) =>
          p.id === editPedido.id
            ? { ...p, ...form, fecha_actualizacion: now() }
            : p,
        ),
      }));
      addLog(
        session.user.nombre,
        "Editó pedido",
        editPedido.codigo + " actualizado",
      );
      showToast(editPedido.codigo + " actualizado");
    } else {
      const codigo = "PED-2026-" + String(db.nextCodigo).padStart(4, "0");
      const nuevo = {
        id: generateId(),
        codigo,
        ...form,
        estado_actual: 0,
        pdf_ruta: "/docs/" + codigo.toLowerCase() + ".pdf",
        asignado_a: null,
        fecha_creacion: now(),
        fecha_actualizacion: now(),
      };
      setDb((prev) => ({
        ...prev,
        pedidos_activos: [nuevo, ...prev.pedidos_activos],
        nextCodigo: prev.nextCodigo + 1,
      }));
      addLog(session.user.nombre, "Creó pedido", codigo + " — " + form.cliente);
      showToast("Pedido " + codigo + " creado");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editPedido ? "Editar " + editPedido.codigo : "Nuevo Pedido"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Input
            label="CLIENTE *"
            placeholder="Nombre del cliente"
            value={form.cliente}
            onChange={set("cliente")}
          />
          <Input
            label="TELÉFONO"
            placeholder="555-0000"
            value={form.telefono}
            onChange={set("telefono")}
          />
        </div>
        <Input
          label="DIRECCIÓN *"
          placeholder="Dirección completa"
          value={form.direccion}
          onChange={set("direccion")}
        />
        <TextArea
          label="DESCRIPCIÓN *"
          placeholder="Detalle del contenido..."
          value={form.descripcion}
          onChange={set("descripcion")}
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Select
            label="PRIORIDAD"
            value={form.prioridad}
            onChange={set("prioridad")}
            options={[
              { value: "urgente", label: "🔴 Urgente" },
              { value: "alta", label: "🟡 Alta" },
              { value: "media", label: "🔵 Media" },
              { value: "baja", label: "⚪ Baja" },
            ]}
          />
          <TextArea
            label="NOTAS"
            placeholder="Instrucciones especiales..."
            value={form.notas}
            onChange={set("notas")}
            style={{ minHeight: 0 }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 8,
          }}
        >
          <Btn variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            icon={editPedido ? "edit" : "plus"}
            onClick={handleSave}
          >
            {editPedido ? "Guardar Cambios" : "Crear Pedido"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
