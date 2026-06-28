import { queryOptions } from "@tanstack/react-query";

import { fetchStoreSettings } from "./settings.request";

export const storeSettingsQueryKey = ["settings", "store"] as const;

export const storeSettingsQuery = queryOptions({
  queryKey: storeSettingsQueryKey,
  queryFn: fetchStoreSettings,
});
