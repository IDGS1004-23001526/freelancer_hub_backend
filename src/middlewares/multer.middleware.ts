import multer from 'multer';

/**
 * Middleware de Multer para parsear las peticiones 'multipart/form-data'.
 * Utilizamos 'memoryStorage' porque no queremos que Multer guarde el archivo directamente.
 * Queremos mantenerlo en memoria RAM temporalmente para pasárselo a nuestro Caso de Uso
 * y que este decida (a través de IStorageService) dónde y cómo guardarlo definitivamente.
 */

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite estricto de 5MB por seguridad
  fileFilter: (req, file, cb) => {
    // Filtro de seguridad: Solo se aceptan tipos MIME específicos de imagen
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Solo JPG y PNG.'));
    }
  }
});