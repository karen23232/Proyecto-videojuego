const API_URL = 'http://localhost:3000/api/auth';

export async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');
  return data;
}

export async function register(username, email, password, confirmPassword) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al registrarse');
  return data;
}

export function saveSession(token, user) {
  localStorage.setItem('rm_token', token);
  localStorage.setItem('rm_user', JSON.stringify(user));
}

export function loadSession() {
  const token = localStorage.getItem('rm_token');
  const userStr = localStorage.getItem('rm_user');
  if (token && userStr) {
    return { token, user: JSON.parse(userStr) };
  }
  return null;
}

export function logout() {
  localStorage.removeItem('rm_token');
  localStorage.removeItem('rm_user');
}

export function isAuthenticated() {
  return !!localStorage.getItem('rm_token');
}