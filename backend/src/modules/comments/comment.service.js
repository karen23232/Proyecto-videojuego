const mongoose = require('mongoose');
const AppError = require('../../common/errors/AppError');
const commentRepository = require('./comment.repository');
const User = require('../users/user.model');

const isAdminUser = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return false;
  const user = await User.findById(userId).select('role');
  return user?.role === 'admin';
};

const parseLimit = (rawLimit) => {
  const parsed = Number(rawLimit || 10);
  if (!Number.isInteger(parsed) || parsed < 1) return 10;
  return Math.min(parsed, 50);
};

const buildCursor = (comment) => {
  return `${new Date(comment.createdAt).toISOString()}_${comment._id}`;
};

const listComments = async ({ cursor, limit }) => {
  const safeLimit = parseLimit(limit);
  const rows = await commentRepository.listActiveByCursor({ cursor, limit: safeLimit });

  const hasMore = rows.length > safeLimit;
  const pageItems = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore ? buildCursor(pageItems[pageItems.length - 1]) : null;

  return {
    comments: pageItems,
    pageInfo: {
      hasMore,
      nextCursor,
    },
  };
};

const createComment = async ({ userId, authorName, rating, content }) => {
  if (!authorName || !rating || !content) {
    throw new AppError('authorName, rating y content son obligatorios', 400);
  }

  const ratingNumber = Number(rating);
  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
    throw new AppError('rating debe ser un entero entre 1 y 5', 400);
  }

  const created = await commentRepository.create({
    userId: userId || null,
    authorName: String(authorName).trim(),
    rating: ratingNumber,
    content: String(content).trim(),
    status: 'active',
  });

  return {
    message: 'Comentario creado',
    comment: created,
  };
};

const updateComment = async ({ id, userId, content, rating, status }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('ID de comentario invalido', 400);
  }

  const existing = await commentRepository.findById(id);
  if (!existing) {
    throw new AppError('Comentario no encontrado', 404);
  }

  const isOwner = existing.userId && String(existing.userId) === String(userId);
  const isAdmin = await isAdminUser(userId);
  if (!isOwner && !isAdmin) {
    throw new AppError('No autorizado para editar este comentario', 403);
  }

  const payload = {};
  if (typeof content !== 'undefined') payload.content = String(content).trim();
  if (typeof status !== 'undefined') payload.status = status;
  if (typeof rating !== 'undefined') {
    const ratingNumber = Number(rating);
    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      throw new AppError('rating debe ser un entero entre 1 y 5', 400);
    }
    payload.rating = ratingNumber;
  }

  const updated = await commentRepository.updateById(id, payload);

  return {
    message: 'Comentario actualizado',
    comment: updated,
  };
};

const deleteComment = async ({ id, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('ID de comentario invalido', 400);
  }

  const existing = await commentRepository.findById(id);
  if (!existing) {
    throw new AppError('Comentario no encontrado', 404);
  }

  const isOwner = existing.userId && String(existing.userId) === String(userId);
  const isAdmin = await isAdminUser(userId);
  if (!isOwner && !isAdmin) {
    throw new AppError('No autorizado para eliminar este comentario', 403);
  }

  await commentRepository.deleteById(id);

  return {
    message: 'Comentario eliminado',
  };
};

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
};
