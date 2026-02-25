import { useContext } from 'react';
import { AppProvider, AppContext } from '@/context/AppContext';
import { Toast } from '@/components/ui';
import LoginScreen from '@/views/LoginScreen';
import MainLayout from '@/views/MainLayout';

function AppContent() {
  const { session, toast } = useContext(AppContext);
  return (
    <>
      {!session ? <LoginScreen /> : <MainLayout />}
      <Toast toast={toast} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
