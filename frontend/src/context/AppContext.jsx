import { createContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import * as api from '@/utils/api';
import { ROLE_META } from '@/config/constants';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [pedidos, setPedidos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [logActividad, setLogActividad] = useState([]);
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true); // starts true while checking auth
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Auth: handle OAuth callback + session restore ──────────

  useEffect(() => {
    const init = async () => {
      // 1. Check if redirected from OAuth callback with ?token=
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');

      if (tokenFromUrl) {
        // Clean URL
        window.history.replaceState({}, document.title, '/');
        try {
          const user = await api.handleOAuthCallback(tokenFromUrl);
          setSession({ token: tokenFromUrl, user });
        } catch (e) {
          showToast('Error al iniciar sesión: ' + e.message, 'error');
        }
        setLoading(false);
        return;
      }

      // 2. Try to restore session from localStorage
      try {
        const user = await api.restoreSession();
        if (user) {
          setSession({ token: api.getStoredToken(), user });
        }
      } catch {
        // Token invalid, session cleared by restoreSession
      }
      setLoading(false);
    };

    init();
  }, [showToast]);

  // ── Data loading ───────────────────────────────────────────

  const loadPedidos = useCallback(async (params = {}) => {
    try {
      const data = await api.fetchPedidos(params);
      setPedidos(data);
    } catch (e) { showToast(e.message, 'error'); }
  }, [showToast]);

  const loadHistorial = useCallback(async () => {
    try {
      const data = await api.fetchPedidos({ finalizado: true });
      setHistorial(data);
    } catch (e) { showToast(e.message, 'error'); }
  }, [showToast]);

  const loadUsuarios = useCallback(async () => {
    try {
      const data = await api.fetchUsuarios();
      setUsuarios(data);
    } catch { /* admin only, ignore for other roles */ }
  }, []);

  const loadLog = useCallback(async (tipo) => {
    try {
      const data = await api.fetchLog(tipo);
      setLogActividad(data);
    } catch { /* admin only */ }
  }, []);

  // ── Auth actions ───────────────────────────────────────────

  const loginMicrosoft = useCallback(() => {
    api.loginMicrosoft(); // redirects to backend → Microsoft
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setSession(null);
    setPedidos([]);
    setHistorial([]);
    setUsuarios([]);
    setLogActividad([]);
  }, []);

  // Load pedidos when session is established
  useEffect(() => {
    if (session) loadPedidos();
  }, [session, loadPedidos]);

  // ── Context value ──────────────────────────────────────────

  const ctx = useMemo(
    () => ({
      pedidos, setPedidos, historial, setHistorial, usuarios, logActividad,
      session, loginMicrosoft, logout, showToast, toast, loading,
      loadPedidos, loadHistorial, loadUsuarios, loadLog,
    }),
    [pedidos, historial, usuarios, logActividad, session, loginMicrosoft, logout, showToast, toast, loading, loadPedidos, loadHistorial, loadUsuarios, loadLog]
  );

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}
