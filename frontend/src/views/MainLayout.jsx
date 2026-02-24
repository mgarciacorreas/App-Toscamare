import { useState, useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { ROLES, ROLE_META } from "@/config/constants";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import DashboardView from "./DashboardView";
import PedidosView from "./PedidosView";
import PipelineView from "./PipelineView";
import HistorialView from "./HistorialView";
import UsuariosView from "./UsuariosView";
import ActividadView from "./ActividadView";

const VIEW_META = {
  dashboard: (u) => ({
    title: "Dashboard",
    subtitle: "Bienvenido, " + u.nombre,
  }),
  pedidos: (u) => ({
    title: "Gestión de Pedidos",
    subtitle:
      u.rol === ROLES.ADMIN
        ? "Todos los pedidos"
        : "Vista de " + ROLE_META[u.rol].label,
  }),
  pipeline: () => ({
    title: "Pipeline",
    subtitle: "Vista Kanban de todos los estados",
  }),
  historial: () => ({
    title: "Historial de Entregas",
    subtitle: "Pedidos completados y archivados",
  }),
  usuarios: () => ({
    title: "Gestión de Usuarios",
    subtitle: "Administrar cuentas y roles",
  }),
  actividad: () => ({
    title: "Log de Actividad",
    subtitle: "Registro de acciones del sistema",
  }),
};

export default function MainLayout() {
  const { session } = useContext(AppContext);
  const [view, setView] = useState("pedidos");
  const meta = (VIEW_META[view] || VIEW_META.pedidos)(session.user);

  // Define which views each role can access
  const canAccessView = (viewId) => {
    const user = session.user;

    // Admin can access all views
    if (user.rol === ROLES.ADMIN) return true;

    // Non-admin users can only access pedidos and historial
    return ["pedidos", "historial"].includes(viewId);
  };

  // If user tries to access a restricted view, redirect to pedidos
  const handleSetView = (newView) => {
    if (canAccessView(newView)) {
      setView(newView);
    } else {
      setView("pedidos");
    }
  };

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "var(--bg-0)" }}
    >
      <Sidebar currentView={view} setView={handleSetView} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {view === "dashboard" && session.user.rol === ROLES.ADMIN && (
            <DashboardView setView={handleSetView} />
          )}
          {view === "pedidos" && <PedidosView />}
          {view === "pipeline" && session.user.rol === ROLES.ADMIN && (
            <PipelineView />
          )}
          {view === "historial" && <HistorialView />}
          {view === "usuarios" && session.user.rol === ROLES.ADMIN && (
            <UsuariosView />
          )}
          {view === "actividad" && session.user.rol === ROLES.ADMIN && (
            <ActividadView />
          )}
        </main>
      </div>
    </div>
  );
}
