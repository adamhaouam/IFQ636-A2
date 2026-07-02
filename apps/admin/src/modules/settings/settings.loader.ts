import { redirect } from "react-router";

import { queryClient } from "../../lib/query-client";
import { getAdminToken } from "../auth/auth.storage";
import { storeSettingsQuery } from "./settings.query";

export async function settingsLoader() {
  if (!getAdminToken()) {
    throw redirect("/login");
  }

  return queryClient.ensureQueryData(storeSettingsQuery);
}
