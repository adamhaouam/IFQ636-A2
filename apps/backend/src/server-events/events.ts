export type ServerEventLevel = "success" | "error" | "warning" | "info";

export interface ServerEventEnvelope {
  id: string;
  channel: string;
  resource: string;
  resourceId?: string;
  action: string;
  message?: string;
  level?: ServerEventLevel;
  timestamp: string;
}

export interface ServerEventInput {
  channel: string;
  resource: string;
  resourceId?: string;
  action: string;
  message?: string;
  level?: ServerEventLevel;
}

export type ServerEvent = ServerEventEnvelope;
