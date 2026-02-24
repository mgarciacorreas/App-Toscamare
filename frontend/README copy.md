# Sistema de Gestión de Pedidos

Aplicación de gestión de pedidos con flujo de estados y control de acceso por roles.

## Flujo de Estados
```
Almacén (0) → Logística (1) → Oficina (2) → Transporte (3) → Historial
```

## Estructura del Proyecto
```
src/
├── config/          # Constantes, iconos, configuración
├── context/         # Estado global (AppContext)
├── utils/           # Auth, helpers, seed de BD
├── components/
│   ├── ui/          # Componentes base reutilizables
│   ├── layout/      # Sidebar, Topbar
│   └── pedidos/     # Modales de pedido
├── views/           # Vistas principales por sección
├── App.jsx          # Root con provider
└── main.jsx         # Entry point
```

## Cuentas de Demo
| Usuario     | Contraseña | Rol           |
|-------------|-----------|---------------|
| almacen1    | 1234      | Almacén       |
| logistica1  | 1234      | Logística     |
| oficina1    | 1234      | Oficina       |
| trans1      | 1234      | Transportista |
| admin       | admin     | Administrador |

## Comandos
```bash
npm install
npm run dev
```
