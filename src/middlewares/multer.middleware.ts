import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

/**
 * Middleware de Multer para parsear las peticiones 'multipart/form-data'.
 * Utilizamos 'memoryStorage' para procesar el Buffer en memoria RAM
 * y delegar el guardado definitivo al caso de uso (IStorageService).
 */

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Solo JPG, PNG y WEBP.'));
    }
  },
});