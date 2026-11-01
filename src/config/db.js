const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion_tareas';
  
  mongoose.connection.on('connected', () => {
    console.log(`[Persistencia] Conectado exitosamente a MongoDB: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Persistencia] Error de conexión en MongoDB: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Persistencia] Conexión con MongoDB terminada');
  });

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });
  } catch (error) {
    console.error(`[Persistencia Crítica] Fallo al iniciar Mongoose: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
