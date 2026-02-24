import { createContext, useState, useCallback, useRef, useMemo } from "react";
import { createDatabase } from "@/utils/db";
import { ROLE_META } from "@/config/constants";
import { generateId, now } from "@/utils/helpers";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [db, setDb] = useState(createDatabase);
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const addLog = useCallback((usuario, accion, detalle, tipo = "estado") => {
    setDb((prev) => ({
      ...prev,
      log_actividad: [
        { id: generateId(), timestamp: now(), usuario, accion, detalle, tipo },
        ...prev.log_actividad,
      ],
    }));
  }, []);

  const login = useCallback(
    (user, token) => {
      setSession({ user, token });
      addLog(
        user.nombre,
        "Inició sesión",
        "Rol: " + ROLE_META[user.rol].label,
        "usuario",
      );
    },
    [addLog],
  );

  const logout = useCallback(() => {
    if (session) addLog(session.user.nombre, "Cerró sesión", "", "usuario");
    setSession(null);
  }, [session, addLog]);

  const ctx = useMemo(
    () => ({ db, setDb, session, login, logout, showToast, addLog, toast }),
    [db, session, login, logout, showToast, addLog, toast],
  );

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}
