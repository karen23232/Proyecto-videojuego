import type { APIRoute } from 'astro';
import { supabaseAdmin, getUserFromRequest, transformComment, jsonResponse, errorResponse } from '../../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 50);

  const userId = url.searchParams.get('userId');

  let query = supabaseAdmin
    .from('comments')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (userId) query = query.eq('user_id', userId);
  if (cursor) {
    const cursorDate = Buffer.from(cursor, 'base64').toString('utf8');
    query = query.lt('created_at', cursorDate);
  }

  const { data, error } = await query;
  if (error) return errorResponse('No se pudieron cargar los comentarios', 500);

  const hasMore = data.length > limit;
  const rows = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore
    ? Buffer.from(rows[rows.length - 1].created_at).toString('base64')
    : null;

  return jsonResponse({
    comments: rows.map(transformComment),
    pageInfo: { nextCursor, hasMore },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('Debes iniciar sesión para comentar', 401);

  let body: { authorName?: string; rating?: number; content?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Cuerpo de solicitud inválido', 400);
  }

  const { authorName, rating, content } = body;
  if (!authorName || !rating || !content) {
    return errorResponse('Nombre, puntuación y comentario son requeridos', 400);
  }
  if (rating < 1 || rating > 5) {
    return errorResponse('La puntuación debe estar entre 1 y 5', 400);
  }
  if (content.length < 1 || content.length > 1000) {
    return errorResponse('El comentario debe tener entre 1 y 1000 caracteres', 400);
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ user_id: user.id, author_name: authorName, rating, content })
    .select()
    .single();

  if (error) return errorResponse('No se pudo publicar el comentario', 500);

  return jsonResponse({ comment: transformComment(data) }, 201);
};
