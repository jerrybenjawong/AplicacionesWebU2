require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const realtime = require('./realtime');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const server = http.createServer(app);

// Inicializar WebSocket Server
realtime.init(server);

// Conexión MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.originalUrl} no encontrada en el servidor`
  });
});

// Error Handler Uniforme
app.use((err, req, res, next) => {
  console.error(`[Error Handler] ${err.stack}`);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Servidor Activo] Escuchando peticiones en http://localhost:${PORT}`);
});
