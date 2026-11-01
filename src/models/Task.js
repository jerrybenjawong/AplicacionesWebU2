const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [120, 'El título no puede exceder 120 caracteres']
    },
    descripcion: {
      type: String,
      trim: true,
      default: ''
    },
    prioridad: {
      type: String,
      enum: {
        values: ['baja', 'media', 'alta'],
        message: 'Prioridad inválida'
      },
      default: 'media'
    },
    categoria: {
      type: String,
      trim: true,
      default: 'General'
    },
    estado: {
      type: String,
      enum: {
        values: ['pendiente', 'en_progreso', 'completada'],
        message: 'Estado inválido'
      },
      default: 'pendiente'
    },
    fechaLimite: {
      type: Date,
      default: null
    },
    archivoAdjunto: {
      type: String,
      default: null
    },
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El autor es mandatorio']
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Task', taskSchema);
