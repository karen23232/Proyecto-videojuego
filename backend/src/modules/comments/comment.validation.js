const { z } = require('zod');

const listCommentsQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const createCommentSchema = z.object({
  authorName: z.string().trim().min(1).max(40),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(1).max(1000),
});

const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  status: z.enum(['active', 'hidden']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar',
});

module.exports = {
  listCommentsQuerySchema,
  createCommentSchema,
  updateCommentSchema,
};
