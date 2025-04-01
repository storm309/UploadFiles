import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure upload directory
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created uploads directory at: ${UPLOAD_DIR}`);
  }
} catch (err) {
  console.error(`Error creating uploads directory: ${err.message}`);
  process.exit(1); // Exit the application if the directory cannot be created
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Configure Multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Routes
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const downloadLink = `${req.protocol}://${req.get('host')}/download/${req.file.filename}`;
    res.json({ 
      success: true,
      filename: req.file.originalname,
      downloadLink,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/download/:file', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.file);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint: POST http://localhost:${PORT}/api/upload`);
});
