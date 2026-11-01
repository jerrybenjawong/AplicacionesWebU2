const Task = require('../models/Task');
const realtime = require('../realtime');

exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.prioridad) filter.prioridad = req.query.prioridad;

    const tasks = await Task.find(filter)
      .populate('autor', 'nombre email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('autor', 'nombre email');
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { titulo, descripcion, prioridad, categoria, estado, fechaLimite } = req.body;

    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El campo título es mandatorio'
      });
    }

    const archivoAdjunto = req.file ? `/uploads/${req.file.filename}` : null;

    const newTask = await Task.create({
      titulo,
      descripcion,
      prioridad,
      categoria,
      estado,
      fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
      archivoAdjunto,
      autor: req.user.id
    });

    const populatedTask = await Task.findById(newTask._id).populate('autor', 'nombre email');
    realtime.emitTaskCreated(populatedTask);

    return res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, prioridad, categoria, estado, fechaLimite } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    }

    if (titulo !== undefined) task.titulo = titulo;
    if (descripcion !== undefined) task.descripcion = descripcion;
    if (prioridad !== undefined) task.prioridad = prioridad;
    if (categoria !== undefined) task.categoria = categoria;
    if (estado !== undefined) task.estado = estado;
    if (fechaLimite !== undefined) task.fechaLimite = fechaLimite ? new Date(fechaLimite) : null;

    if (req.file) {
      task.archivoAdjunto = `/uploads/${req.file.filename}`;
    }

    await task.save();
    const updatedTask = await Task.findById(id).populate('autor', 'nombre email');

    realtime.emitTaskUpdated(updatedTask);

    return res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    }

    const taskInfo = { id, titulo: task.titulo };
    await Task.findByIdAndDelete(id);

    realtime.emitTaskDeleted(taskInfo);

    return res.status(200).json({
      success: true,
      data: { message: 'Tarea eliminada exitosamente', id }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
