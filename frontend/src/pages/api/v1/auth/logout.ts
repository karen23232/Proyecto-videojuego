import type { APIRoute } from 'astro';
import { supabaseAdmin, jsonResponse, getUserFromRequest } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  const user = await getUserFromRequest(request);
  if (user) {
    await supabaseAdmin.auth.admin.signOut(request.headers.get('Authorization')!.slice(7));
  }

  const clearCookie = 'rm_refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict';

  return jsonResponse(
    { message: 'Sesión cerrada exitosamente' },
    200,
    { 'Set-Cookie': clearCookie }
  );
};
