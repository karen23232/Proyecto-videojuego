const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: {
      type: String,
      required: [true, 'El nombre del autor es obligatorio'],
      trim: true,
      maxlength: [40, 'El nombre del autor no puede exceder 40 caracteres'],
    },
    rating: {
      type: Number,
      required: [true, 'La calificacion es obligatoria'],
      min: [1, 'La calificacion minima es 1'],
      max: [5, 'La calificacion maxima es 5'],
    },
    content: {
      type: String,
      required: [true, 'El contenido es obligatorio'],
      trim: true,
      maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
    },
    status: {
      type: String,
      enum: ['active', 'hidden'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
