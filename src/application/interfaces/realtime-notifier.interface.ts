/**
 * Eventos en tiempo real soportados por el módulo de contratos y chat (HU-11).
 */
export const CONTRACT_SOCKET_EVENTS = {
  NEW_MESSAGE: 'new_message',
  NEW_MESSAGE_NOTIFICATION: 'new_message_notification',
  MILESTONE_SUBMITTED: 'milestone_submitted',
  MILESTONE_APPROVED: 'milestone_approved',
  CONTRACT_STATUS_CHANGED: 'contract_status_changed',
} as const;

export interface NewMessageEventPayload {
  id: string;
  contractId: string;
  conversationId?: string;
  senderId: string;
  senderRole?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface MilestoneEventPayload {
  contractId: string;
  milestoneId: string;
  title?: string;
  status: string;
  actorId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ContractStatusChangedEventPayload {
  contractId: string;
  previousStatus?: string;
  newStatus: string;
  actorId: string;
  timestamp: string;
  reason?: string;
}

/**
 * Función de autorización para verificar si un usuario puede suscribirse a la sala de un contrato.
 */
export type ContractAccessValidator = (
  userId: string,
  contractId: string,
  role: string
) => Promise<boolean>;

/**
 * Puerto de salida (Output Port) para emitir notificaciones y mensajes en tiempo real
 * sin acoplar la capa de Aplicación a Socket.io.
 */
export interface IRealtimeNotifier {
  emitNewMessage(contractId: string, payload: NewMessageEventPayload): void;
  emitMilestoneSubmitted(contractId: string, payload: MilestoneEventPayload): void;
  emitMilestoneApproved(contractId: string, payload: MilestoneEventPayload): void;
  emitContractStatusChanged(contractId: string, payload: ContractStatusChangedEventPayload): void;
}
