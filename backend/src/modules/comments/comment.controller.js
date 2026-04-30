const commentService = require('./comment.service');
const response = require('../../common/utils/response');

const listComments = async (req, res) => {
  const data = await commentService.listComments({
    cursor: req.query.cursor,
    limit: req.query.limit,
  });

  return response.ok(res, data);
};

const createComment = async (req, res) => {
  const data = await commentService.createComment({
    userId: req.user?.id || null,
    authorName: req.body.authorName,
    rating: req.body.rating,
    content: req.body.content,
  });

  return response.ok(res, data, data.message, 201);
};

const updateComment = async (req, res) => {
  const data = await commentService.updateComment({
    id: req.params.id,
    userId: req.user.id,
    content: req.body.content,
    rating: req.body.rating,
    status: req.body.status,
  });

  return response.ok(res, data, data.message);
};

const deleteComment = async (req, res) => {
  const data = await commentService.deleteComment({
    id: req.params.id,
    userId: req.user.id,
  });

  return response.ok(res, {}, data.message);
};

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
};
