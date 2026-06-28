import { useEffect, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@otbt/ui";

import type { SettingsFormValues } from "../../../modules/settings";
import {
  SettingsForm,
  useStoreSettings,
  useUpdateStoreSettings,
} from "../../../modules/settings";

export function SettingsPage() {
  const settings = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const [draft, setDraft] = useState<SettingsFormValues>(() => ({
    orderNumberFormat: settings.orderNumberFormat,
    productBrowsingMode: settings.productBrowsingMode,
    productBrowsingPageSize: settings.productBrowsingPageSize,
  }));
  const [savingVisible, setSavingVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      orderNumberFormat: settings.orderNumberFormat,
      productBrowsingMode: settings.productBrowsingMode,
      productBrowsingPageSize: settings.productBrowsingPageSize,
    });
  }, [
    settings.orderNumberFormat,
    settings.productBrowsingMode,
    settings.productBrowsingPageSize,
  ]);

  async function saveDraft() {
    setSavingVisible(true);
    setSaveError(null);

    try {
      const [response] = await Promise.all([
        updateSettings.mutateAsync(draft),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);

      setDraft({
        orderNumberFormat: response.settings.orderNumberFormat,
        productBrowsingMode: response.settings.productBrowsingMode,
        productBrowsingPageSize: response.settings.productBrowsingPageSize,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Settings could not be saved");
    } finally {
      setSavingVisible(false);
    }
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Storefront</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Configure order references and customer product browsing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            disabled={savingVisible}
            onClick={() => void saveDraft()}
            type="button"
          >
            {savingVisible ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </div>

      {saveError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      ) : null}

      <SettingsForm settings={draft} onSettingsChange={setDraft} />
    </section>
  );
}
