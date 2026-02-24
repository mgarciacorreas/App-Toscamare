import { useState, useMemo, useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { ROLES, ROLE_META, ESTADOS, PRIORIDAD_META } from "@/config/constants";
import { generateId, now, timeAgo } from "@/utils/helpers";
import { SVG, Btn, Badge, Select, Modal, EmptyState } from "@/components/ui";
import PedidoFormModal from "@/components/pedidos/PedidoFormModal";
import PedidoDetailModal from "@/components/pedidos/PedidoDetailModal";

export default function PedidosView() {
  const { db, setDb, session, showToast, addLog } = useContext(AppContext);
  const [search, setSearch] = useState("");
  const [filterPri, setFilterPri] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("rol");
  const [showCreate, setShowCreate] = useState(false);
  const [editPedido, setEditPedido] = useState(null);
  const [detailPedido, setDetailPedido] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [assignModal, setAssignModal] = useState(null);

  const isAdmin = session.user.rol === ROLES.ADMIN;
  const userEstado = ROLE_META[session.user.rol].estadoVisible;

  const pedidos = useMemo(() => {
    let list = db.pedidos_activos;
    if (filterEstado === "rol" && !isAdmin)
      list = list.filter((p) => p.estado_actual === userEstado);
    else if (filterEstado !== "rol" && filterEstado !== "todos")
      list = list.filter((p) => p.estado_actual === parseInt(filterEstado));
    if (filterPri !== "todos")
      list = list.filter((p) => p.prioridad === filterPri);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.codigo.toLowerCase().includes(q) ||
          p.cliente.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q),
      );
    }
    return list;
  }, [
    db.pedidos_activos,
    filterEstado,
    filterPri,
    search,
    isAdmin,
    userEstado,
  ]);

  const advanceOrder = (pedidoId) => {
    const pedido = db.pedidos_activos.find((p) => p.id === pedidoId);
    if (!pedido) return;
    if (pedido.estado_actual === 3) {
      const histItem = {
        id: generateId(),
        codigo: pedido.codigo,
        cliente: pedido.cliente,
        direccion: pedido.direccion,
        descripcion: pedido.descripcion,
        prioridad: pedido.prioridad,
        pdf_ruta: pedido.pdf_ruta,
        fecha_creacion: pedido.fecha_creacion,
        fecha_entrega: now(),
        entregado_por: session.user.nombre,
      };
      setDb((prev) => ({
        ...prev,
        pedidos_activos: prev.pedidos_activos.filter((p) => p.id !== pedidoId),
        historial: [histItem, ...prev.historial],
      }));
      addLog(
        session.user.nombre,
        "Entregó pedido",
        pedido.codigo + " → Historial",
      );
      showToast(pedido.codigo + " entregado");
    } else {
      const next = pedido.estado_actual + 1;
      setDb((prev) => ({
        ...prev,
        pedidos_activos: prev.pedidos_activos.map((p) =>
          p.id === pedidoId
            ? { ...p, estado_actual: next, fecha_actualizacion: now() }
            : p,
        ),
      }));
      addLog(
        session.user.nombre,
        "Avanzó pedido",
        pedido.codigo + " → " + ESTADOS[next].label,
      );
      showToast(pedido.codigo + " → " + ESTADOS[next].label);
    }
    setConfirmId(null);
  };

  const assignTransportista = (pedidoId, userId) => {
    setDb((prev) => ({
      ...prev,
      pedidos_activos: prev.pedidos_activos.map((p) =>
        p.id === pedidoId
          ? { ...p, asignado_a: userId, fecha_actualizacion: now() }
          : p,
      ),
    }));
    const u = db.usuarios.find((u) => u.id === userId),
      p = db.pedidos_activos.find((p) => p.id === pedidoId);
    addLog(
      session.user.nombre,
      "Asignó transportista",
      p.codigo + " → " + u?.nombre,
    );
    showToast("Transportista: " + u?.nombre);
    setAssignModal(null);
  };

  const deletePedido = (pedido) => {
    if (!window.confirm("¿Eliminar " + pedido.codigo + "?")) return;
    setDb((prev) => ({
      ...prev,
      pedidos_activos: prev.pedidos_activos.filter((p) => p.id !== pedido.id),
    }));
    addLog(session.user.nombre, "Eliminó pedido", pedido.codigo);
    showToast(pedido.codigo + " eliminado", "info");
  };

  const canAct = (p) =>
    isAdmin || ESTADOS[p.estado_actual]?.role === session.user.rol;
  const transportistas = db.usuarios.filter(
    (u) => u.rol === ROLES.TRANSPORTISTA && u.activo,
  );

  return (
    <div style={{ padding: 28 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pedidos..."
              style={{
                padding: "8px 12px 8px 34px",
                background: "var(--bg-2)",
                border: "1px solid var(--border-2)",
                borderRadius: "var(--r2)",
                color: "var(--text-1)",
                fontSize: 13,
                width: 240,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 11,
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <SVG name="search" size={14} color="var(--text-4)" />
            </div>
          </div>
          <Select
            value={filterPri}
            onChange={(e) => setFilterPri(e.target.value)}
            options={[
              { value: "todos", label: "Todas prioridades" },
              { value: "urgente", label: "Urgente" },
              { value: "alta", label: "Alta" },
              { value: "media", label: "Media" },
              { value: "baja", label: "Baja" },
            ]}
          />
          {isAdmin && (
            <Select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              options={[
                { value: "todos", label: "Todos los estados" },
                ...Object.entries(ESTADOS).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                })),
              ]}
            />
          )}
        </div>
        {(isAdmin || session.user.rol === ROLES.ALMACEN) && (
          <Btn
            variant="primary"
            icon="plus"
            onClick={() => {
              setEditPedido(null);
              setShowCreate(true);
            }}
          >
            Nuevo Pedido
          </Btn>
        )}
      </div>

      <p style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 14 }}>
        {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
        {!isAdmin && " en " + (ESTADOS[userEstado]?.label || "")}
      </p>

      {pedidos.length === 0 ? (
        <EmptyState
          icon="check"
          title="Sin pedidos pendientes"
          subtitle={search ? "Intenta otro término" : "Tu bandeja está vacía"}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pedidos.map((p, i) => {
            const est = ESTADOS[p.estado_actual],
              pri = PRIORIDAD_META[p.prioridad];
            const isConfirming = confirmId === p.id;
            const asignado = p.asignado_a
              ? db.usuarios.find((u) => u.id === p.asignado_a)
              : null;
            return (
              <div
                key={p.id}
                className={"anim-fade d" + Math.min(i + 1, 8)}
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-1)",
                  borderRadius: "var(--r3)",
                  padding: "16px 20px",
                  transition: ".15s var(--ease)",
                  borderLeft: "3px solid " + est.color,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-3)")
                }
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-1)";
                  e.currentTarget.style.borderLeftColor = est.color;
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <code
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 13,
                          fontWeight: 500,
                          color: est.color,
                        }}
                      >
                        {p.codigo}
                      </code>
                      <Badge
                        color={est.color}
                        bg={est.bg}
                        border={est.borderColor}
                      >
                        {est.label}
                      </Badge>
                      <Badge color={pri.color} bg={pri.bg} border={pri.border}>
                        {pri.label}
                      </Badge>
                    </div>
                    <p
                      style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}
                    >
                      {p.cliente}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-3)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.descripcion}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-4)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <SVG name="clock" size={12} color="var(--text-4)" />
                        {timeAgo(p.fecha_actualizacion)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-4)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <SVG name="map" size={12} color="var(--text-4)" />
                        {p.direccion.split(",")[0]}
                      </span>
                      {asignado && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-4)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <SVG name="truck" size={12} color="var(--text-4)" />
                          {asignado.nombre}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Btn
                      variant="ghost"
                      size="sm"
                      icon="eye"
                      onClick={() => setDetailPedido(p)}
                    />
                    {p.estado_actual === 1 && canAct(p) && !p.asignado_a && (
                      <Btn
                        variant="outline"
                        size="sm"
                        icon="truck"
                        onClick={() => setAssignModal(p)}
                      >
                        Asignar
                      </Btn>
                    )}
                    {canAct(p) &&
                      (isConfirming ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmId(null)}
                          >
                            No
                          </Btn>
                          <Btn
                            variant="primary"
                            size="sm"
                            danger={p.estado_actual === 3}
                            icon="check"
                            onClick={() => advanceOrder(p.id)}
                          >
                            Confirmar
                          </Btn>
                        </div>
                      ) : (
                        <Btn
                          variant="primary"
                          size="sm"
                          icon={
                            p.estado_actual === 3 ? "checkCirc" : "chevronR"
                          }
                          onClick={() => setConfirmId(p.id)}
                          style={
                            p.estado_actual === 3
                              ? { background: "var(--success)" }
                              : {}
                          }
                        >
                          {est.action}
                        </Btn>
                      ))}
                    {(isAdmin ||
                      (session.user.rol === ROLES.ALMACEN &&
                        p.estado_actual === 0)) && (
                      <>
                        <Btn
                          variant="ghost"
                          size="sm"
                          icon="edit"
                          onClick={() => {
                            setEditPedido(p);
                            setShowCreate(true);
                          }}
                        />
                        <Btn
                          variant="ghost"
                          size="sm"
                          icon="trash"
                          danger
                          onClick={() => deletePedido(p)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PedidoFormModal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditPedido(null);
        }}
        editPedido={editPedido}
      />
      <PedidoDetailModal
        open={!!detailPedido}
        onClose={() => setDetailPedido(null)}
        pedido={detailPedido}
      />

      <Modal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={"Asignar Transportista — " + (assignModal?.codigo || "")}
      >
        {assignModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p
              style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}
            >
              Selecciona un transportista:
            </p>
            {transportistas.map((t) => (
              <button
                key={t.id}
                onClick={() => assignTransportista(assignModal.id, t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "var(--bg-1)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--r2)",
                  cursor: "pointer",
                  transition: ".12s var(--ease)",
                  color: "var(--text-1)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--success)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-2)")
                }
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#10B98118",
                    border: "1px solid #10B98130",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SVG name="truck" size={16} color="var(--success)" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{t.nombre}</p>
                  <p style={{ fontSize: 12, color: "var(--text-4)" }}>
                    @{t.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
