function getApiBaseUrl() {
  return import.meta.env.PUBLIC_API_BASE_URL || '/api/v1';
}

function getAuthApiUrl() {
  return `${getApiBaseUrl()}/auth`;
}

function getCommentsApiUrl() {
  return `${getApiBaseUrl()}/comments`;
}

export async function login(email, password) {
  const res = await fetch(`${getAuthApiUrl()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');
  return data;
}

export async function register(username, email, password, confirmPassword) {
  const res = await fetch(`${getAuthApiUrl()}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al registrarse');
  return data;
}

export async function refreshSession() {
  const res = await fetch(`${getAuthApiUrl()}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'No se pudo renovar la sesion');
  return data;
}

export async function logoutRequest() {
  const res = await fetch(`${getAuthApiUrl()}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'No se pudo cerrar la sesion');
  return data;
}

async function parseApiResponse(res, fallbackMessage) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || fallbackMessage);
  return data;
}

export async function fetchWithAuth(input, init = {}) {
  const token = localStorage.getItem('rm_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    try {
      const refreshed = await refreshSession();
      if (refreshed.accessToken) {
        localStorage.setItem('rm_token', refreshed.accessToken);
      }

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${localStorage.getItem('rm_token') || ''}`,
      };

      res = await fetch(input, {
        ...init,
        headers: retryHeaders,
        credentials: 'include',
      });
    } catch (error) {
      logout();
      throw new Error('Tu sesion expiro. Inicia sesion nuevamente.');
    }
  }

  return parseApiResponse(res, 'Error en la solicitud');
}

export async function listComments({ cursor, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', String(limit));
  const query = params.toString();

  const res = await fetch(`${getCommentsApiUrl()}${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseApiResponse(res, 'No se pudieron cargar los comentarios');
}

export async function createComment(payload) {
  return fetchWithAuth(`${getCommentsApiUrl()}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateComment(commentId, payload) {
  return fetchWithAuth(`${getCommentsApiUrl()}/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteComment(commentId) {
  return fetchWithAuth(`${getCommentsApiUrl()}/${commentId}`, {
    method: 'DELETE',
  });
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
