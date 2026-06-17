import { dispatchServerEvent, type ServerEvent } from "./events";

export interface ServerEventClientOptions {
  channel: string;
  url?: string;
  onError?: (error: Event) => void;
}

export interface ServerEventClient {
  connect(): void;
  disconnect(): void;
}

const DEFAULT_URL = "/api/server-events";

function withChannel(url: string, channel: string) {
  const target = new URL(url, window.location.origin);
  target.searchParams.set("channel", channel);
  return `${target.pathname}${target.search}`;
}

export function createServerEventClient({
  channel,
  onError,
  url = DEFAULT_URL,
}: ServerEventClientOptions): ServerEventClient {
  let source: EventSource | null = null;

  return {
    connect() {
      if (source) {
        return;
      }

      source = new EventSource(withChannel(url, channel));
      source.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as ServerEvent;
          dispatchServerEvent(event);
        } catch {
          return;
        }
      };
      source.onerror = (error) => {
        onError?.(error);
      };
    },
    disconnect() {
      source?.close();
      source = null;
    },
  };
}
