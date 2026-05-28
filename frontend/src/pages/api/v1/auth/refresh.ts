import type { APIRoute } from 'astro';
import { supabaseAdmin, supabaseAuth, jsonResponse, errorResponse } from '../../../../lib/supabase';

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=').trim()];
    })
  );
}

export const POST: APIRoute = async ({ request }) => {
  const cookies = parseCookies(request.headers.get('cookie'));
  const refreshToken = cookies['rm_refresh'];

  if (!refreshToken) {
    return errorResponse('No hay sesión activa', 401);
  }

  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) {
    return errorResponse('Sesión expirada, inicia sesión nuevamente', 401);
  }

  const cookieHeader = `rm_refresh=${data.session.refresh_token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Strict`;

  return jsonResponse(
    { accessToken: data.session.access_token },
    200,
    { 'Set-Cookie': cookieHeader }
  );
};
