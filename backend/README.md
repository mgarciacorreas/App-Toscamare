# Backend - Autenticación Microsoft OAuth + JWT

## Endpoints disponibles

### 1. Health Check
```
GET /health
```
**Respuesta:**
```json
{ "status": "ok" }
```

---

### 2. Iniciar Login con Microsoft
```
GET /api/login
```
**Uso desde el frontend:**
```javascript
// Redirigir al usuario al login de Microsoft
window.location.href = 'http://localhost:5000/api/login';
```

**Flujo:**
1. Usuario hace clic en "Login con Microsoft"
2. El frontend redirige a `/api/login`
3. Microsoft autentica al usuario
4. Backend valida que el usuario exista en Supabase
5. Backend genera JWT y redirige al frontend: `http://localhost:5173?token=JWT_AQUI`

---

### 3. Verificar Token
```
POST /api/verify-token
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

**Respuesta exitosa (200):**
```json
{
  "valid": true,
  "user": {
    "user_id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "nombre": "Nombre del Usuario",
    "rol": "oficina",
    "exp": 1772020022
  }
}
```

**Respuesta inválida (401):**
```json
{
  "valid": false
}
```

---

## Integración en React

### 1. Capturar token después del callback

```jsx
// En App.jsx o componente principal
import { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Capturar token del URL después del callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // Guardar en localStorage
      localStorage.setItem('jwt', token);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, '/');
      
      // Verificar token
      verificarToken(token);
    } else {
      // Verificar si ya hay token guardado
      const savedToken = localStorage.getItem('jwt');
      if (savedToken) {
        verificarToken(savedToken);
      }
    }
  }, []);

  const verificarToken = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setUser(data.user);
      } else {
        localStorage.removeItem('jwt');
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('jwt');
    }
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/api/login';
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>Bienvenido, {user.nombre}</h1>
          <p>Rol: {user.rol}</p>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login con Microsoft</button>
      )}
    </div>
  );
}

export default App;
```

---

### 2. Context para manejar autenticación (opcional pero recomendado)

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      
      if (data.valid) {
        setUser(data.user);
      } else {
        localStorage.removeItem('jwt');
      }
    } catch (error) {
      console.error('Error:', error);
      localStorage.removeItem('jwt');
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = 'http://localhost:5000/api/login';
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

### 3. Usar el token en peticiones a Supabase

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu-anon-key'
);

// El token JWT del backend NO va a Supabase directamente
// Supabase tiene su propia autenticación
// El JWT del backend es solo para verificar quién está logueado en tu app

// Usa los datos del user (rol, id) para filtrar queries:
const { rol, user_id } = JSON.parse(atob(token.split('.')[1])); // decodificar JWT

// Ejemplo: solo ver pedidos según el rol
if (rol === 'almacen') {
  const { data } = await supabase
    .from('pedidos')
    .select('*')
    .eq('estado', 0); // solo almacén
}
```

---

## Variables de entorno necesarias

El backend necesita un archivo `.env` con:

```env
# Supabase
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_KEY="tu-anon-key"

# Microsoft OAuth
TENANT_ID="common"
CLIENT_ID="tu-client-id-de-azure"
CLIENT_SECRET="tu-secret-de-azure"
REDIRECT_URI="http://localhost:5000/api/callback"

# Frontend
FRONTEND_URL="http://localhost:5173"

# JWT
JWT_SECRET="clave-secreta-generada-aleatoriamente"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_HOURS="24"
```

---

## Instalación y ejecución

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python app.py
```

El servidor corre en `http://localhost:5000`

---

## Roles disponibles

- `oficina`
- `almacen`
- `logistica`
- `transportista`

El rol se guarda en el JWT y pueden usarlo para mostrar/ocultar secciones en el frontend.

---

## Notas importantes

1. **El usuario DEBE existir en Supabase** antes de poder hacer login
2. El email de Microsoft debe coincidir exactamente con el email en la tabla `usuarios`
3. Si el usuario no existe, el backend devuelve error 403
4. El JWT expira en 24 horas (configurable)
5. **NO subas el archivo `.env` a Git** (ya está en `.gitignore`)
