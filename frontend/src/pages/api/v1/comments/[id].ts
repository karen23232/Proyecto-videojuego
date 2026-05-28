import type { APIRoute } from 'astro';
import { supabaseAdmin, getUserFromRequest, transformComment, jsonResponse, errorResponse } from '../../../../lib/supabase';

export const PATCH: APIRoute = async ({ request, params }) => {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('No autorizado', 401);

  const { id } = params;

  const { data: comment, error: fetchError } = await supabaseAdmin
    .from('comments')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !comment) return errorResponse('Comentario no encontrado', 404);
  if (comment.user_id !== user.id) return errorResponse('No tienes permiso para editar este comentario', 403);

  let body: { content?: string; rating?: number };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Cuerpo de solicitud inválido', 400);
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.content !== undefined) {
    if (body.content.length < 1 || body.content.length > 1000) {
      return errorResponse('El comentario debe tener entre 1 y 1000 caracteres', 400);
    }
    updates.content = body.content;
  }
  if (body.rating !== undefined) {
    if (body.rating < 1 || body.rating > 5) {
      return errorResponse('La puntuación debe estar entre 1 y 5', 400);
    }
    updates.rating = body.rating;
  }

  const { data: updated, error } = await supabaseAdmin
    .from('comments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse('No se pudo actualizar el comentario', 500);

  return jsonResponse({ comment: transformComment(updated), message: 'Comentario actualizado' });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const user = await getUserFromRequest(request);
  if (!user) return errorResponse('No autorizado', 401);

  const { id } = params;

  const { data: comment, error: fetchError } = await supabaseAdmin
    .from('comments')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !comment) return errorResponse('Comentario no encontrado', 404);
  if (comment.user_id !== user.id) return errorResponse('No tienes permiso para eliminar este comentario', 403);

  const { error } = await supabaseAdmin.from('comments').delete().eq('id', id);
  if (error) return errorResponse('No se pudo eliminar el comentario', 500);

  return jsonResponse({ message: 'Comentario eliminado' });
};
