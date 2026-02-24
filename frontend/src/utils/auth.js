/**
 * Seguridad: Hashing + JWT
 * En producción: bcrypt + jsonwebtoken en servidor
 */
export function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) - h + pw.charCodeAt(i)) | 0;
  return "$2b$10$" + Math.abs(h).toString(36).padStart(12, "0");
}

export function verifyPassword(pw, hash) {
  return hashPassword(pw) === hash;
}

export function createToken(payload) {
  return btoa(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 }),
  );
}

export function decodeToken(token) {
  try {
    const p = JSON.parse(atob(token));
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}
