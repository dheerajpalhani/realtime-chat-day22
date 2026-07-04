import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { handleFileUpload } from '../controllers/uploadController.js';

const router = express.Router();

// Apply JWT verification and upload single file interceptors
router.post('/', protect, upload.single('file'), handleFileUpload);

export default router;
