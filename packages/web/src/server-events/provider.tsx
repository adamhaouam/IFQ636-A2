import { useMemo, type ReactNode } from "react";

import {
  createServerEventClient,
  type ServerEventClientOptions,
} from "./client";
import { useServerEventConnection } from "./hooks/use-server-event-connection";

export interface ServerEventsProviderProps extends ServerEventClientOptions {
  children?: ReactNode;
}

export function ServerEventsProvider({
  children,
  channel,
  onError,
  url,
}: ServerEventsProviderProps) {
  const client = useMemo(
    () => createServerEventClient({ channel, onError, url }),
    [channel, onError, url],
  );

  useServerEventConnection(client);

  return <>{children}</>;
}
