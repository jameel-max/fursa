import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    return cb(null, true);
  },
});

export function uploadImages(field = 'images') {
  return uploadSingle.array(field, 5);
}
