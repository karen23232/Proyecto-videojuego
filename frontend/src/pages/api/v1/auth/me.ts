import type { APIRoute } from 'astro';
import { supabaseAdmin, getUserFromRequest, jsonResponse, errorResponse } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('No autorizado', 401);

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  return jsonResponse({ user: { id: user.id, username: profile?.username ?? '', email: user.email } });
};
