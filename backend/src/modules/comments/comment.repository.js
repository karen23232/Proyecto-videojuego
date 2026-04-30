const Comment = require('./comment.model');

const buildCursorFilter = (cursor) => {
  if (!cursor) return {};

  const [createdAtRaw, id] = cursor.split('_');
  const createdAt = new Date(createdAtRaw);

  if (Number.isNaN(createdAt.getTime()) || !id) {
    return {};
  }

  return {
    $or: [
      { createdAt: { $lt: createdAt } },
      { createdAt, _id: { $lt: id } },
    ],
  };
};

const commentRepository = {
  listActiveByCursor: async ({ cursor, limit }) => {
    const filter = {
      status: 'active',
      ...buildCursorFilter(cursor),
    };

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    return comments;
  },
  create: (payload) => Comment.create(payload),
  findById: (id) => Comment.findById(id),
  updateById: (id, payload) =>
    Comment.findByIdAndUpdate(id, payload, { returnDocument: 'after', runValidators: true }),
  deleteById: (id) => Comment.findByIdAndDelete(id),
};

module.exports = commentRepository;
