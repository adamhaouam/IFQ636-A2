import type { StoreSettingsResponse, StoreSettingsUpdate } from "@otbt/types";

import { adminHttpRequest } from "../../lib/http.client";

export function fetchStoreSettings() {
  return adminHttpRequest<StoreSettingsResponse>("/settings");
}

export function updateStoreSettings(settings: StoreSettingsUpdate) {
  return adminHttpRequest<StoreSettingsResponse>("/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}
