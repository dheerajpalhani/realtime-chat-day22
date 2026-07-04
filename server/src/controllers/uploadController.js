import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file/media buffer directly to Cloudinary.
 * @route   POST /api/upload
 * @access  Private
 */
export const handleFileUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  
  // Enforce size rules: images/docs (10MB) vs audio (15MB)
  const isAudio = ['.webm', '.wav', '.mp3', '.ogg'].includes(ext);
  const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  const maxSize = isAudio ? 15 * 1024 * 1024 : 10 * 1024 * 1024;

  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `File size exceeds maximum allowed size of ${isAudio ? '15MB' : '10MB'}`
    });
  }

  // Fallback to data URI base64 format if Cloudinary variables are missing
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn('Cloudinary environment keys missing. Falling back to memory Base64 representation.');
    const b64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype;
    const fallbackUrl = `data:${mime};base64,${b64}`;

    return res.status(200).json({
      success: true,
      url: fallbackUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  }

  try {
    let folder = 'chatflow_assets';
    let resource_type = 'auto';

    if (isAudio) {
      folder = 'chatflow_voice_notes';
      resource_type = 'video'; // Audio notes are classified as video by Cloudinary
    } else if (isImage) {
      folder = 'chatflow_images';
      resource_type = 'image';
    } else {
      folder = 'chatflow_docs';
      resource_type = 'raw'; // PDF, docx, zip etc. must use 'raw' resource type
    }

    // Stream upload directly to Cloudinary using memory buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        public_id: path.parse(req.file.originalname).name + '_' + Date.now(),
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          return res.status(500).json({ success: false, message: 'Cloudinary upload failed: ' + error.message });
        }

        res.status(200).json({
          success: true,
          url: result.secure_url,
          fileName: req.file.originalname,
          fileSize: req.file.size,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('File Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export default handleFileUpload;
