import { useEffect } from "react";

import type { ServerEventClient } from "../client";

export function useServerEventConnection(client: ServerEventClient) {
  useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, [client]);
}
