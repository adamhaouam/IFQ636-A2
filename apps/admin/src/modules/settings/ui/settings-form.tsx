import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  cn,
} from "@otbt/ui";
import type { OrderNumberFormat, ProductBrowsingMode } from "@otbt/types";

export interface SettingsFormValues {
  orderNumberFormat: OrderNumberFormat;
  productBrowsingMode: ProductBrowsingMode;
  productBrowsingPageSize: number;
}

interface SettingsFormProps {
  settings: SettingsFormValues;
  onSettingsChange: (settings: SettingsFormValues) => void;
}

const orderNumberOptions: Array<{
  value: OrderNumberFormat;
  label: string;
  description: string;
  example: string;
}> = [
  {
    value: "sequential",
    label: "Sequential",
    description: "Simple running order numbers.",
    example: "ORD-000123",
  },
  {
    value: "date_prefixed",
    label: "Date prefixed",
    description: "Adds the order date before the number.",
    example: "ORD-20260628-000123",
  },
];

export function SettingsForm({ settings, onSettingsChange }: SettingsFormProps) {
  const selectedExample =
    orderNumberOptions.find((option) => option.value === settings.orderNumberFormat)
      ?.example ??
    "ORD-000123";

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Order numbers</CardTitle>
          <CardDescription>Choose how new orders are numbered.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
          <fieldset className="grid gap-3">
            <legend className="sr-only">Order number format</legend>
            {orderNumberOptions.map((option) => (
              <label
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border bg-background p-4 transition-colors",
                  settings.orderNumberFormat === option.value &&
                    "border-primary bg-muted",
                )}
                key={option.value}
              >
                <input
                  checked={settings.orderNumberFormat === option.value}
                  className="mt-1 size-4 accent-primary"
                  name="orderNumberFormat"
                  onChange={() =>
                    onSettingsChange({
                      ...settings,
                      orderNumberFormat: option.value,
                    })
                  }
                  type="radio"
                  value={option.value}
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {option.description} Example: {option.example}.
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="rounded-md border bg-muted/40 p-5">
            <p className="text-sm text-muted-foreground">Example order number</p>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              {selectedExample}
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              Customers and staff use this reference to identify an order.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Product browsing</CardTitle>
          <CardDescription>
            Choose how customers browse the product catalogue.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-[minmax(0,520px)_120px]">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Browsing mode</span>
            <Select
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  productBrowsingMode: event.target.value as ProductBrowsingMode,
                })
              }
              value={settings.productBrowsingMode}
            >
              <option value="infinite">Infinite scroll</option>
              <option value="paged">Paged</option>
            </Select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Products per page</span>
            <Input
              min={1}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  productBrowsingPageSize: Number(event.target.value),
                })
              }
              type="number"
              value={settings.productBrowsingPageSize}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
