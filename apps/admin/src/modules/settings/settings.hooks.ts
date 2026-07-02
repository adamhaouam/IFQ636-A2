import { useMutation, useQuery } from "@tanstack/react-query";

import type { StoreSettingsUpdate } from "@otbt/types";

import { queryClient } from "../../lib/query-client";
import { storeSettingsQuery, storeSettingsQueryKey } from "./settings.query";
import { updateStoreSettings } from "./settings.request";

export function useStoreSettings() {
  const { data } = useQuery(storeSettingsQuery);

  if (!data) {
    throw new Error("Store settings were not loaded");
  }

  return data.settings;
}

export function useUpdateStoreSettings() {
  return useMutation({
    mutationFn: (settings: StoreSettingsUpdate) => updateStoreSettings(settings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
    },
  });
}
