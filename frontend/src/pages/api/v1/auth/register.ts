import type { APIRoute } from 'astro';
import { supabaseAdmin, supabaseAuth, jsonResponse, errorResponse } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  let body: { username?: string; email?: string; password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Cuerpo de solicitud inválido', 400);
  }

  const { username, email, password, confirmPassword } = body;

  if (!username || !email || !password || !confirmPassword) {
    return errorResponse('Todos los campos son requeridos', 400);
  }
  if (password !== confirmPassword) {
    return errorResponse('Las contraseñas no coinciden', 400);
  }
  if (username.length < 3 || username.length > 20) {
    return errorResponse('El nombre de usuario debe tener entre 3 y 20 caracteres', 400);
  }
  if (password.length < 6) {
    return errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
  }

  // Check username availability
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    return errorResponse('El nombre de usuario ya está en uso', 409);
  }

  // Create auth user (email_confirm: true skips email verification)
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes('already registered')) {
      return errorResponse('El email ya está registrado', 409);
    }
    return errorResponse(createError.message, 400);
  }

  // Insert profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: created.user.id, username, email });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return errorResponse(`[profile] ${profileError.message}`, 500);
  }

  // Sign in to get session
  const { data: session, error: signInError } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (signInError || !session.session) {
    return errorResponse(`[signin] ${signInError?.message ?? 'sin sesión'}`, 500);
  }

  const cookieHeader = `rm_refresh=${session.session.refresh_token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Strict`;

  return jsonResponse(
    {
      accessToken: session.session.access_token,
      user: { id: created.user.id, username, email },
    },
    201,
    { 'Set-Cookie': cookieHeader }
  );
};
