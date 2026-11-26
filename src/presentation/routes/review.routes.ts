import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Container } from '../../container.js';
import { validateBody } from '../middlewares/validate-request.middleware.js';
import { prisma } from '../../infrastructure/persistence/prisma/prisma.client.js';
import {
  InvalidTokenException,
  ContractNotFoundException,
  UnauthorizedContractActionException,
} from '../../domain/exceptions/domain.exception.js';

export const reviewRouter = Router();

const createReviewSchema = z.object({
  contractId: z.string().uuid('contractId debe ser un UUID válido'),
  rating: z.number().int().min(1, 'Calificación mínima es 1').max(5, 'Calificación máxima es 5'),
  comment: z.string().trim().min(5, 'El comentario debe tener al menos 5 caracteres').max(2000),
});

/**
 * POST /api/v1/reviews
 * Registra una calificación ciega (HU-13). Se publica automáticamente cuando ambas partes califican.
 */
reviewRouter.post(
  '/',
  Container.authMiddleware,
  validateBody(createReviewSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const claims = req.user;
      if (!claims) throw new InvalidTokenException();

      const { contractId, rating, comment } = req.body;
      const contract = await prisma.contract.findUnique({ where: { id: contractId } });
      if (!contract) throw new ContractNotFoundException(contractId);

      if (contract.clientId !== claims.sub && contract.freelancerId !== claims.sub) {
        throw new UnauthorizedContractActionException('No participas en este contrato.');
      }

      if (contract.status !== 'COMPLETED') {
        res.status(409).json({ success: false, statusCode: 409, message: 'Solo puedes calificar contratos completados.' });
        return;
      }

      const revieweeId = contract.clientId === claims.sub ? contract.freelancerId : contract.clientId;

      const existing = await prisma.review.findUnique({
        where: { unique_contract_reviewer: { contractId, reviewerId: claims.sub } },
      });
      if (existing) {
        res.status(409).json({ success: false, statusCode: 409, message: 'Ya enviaste tu calificación para este contrato.' });
        return;
      }

      const now = new Date();
      const counterpartReview = await prisma.review.findFirst({
        where: { contractId, reviewerId: revieweeId },
      });

      const bothSubmitted = Boolean(counterpartReview);

      const created = await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            id: randomUUID(),
            contractId,
            reviewerId: claims.sub,
            revieweeId,
            rating,
            comment,
            isPublished: bothSubmitted,
            publishedAt: bothSubmitted ? now : null,
          },
        });

        if (counterpartReview && !counterpartReview.isPublished) {
          await tx.review.update({
            where: { id: counterpartReview.id },
            data: { isPublished: true, publishedAt: now },
          });
        }

        return review;
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: bothSubmitted
          ? 'Calificación registrada y publicada (ambas partes completaron su reseña).'
          : 'Calificación ciega registrada. Será visible cuando la otra parte califique.',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/reviews/contract/:contractId
 * Devuelve reseñas publicadas del contrato (o la propia del usuario si aún está oculta).
 */
reviewRouter.get(
  '/contract/:contractId',
  Container.authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const claims = req.user;
      if (!claims) throw new InvalidTokenException();

      const contractId = String(req.params.contractId);
      const reviews = await prisma.review.findMany({
        where: {
          contractId,
          OR: [{ isPublished: true }, { reviewerId: claims.sub }],
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, statusCode: 200, data: reviews });
    } catch (error) {
      next(error);
    }
  }
);
