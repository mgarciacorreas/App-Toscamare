import { useState, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLES, ROLE_META } from '@/config/constants';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DashboardView from './DashboardView';
import PedidosView from './PedidosView';
import PipelineView from './PipelineView';
import UsuariosView from './UsuariosView';

const VIEW_META = {
  dashboard: (u) => ({ title: 'Dashboard', subtitle: 'Bienvenido, ' + u.nombre }),
  pedidos:   (u) => ({ title: 'Gestión de Pedidos', subtitle: u.rol === ROLES.ADMIN ? 'Todos los pedidos' : 'Vista de ' + ROLE_META[u.rol].label }),
  pipeline:  ()  => ({ title: 'Pipeline', subtitle: 'Vista Kanban de todos los estados' }),
  usuarios:  ()  => ({ title: 'Gestión de Usuarios', subtitle: 'Administrar cuentas y roles' }),
};

export default function MainLayout() {
  const { session } = useContext(AppContext);
  const [view, setView] = useState('pedidos');
  const meta = (VIEW_META[view] || VIEW_META.pedidos)(session.user);

  const canAccessView = (viewId) => {
    if (session.user.rol === ROLES.ADMIN) return true;
    return viewId === 'pedidos';
  };

  const handleSetView = (newView) => {
    if (canAccessView(newView)) {
      setView(newView);
    } else {
      setView('pedidos');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-0)' }}>
      <Sidebar currentView={view} setView={handleSetView} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {view === 'dashboard' && session.user.rol === ROLES.ADMIN && <DashboardView setView={handleSetView} />}
          {view === 'pedidos'   && <PedidosView />}
          {view === 'pipeline'  && session.user.rol === ROLES.ADMIN && <PipelineView />}
          {view === 'usuarios'  && session.user.rol === ROLES.ADMIN && <UsuariosView />}
        </main>
      </div>
    </div>
  );
}
