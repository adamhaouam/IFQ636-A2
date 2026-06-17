import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  onServerEvent,
  type ServerEvent,
  type ServerEventFilter,
} from "../events";

export interface UseServerEventOptions extends ServerEventFilter {
  enabled?: boolean;
  onEvent?: (event: ServerEvent) => void;
}

export function useServerEvent(
  resource: string,
  queryKey?: readonly unknown[],
  options: UseServerEventOptions = {},
) {
  const { action, enabled = true, onEvent } = options;

  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    queryClient = undefined;
  }

  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return onServerEvent(
      resource,
      (event) => {
        if (queryKeyRef.current && queryClient) {
          queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
        }

        onEventRef.current?.(event);
      },
      { action },
    );
  }, [action, enabled, queryClient, resource]);
}
