/**
 * Description: Recibe un arreglo de roles permitidos (ej. ['CLIENTE'] o [UserRole.CLIENT]) y bloquee el paso 
 * con un 403 forbidden antes de llegar al controlador si req.user.role no esta en la lista
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../domain/value-objects/user-role.enum.js';

export const roleGuard = (allowedRoles: UserRole[] | string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                error: 'NoAutorizado',
                message: 'Usuario no autenticado'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
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