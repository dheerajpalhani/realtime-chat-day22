import multer from 'multer';
import path from 'path';

// Allocate memory buffer storage for swift upload streaming
const storage = multer.memoryStorage();

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  // Images (Max 10MB)
  image: ['.jpg', '.jpeg', '.png', '.webp'],
  // Documents (Max 10MB)
  doc: ['.pdf', '.docx', '.zip', '.txt', '.csv'],
  // Audio recordings (Max 15MB)
  audio: ['.webm', '.wav', '.mp3', '.ogg'],
};

// File type filter handler
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  const isImage = ALLOWED_EXTENSIONS.image.includes(ext);
  const isDoc = ALLOWED_EXTENSIONS.doc.includes(ext);
  const isAudio = ALLOWED_EXTENSIONS.audio.includes(ext);

  if (isImage || isDoc || isAudio) {
    cb(null, true);
  } else {
    cb(new Error(`File format ${ext} is not supported. Supported extensions: jpg, jpeg, png, webp, pdf, docx, zip, txt, csv, wav, mp3, ogg`), false);
  }
};

// Configure Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // Enforce a general hard limit of 15MB
  },
});

export default upload;
