export const ROLES = {
  ALMACEN: 'almacen', LOGISTICA: 'logistica', OFICINA: 'oficina',
  TRANSPORTISTA: 'transportista', ADMIN: 'admin',
};

export const ROLE_META = {
  [ROLES.ALMACEN]:       { label: 'Almacén',       icon: 'warehouse', color: '#F59E0B', estadoVisible: 0 },
  [ROLES.LOGISTICA]:     { label: 'Logística',     icon: 'route',     color: '#3B82F6', estadoVisible: 1 },
  [ROLES.TRANSPORTISTA]: { label: 'Transportista', icon: 'truck',     color: '#10B981', estadoVisible: 2 },
  [ROLES.OFICINA]:       { label: 'Oficina',       icon: 'building',  color: '#8B5CF6', estadoVisible: 3 },
  [ROLES.ADMIN]:         { label: 'Administrador', icon: 'shield',    color: '#EC4899', estadoVisible: -1 },
};

// Nuevo flujo:
// Oficina crea → estado 0 (Almacén prepara) → estado 1 (Logística revisa) → estado 2 (Transportista carga) → estado 3 (Oficina finaliza) → FIN
export const ESTADOS = {
  0: { label: 'Pendiente Almacén',    color: '#F59E0B', bg: '#F59E0B12', borderColor: '#F59E0B30', role: ROLES.ALMACEN,       action: 'Marcar Preparado',  nextLabel: 'Logística' },
  1: { label: 'Revisión Logística',   color: '#3B82F6', bg: '#3B82F612', borderColor: '#3B82F630', role: ROLES.LOGISTICA,     action: 'Aprobar',           nextLabel: 'Transportista' },
  2: { label: 'Carga Transportista',  color: '#10B981', bg: '#10B98112', borderColor: '#10B98130', role: ROLES.TRANSPORTISTA, action: 'Confirmar Carga',   nextLabel: 'Oficina' },
  3: { label: 'Finalizar Oficina',    color: '#8B5CF6', bg: '#8B5CF612', borderColor: '#8B5CF630', role: ROLES.OFICINA,       action: 'Exportar y Finalizar', nextLabel: 'Completado' },
};

export const PRIORIDAD_META = {
  urgente: { label: 'Urgente', color: '#EF4444', bg: '#EF444415', border: '#EF444435' },
  alta:    { label: 'Alta',    color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B35' },
  media:   { label: 'Media',   color: '#3B82F6', bg: '#3B82F615', border: '#3B82F635' },
  baja:    { label: 'Baja',    color: '#6B7280', bg: '#6B728015', border: '#6B728035' },
};

export const CHECKLIST_ITEMS = [
  { key: 'checklist_mercancia', label: 'Mercancía completa' },
  { key: 'checklist_estado', label: 'Estado correcto del producto' },
  { key: 'checklist_documentacion', label: 'Documentación lista' },
];
