import type { APIRoute } from 'astro';
import { supabaseAdmin, supabaseAuth, jsonResponse, errorResponse } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Cuerpo de solicitud inválido', 400);
  }

  const { email, password } = body;
  if (!email || !password) {
    return errorResponse('Email y contraseña son requeridos', 400);
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return errorResponse(`[login] ${error?.message ?? 'sin sesión'}`, 401);
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('username, email')
    .eq('id', data.user.id)
    .single();

  const refreshToken = data.session.refresh_token;
  const accessToken = data.session.access_token;

  const cookieHeader = `rm_refresh=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Strict`;

  return jsonResponse(
    { accessToken, user: { id: data.user.id, username: profile?.username ?? '', email: profile?.email ?? data.user.email } },
    200,
    { 'Set-Cookie': cookieHeader }
  );
};
