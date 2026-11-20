/**
 * Description: Recibe un arreglo de roles permitidos (ej. ['CLIENTE'] o [UserRole.CLIENT]) y bloquee el paso 
 * con un 403 forbidden antes de llegar al controlador si req.user.role no esta en la lista
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';
import { Container } from '../../container.js';

export const roleGuard = (allowedRoles: UserRole[] | string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            Container.logger.warn('Intento de acceso a recurso protegido sin usuario autenticado', {
                context: 'AUTH:ROLE_GUARD',
                action: 'UNAUTHORIZED_NO_USER',
                statusCode: 401,
                path: req.originalUrl || req.url,
                method: req.method,
            });
            res.status(401).json({
                success: false,
                statusCode: 401,
                error: 'NoAutorizado',
                message: 'Usuario no autenticado'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            Container.logger.warn('Intento de acceso con rol no autorizado', {
                context: 'AUTH:ROLE_GUARD',
                action: 'FORBIDDEN_ROLE',
                statusCode: 403,
                userId: req.user.sub,
                userRole: req.user.role,
                allowedRoles: allowedRoles as string[],
                path: req.originalUrl || req.url,
                method: req.method,
            });
            res.status(403).json({
                success: false,
                statusCode: 403,
                error: 'AccesoDenegado',
                message: 'Acción no permitida'
            });
            return;
        }

        next();
    }
};