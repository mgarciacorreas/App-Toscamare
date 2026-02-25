// ═══════════════════════════════════════════════════════════════
// API Layer — Conecta con el backend Flask del compañero
//
// Auth flow:
//   1. Frontend redirige a GET /api/login → Microsoft OAuth
//   2. Backend callback genera JWT, redirige a FRONTEND?token=JWT
//   3. Frontend captura token de URL, lo guarda en localStorage
//   4. POST /api/verify-token valida el JWT
//
// Endpoints de pedidos apuntan al backend FastAPI de sistema-pedidos
// (el compañero puede integrarlos en Flask o usar un segundo server)
// ═══════════════════════════════════════════════════════════════

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_BASE = BACKEND_URL + '/api';

// ── Token management ─────────────────────────────────────────

export function getStoredToken() {
  return localStorage.getItem('jwt');
}

function setStoredToken(token) {
  localStorage.setItem('jwt', token);
}

export function clearToken() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
}

function headers(extra = {}) {
  const h = { ...extra };
  const token = getStoredToken();
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

// ── Base request ─────────────────────────────────────────────

async function request(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: headers(opts.headers || {}),
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error del servidor' }));
    throw new Error(err.detail || err.error || 'Error');
  }

  // Handle CSV/blob responses
  if (res.headers.get('content-type')?.includes('text/csv')) return res;

  return res.json();
}

// ── Auth (adapted to colleague's Flask backend) ──────────────

/**
 * Redirect to Microsoft OAuth via backend
 * The backend handles the full OAuth flow and redirects back with ?token=JWT
 */
export function loginMicrosoft() {
  window.location.href = API_BASE + '/login';
}

/**
 * Verify a JWT token with the backend
 * Returns { valid: true, user: { user_id, email, nombre, rol } } or throws
 */
export async function verifyToken(token) {
  const res = await fetch(API_BASE + '/verify-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const data = await res.json();

  if (!data.valid) {
    clearToken();
    throw new Error('Token inválido');
  }

  // Normalize: backend sends user_id, frontend expects id
  const user = data.user;
  if (user.user_id && !user.id) {
    user.id = user.user_id;
  }

  return user;
}

/**
 * Complete login flow: store token, verify, return user
 */
export async function handleOAuthCallback(token) {
  setStoredToken(token);
  const user = await verifyToken(token);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

/**
 * Try to restore session from localStorage
 */
export async function restoreSession() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const user = await verifyToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch {
    clearToken();
    return null;
  }
}

export function logout() {
  clearToken();
}

// ── Pedidos ──────────────────────────────────────────────────

export function fetchPedidos(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v);
  });
  return request('/pedidos?' + qs.toString());
}

export function fetchPedido(id) {
  return request('/pedidos/' + id);
}

export function createPedido(data) {
  return request('/pedidos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updatePedido(id, data) {
  return request('/pedidos/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function advancePedido(id) {
  return request('/pedidos/' + id + '/avanzar', { method: 'PUT' });
}

export function updateChecklist(id, checklist) {
  return request('/pedidos/' + id + '/checklist', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checklist),
  });
}

export function finalizePedido(id) {
  return request('/pedidos/' + id + '/finalizar', { method: 'PUT' });
}

export function deletePedido(id) {
  return request('/pedidos/' + id, { method: 'DELETE' });
}

export async function exportCSV(id) {
  const res = await fetch(API_BASE + '/pedidos/' + id + '/csv', { headers: headers() });
  if (!res.ok) throw new Error('Error al exportar');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pedido.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Productos ────────────────────────────────────────────────

export function fetchProductos(pedidoId) {
  return request('/pedidos/' + pedidoId + '/productos');
}

export function addProducto(pedidoId, data) {
  return request('/pedidos/' + pedidoId + '/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateProductoCantidad(pedidoId, productoId, cantidad_preparada) {
  return request('/pedidos/' + pedidoId + '/productos/' + productoId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad_preparada }),
  });
}

export function deleteProducto(pedidoId, productoId) {
  return request('/pedidos/' + pedidoId + '/productos/' + productoId, { method: 'DELETE' });
}

// ── PDF ──────────────────────────────────────────────────────

export function uploadPDF(pedidoId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/archivos/pedidos/' + pedidoId + '/pdf', {
    method: 'POST',
    body: formData,
  });
}

export function getPDFUrl(pedidoId) {
  return API_BASE + '/archivos/pedidos/' + pedidoId + '/pdf';
}

// ── Usuarios ─────────────────────────────────────────────────

export function fetchUsuarios() {
  return request('/usuarios/');
}

export function createUsuario(data) {
  return request('/usuarios/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateUsuario(id, data) {
  return request('/usuarios/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ── Log ──────────────────────────────────────────────────────

export function fetchLog(tipo) {
  const qs = tipo ? '?tipo=' + tipo : '';
  return request('/usuarios/log' + qs);
}
