const { Server } = require('socket.io');

let io = null;

exports.init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
  });

  io.on('connection', (socket) => {
    socket.emit('system:info', {
      mensaje: 'Conexión WebSocket sincronizada con el clúster',
      timestamp: new Date().toLocaleTimeString()
    });
  });

  return io;
};

exports.emitTaskCreated = (task) => {
  if (io) {
    io.emit('task:created', {
      id: task._id,
      titulo: task.titulo,
      autor: task.autor?.nombre || 'Usuario',
      prioridad: task.prioridad,
      timestamp: new Date().toLocaleTimeString()
    });
  }
};

exports.emitTaskUpdated = (task) => {
  if (io) {
    io.emit('task:updated', {
      id: task._id,
      titulo: task.titulo,
      nuevoEstado: task.estado,
      timestamp: new Date().toLocaleTimeString()
    });
  }
};

exports.emitTaskDeleted = (taskData) => {
  if (io) {
    io.emit('task:deleted', {
      id: taskData.id,
      titulo: taskData.titulo,
      timestamp: new Date().toLocaleTimeString()
    });
  }
};
