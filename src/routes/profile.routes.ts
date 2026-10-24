import { Router } from 'express';
import { uploadMiddleware } from '../../infrastructure/middlewares/multer.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Middleware global para esta ruta: Asegura que todas las peticiones tengan un JWT válido.
// Inyecta el 'userId' en el objeto de la petición (req.user) para ser usado en los controladores.
router.use(authMiddleware);

// Endpoint para leer la información del perfil del usuario logueado
router.get('/me/profile', profileController.getProfile);

// Endpoint para crear (si no existe) o actualizar la información de texto del perfil
router.put('/me/profile', profileController.updateProfile);

// Endpoint dedicado exclusivamente a la actualización del avatar.
// Utiliza 'uploadMiddleware.single("avatar")' para interceptar y extraer el archivo antes de llegar al controlador.
router.post('/me/avatar', uploadMiddleware.single('avatar'), profileController.uploadAvatar);

export default router;