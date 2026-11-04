import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';

export const internalTasksRouter = Router();

// Miembros válidos del equipo
export const TEAM_MEMBERS = ['Paulo', 'Diego', 'Karla', 'Christian', 'Axel', 'Uriel'] as const;

/**
 * GET /api/v1/internal/tasks
 * Obtiene todas las tareas del tablero, opcionalmente filtradas por assignee o status
 */
internalTasksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { assignee, status } = req.query;

    const where: any = {};
    if (assignee && typeof assignee === 'string') {
      where.assignee = assignee;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const tasks = await prisma.internalTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      statusCode: 200,
      data: tasks,
      meta: {
        total: tasks.length,
        teamMembers: TEAM_MEMBERS,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al obtener las tareas internas',
    });
  }
});

/**
 * POST /api/v1/internal/tasks
 * Crea y asigna una nueva tarea a un miembro del equipo
 */
internalTasksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, assignee, priority, dueDate, createdBy } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'El título de la tarea es obligatorio.',
      });
      return;
    }

    if (!assignee || typeof assignee !== 'string') {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Debes asignar la tarea a un miembro del equipo.',
      });
      return;
    }

    const task = await prisma.internalTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        assignee: assignee.trim(),
        priority: priority || 'MEDIUM',
        createdBy: createdBy || 'Paulo',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Tarea asignada exitosamente.',
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al crear la tarea interna',
    });
  }
});

/**
 * PATCH /api/v1/internal/tasks/:id
 * Actualiza el estado (Kanban drag-and-drop), asignado o datos de la tarea
 */
internalTasksRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, assignee, priority, title, description } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (assignee) data.assignee = assignee;
    if (priority) data.priority = priority;
    if (title) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;

    const updatedTask = await prisma.internalTask.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      statusCode: 200,
      message: 'Tarea actualizada exitosamente.',
      data: updatedTask,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al actualizar la tarea',
    });
  }
});

/**
 * DELETE /api/v1/internal/tasks/:id
 * Elimina una tarea interna
 */
internalTasksRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await prisma.internalTask.delete({
      where: { id },
    });

    res.json({
      success: true,
      statusCode: 200,
      message: 'Tarea eliminada correctamente.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al eliminar la tarea',
    });
  }
});
