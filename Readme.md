# Sistema de Gestion de Tareas Colaborativas

Proyecto desarrollado para la asignatura de Aplicaciones Web (Unidad 2: Programacion del lado del servidor) de la Universidad Politecnica Salesiana.

API REST modular con persistencia NoSQL, autenticacion mediante tokens de sesion, carga de archivos y sincronizacion reactiva en tiempo real mediante WebSockets.

---

## Tecnologias Utilizadas

* Entorno de ejecucion: Node.js
* Framework web: Express.js
* Base de datos y ODM: MongoDB y Mongoose
* Autenticacion: JSON Web Tokens (JWT) y bcryptjs
* Manejo de adjuntos: Multer (almacenamiento local en disco)
* Comunicacion bidireccional: Socket.io (WebSockets)
* Frontend: Vanilla JavaScript, HTML5 y CSS3

---

## Requisitos Previos

* Node.js (version 18 o superior)
* npm (gestor de paquetes)
* Instancia local de MongoDB en ejecucion (puerto 27017) o conexion a MongoDB Atlas

---

## Instalacion y Despliegue Local

1. Clonar el repositorio:
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_CARPETA>

2. Instalar las dependencias del proyecto:
   npm install

3. Configurar variables de entorno (opcional, el sistema incluye valores por defecto):
   cp .env.example .env

4. Iniciar el servidor:
   npm start

El servidor se ejecutara en: http://localhost:3000

Para modo de desarrollo con recarga automatica:
   npm run dev

---

## Variables de Entorno

El proyecto lee la configuracion desde el archivo `.env`. Si el archivo no existe, el sistema utiliza valores de respaldo locales:

* PORT: Puerto en el que escucha el servidor HTTP (por defecto: 3000).
* MONGODB_URI: Cadena de conexion a MongoDB (por defecto: mongodb://127.0.0.1:27017/gestion_tareas).
* JWT_SECRET: Clave secreta para la firma criptografica de tokens JWT.

---

## Matriz de Endpoints REST

### Autenticacion (/api/auth)

* POST /api/auth/register
  Registro de nuevos usuarios.
  Cuerpo JSON: { "nombre": "...", "email": "...", "password": "..." }
  Respuestas: 201 Created, 400 Bad Request, 409 Conflict

* POST /api/auth/login
  Inicio de sesion y emision de token JWT.
  Cuerpo JSON: { "email": "...", "password": "..." }
  Respuestas: 200 OK, 400 Bad Request, 401 Unauthorized

* POST /api/auth/logout
  Cierre de sesion y limpieza de cookies de autenticacion.
  Respuestas: 200 OK

* GET /api/auth/me
  Obtencion de datos del perfil autenticado.
  Cabecera requerida: Authorization: Bearer <TOKEN>
  Respuestas: 200 OK, 401 Unauthorized

### Gestion de Tareas (/api/tasks)

Todas las rutas de tareas requieren autenticacion previa mediante cabecera Authorization o cookie de sesion.

* GET /api/tasks
  Listado general de tareas con autor poblado.
  Parametros opcionales de consulta: ?estado=<pendiente|en_progreso|completada>&prioridad=<baja|media|alta>
  Respuestas: 200 OK, 401 Unauthorized

* GET /api/tasks/:id
  Detalle de una tarea especifica por su identificador.
  Respuestas: 200 OK, 404 Not Found

* POST /api/tasks
  Creacion de tarea con soporte de adjuntos binarios (Multipart/form-data).
  Campos: titulo (obligatorio), descripcion, prioridad, categoria, fechaLimite, archivo (opcional).
  Respuestas: 201 Created, 400 Bad Request

* PUT /api/tasks/:id
  Actualizacion parcial o total del estado o contenido de una tarea.
  Respuestas: 200 OK, 404 Not Found

* DELETE /api/tasks/:id
  Eliminacion definitiva de la tarea en la base de datos.
  Respuestas: 200 OK, 404 Not Found

---

## Eventos en Tiempo Real (Socket.io)

El servidor emite notificaciones globales en broadcast a todos los clientes conectados al ocurrir mutaciones en la persistencia:

* task:created: Emitido al crear una tarea. Envia los datos completos y el autor.
* task:updated: Emitido al modificar el estado o contenido de una tarea.
* task:deleted: Emitido al remover un elemento del tablero.
* system:info: Notificacion informativa del canal de comunicacion.

---

## Estructura del Directorio

```text
.
├── public/              Frontend de la aplicacion (HTML, CSS, JS)
│   ├── app.js           Logica de consumo de API, sesion y sockets
│   └── index.html       Interfaz de usuario y tablero operativo
├── src/
│   ├── config/
│   │   └── db.js        Conexion y eventos del cliente Mongoose
│   ├── controllers/
│   │   ├── authController.js Controladores de autenticacion
│   │   └── taskController.js Controladores CRUD de tareas
│   ├── middlewares/
│   │   └── auth.js      Validacion de firmas e integridad JWT
│   ├── models/
│   │   ├── Task.js      Esquema de tareas con fechas y estados
│   │   └── User.js      Esquema de usuarios y hasheo bcrypt
│   ├── routes/
│   │   ├── authRoutes.js Definicion de rutas de acceso
│   │   └── taskRoutes.js Rutas REST y middleware Multer
│   ├── realtime.js      Inicializacion y disparadores de Socket.io
│   └── server.js        Punto de entrada de Express y servidor HTTP
├── uploads/             Directorio de almacenamiento de archivos adjuntos
├── .env.example         Plantilla de variables de entorno
├── .gitignore           Exclusion de dependencias y binarios
├── informe.html         Plantilla de reporte tecnico para conversion PDF
└── package.json         Definicion de dependencias y scripts de ejecucion
```

---

## Autor e Institucion

* Universidad Politecnica Salesiana
* Carrera de Computacion
* Asignatura: Aplicaciones Web