import { toast } from "@otbt/ui";
import { useServerEvent } from "@otbt/web";

import { serverEventTestAction, serverEventTestResource } from "../events";

export function useServerEventTestToast() {
  useServerEvent(serverEventTestResource, undefined, {
    action: serverEventTestAction,
    onEvent: (event) => {
      toast(event.message ?? "Server event test", {
        description: new Date(event.timestamp).toLocaleTimeString(),
      });
    },
  });
}
