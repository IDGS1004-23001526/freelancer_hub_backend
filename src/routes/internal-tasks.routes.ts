import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/persistence/prisma/prisma.client.js';
import { Container } from '../container.js';

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

    Container.logger.info('Tablero de tareas internas consultado', {
      context: 'INTERNAL_TASKS',
      action: 'LIST_TASKS',
      statusCode: 200,
      resultCount: tasks.length,
      filterAssignee: assignee,
      filterStatus: status,
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
    Container.logger.error('Error al obtener tareas internas', error, {
      context: 'INTERNAL_TASKS',
      action: 'LIST_TASKS_ERROR',
      statusCode: 500,
    });
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
      Container.logger.warn('Intento de crear tarea interna sin título', {
        context: 'INTERNAL_TASKS',
        action: 'CREATE_TASK_NO_TITLE',
        statusCode: 400,
      });
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'El título de la tarea es obligatorio.',
      });
      return;
    }

    if (!assignee || typeof assignee !== 'string') {
      Container.logger.warn('Intento de crear tarea interna sin asignado', {
        context: 'INTERNAL_TASKS',
        action: 'CREATE_TASK_NO_ASSIGNEE',
        statusCode: 400,
      });
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

    Container.logger.info('Nueva tarea interna creada y asignada', {
      context: 'INTERNAL_TASKS',
      action: 'CREATE_TASK',
      statusCode: 201,
      taskId: task.id,
      assignee: task.assignee,
      priority: task.priority,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Tarea asignada exitosamente.',
      data: task,
    });
  } catch (error: any) {
    Container.logger.error('Error al crear tarea interna', error, {
      context: 'INTERNAL_TASKS',
      action: 'CREATE_TASK_ERROR',
      statusCode: 500,
    });
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

    Container.logger.info('Tarea interna actualizada (estado/Kanban)', {
      context: 'INTERNAL_TASKS',
      action: 'UPDATE_TASK',
      statusCode: 200,
      taskId: id,
      newStatus: status,
      newAssignee: assignee,
    });

    res.json({
      success: true,
      statusCode: 200,
      message: 'Tarea actualizada exitosamente.',
      data: updatedTask,
    });
  } catch (error: any) {
    Container.logger.error('Error al actualizar tarea interna', error, {
      context: 'INTERNAL_TASKS',
      action: 'UPDATE_TASK_ERROR',
      statusCode: 500,
      taskId: req.params.id,
    });
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

    Container.logger.info('Tarea interna eliminada', {
      context: 'INTERNAL_TASKS',
      action: 'DELETE_TASK',
      statusCode: 200,
      taskId: id,
    });

    res.json({
      success: true,
      statusCode: 200,
      message: 'Tarea eliminada correctamente.',
    });
  } catch (error: any) {
    Container.logger.error('Error al eliminar tarea interna', error, {
      context: 'INTERNAL_TASKS',
      action: 'DELETE_TASK_ERROR',
      statusCode: 500,
      taskId: req.params.id,
    });
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error al eliminar la tarea',
    });
  }
});
