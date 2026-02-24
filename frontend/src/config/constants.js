export const ROLES = {
  ALMACEN: "almacen",
  LOGISTICA: "logistica",
  OFICINA: "oficina",
  TRANSPORTISTA: "transportista",
  ADMIN: "admin",
};

export const ROLE_META = {
  [ROLES.ALMACEN]: {
    label: "Almacén",
    icon: "warehouse",
    color: "#F59E0B",
    estadoVisible: 0,
  },
  [ROLES.LOGISTICA]: {
    label: "Logística",
    icon: "route",
    color: "#3B82F6",
    estadoVisible: 1,
  },
  [ROLES.OFICINA]: {
    label: "Oficina",
    icon: "building",
    color: "#8B5CF6",
    estadoVisible: 2,
  },
  [ROLES.TRANSPORTISTA]: {
    label: "Transportista",
    icon: "truck",
    color: "#10B981",
    estadoVisible: 3,
  },
  [ROLES.ADMIN]: {
    label: "Administrador",
    icon: "shield",
    color: "#EC4899",
    estadoVisible: -1,
  },
};

export const ESTADOS = {
  0: {
    label: "En Preparación",
    color: "#F59E0B",
    bg: "#F59E0B12",
    borderColor: "#F59E0B30",
    role: ROLES.ALMACEN,
    action: "Marcar Preparado",
    nextLabel: "Logística",
  },
  1: {
    label: "Asignar Ruta",
    color: "#3B82F6",
    bg: "#3B82F612",
    borderColor: "#3B82F630",
    role: ROLES.LOGISTICA,
    action: "Asignar Ruta",
    nextLabel: "Oficina",
  },
  2: {
    label: "Revisión Oficina",
    color: "#8B5CF6",
    bg: "#8B5CF612",
    borderColor: "#8B5CF630",
    role: ROLES.OFICINA,
    action: "Aprobar Envío",
    nextLabel: "Transporte",
  },
  3: {
    label: "En Transporte",
    color: "#10B981",
    bg: "#10B98112",
    borderColor: "#10B98130",
    role: ROLES.TRANSPORTISTA,
    action: "Marcar Entregado",
    nextLabel: "Historial",
  },
};

export const PRIORIDAD_META = {
  urgente: {
    label: "Urgente",
    color: "#EF4444",
    bg: "#EF444415",
    border: "#EF444435",
  },
  alta: {
    label: "Alta",
    color: "#F59E0B",
    bg: "#F59E0B15",
    border: "#F59E0B35",
  },
  media: {
    label: "Media",
    color: "#3B82F6",
    bg: "#3B82F615",
    border: "#3B82F635",
  },
  baja: {
    label: "Baja",
    color: "#6B7280",
    bg: "#6B728015",
    border: "#6B728035",
  },
};
