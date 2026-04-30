const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const validate = require('../../common/middlewares/validate');
const { authMiddleware, optionalAuthMiddleware } = require('../../common/middlewares/authMiddleware');
const commentController = require('./comment.controller');
const { listCommentsQuerySchema, createCommentSchema, updateCommentSchema } = require('./comment.validation');

const router = express.Router();

router.get('/', validate(listCommentsQuerySchema, 'query'), asyncHandler(commentController.listComments));
router.post('/', optionalAuthMiddleware, validate(createCommentSchema), asyncHandler(commentController.createComment));
router.patch('/:id', authMiddleware, validate(updateCommentSchema), asyncHandler(commentController.updateComment));
router.delete('/:id', authMiddleware, asyncHandler(commentController.deleteComment));

module.exports = router;
