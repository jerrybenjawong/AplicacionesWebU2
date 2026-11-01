const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/auth');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${cleanFileName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', upload.single('archivo'), taskController.createTask);
router.put('/:id', upload.single('archivo'), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
