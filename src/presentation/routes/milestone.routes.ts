import { Router } from 'express';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { Container } from '../../container.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

export const milestoneRouter = Router();

// Middleware Multer para entregables técnicos (soporta ZIP, PDF, imágenes, documentos hasta 25MB)
const deliveryStorage = multer.memoryStorage();
const deliveryUpload = multer({
    storage: deliveryStorage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
    fileFilter: (_req: Request, _file: Express.Multer.File, cb: FileFilterCallback) => {
        cb(null, true); // Permite archivos de entregables
    },
});

/**
 * @ruta POST /api/v1/milestones/:id/deliveries
 * @descripcion Recepción de entregables con notas técnicas, enlaces y hash criptográfico SHA-256 (HU-06)
 */
milestoneRouter.post(
    '/:id/deliveries',
    Container.authMiddleware,
    roleGuard([UserRole.FREELANCER]),
    deliveryUpload.single('file'),
    Container.milestoneController.submitDelivery
);

/**
 * @ruta POST /api/v1/milestones/:id/approve
 * @descripcion Aprobación de entregable y liberación atómica de fondos desde custodia Escrow (HU-07)
 * @acceso Protegido (Rol CLIENT)
 */
milestoneRouter.post(
    '/:id/approve',
    Container.authMiddleware,
    roleGuard([UserRole.CLIENT]),
    Container.milestoneController.approve
);

/**
 * @ruta POST /api/v1/milestones/:id/corrections
 * @descripcion Solicita correcciones técnicas sobre el hito y regresa el estado a Por Hacer / En Progreso
 * @acceso Protegido (Rol CLIENT)
 */
milestoneRouter.post(
    '/:id/corrections',
    Container.authMiddleware,
    roleGuard([UserRole.CLIENT]),
    Container.milestoneController.requestCorrections
);
