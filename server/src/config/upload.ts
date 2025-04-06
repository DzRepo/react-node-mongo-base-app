import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

// Get the absolute path to the uploads directory
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
console.log('Upload configuration - directory path:', uploadDir);
console.log('Upload configuration - directory exists:', fs.existsSync(uploadDir));
if (fs.existsSync(uploadDir)) {
  console.log('Upload configuration - directory contents:', fs.readdirSync(uploadDir));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    console.log('Upload destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  console.log('File being uploaded:', file.originalname, 'MIME type:', file.mimetype);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log('Invalid file type:', file.mimetype);
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
}); 