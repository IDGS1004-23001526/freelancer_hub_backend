export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogMetadata {
  context?: string;
  action?: string;
  statusCode?: number;
  userId?: string;
  conversationId?: string;
  contractId?: string;
  projectId?: string;
  durationMs?: number;
  error?: string | Error;
  stack?: string;
  [key: string]: unknown;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  action?: string;
  statusCode?: number;
  userId?: string;
  durationMs?: number;
  error?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export interface ILogger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, errorOrMeta?: Error | LogMetadata, meta?: LogMetadata): void;
}
