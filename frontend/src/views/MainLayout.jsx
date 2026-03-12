import { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { ROLES, ROLE_META } from '@/config/constants';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DashboardView from './DashboardView';
import PedidosView from './PedidosView';
import PipelineView from './PipelineView';
import CompletadosView from './CompletadosView';
import UsuariosView from './UsuariosView';

const VIEW_META = {
  dashboard:   (u) => ({ title: 'Dashboard', subtitle: 'Bienvenido, ' + u.nombre }),
  pedidos:     (u) => ({ title: 'Gestión de Pedidos', subtitle: (u.rol === ROLES.ADMIN || u.rol === ROLES.OFICINA) ? 'Todos los pedidos' : 'Vista de ' + ROLE_META[u.rol].label }),
  completados: ()  => ({ title: 'Pedidos Completados', subtitle: 'Historial de pedidos finalizados' }),
  pipeline:    ()  => ({ title: 'Pipeline', subtitle: 'Vista Kanban de todos los estados' }),
  usuarios:    ()  => ({ title: 'Gestión de Usuarios', subtitle: 'Administrar cuentas y roles' }),
};

export default function MainLayout() {
  const { session } = useContext(AppContext);
  const [view, setView] = useState('pedidos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const meta = (VIEW_META[view] || VIEW_META.pedidos)(session.user);
  
  // Close sidebar on view change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [view]);

  const canAccessView = (viewId) => {
    if (session.user.rol === ROLES.ADMIN) return true;
    if (session.user.rol === ROLES.OFICINA) return viewId !== 'usuarios';
    return viewId === 'pedidos';
  };
  const isModerator = session.user.rol === ROLES.ADMIN || session.user.rol === ROLES.OFICINA;

  const handleSetView = (newView) => {
    if (canAccessView(newView)) {
      setView(newView);
    } else {
      setView('pedidos');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-0)', position: 'relative' }}>
      <Sidebar 
        currentView={view} 
        setView={handleSetView} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar 
          title={meta.title} 
          subtitle={meta.subtitle} 
          onNavigate={handleSetView} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {view === 'dashboard' && isModerator && <DashboardView setView={handleSetView} />}
          {view === 'pedidos'      && <PedidosView />}
          {view === 'completados' && isModerator && <CompletadosView />}
          {view === 'pipeline'    && isModerator && <PipelineView />}
          {view === 'usuarios'  && session.user.rol === ROLES.ADMIN && <UsuariosView />}
        </main>
      </div>
    </div>
  );
}
