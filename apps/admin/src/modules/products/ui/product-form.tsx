import type { FormEvent } from "react";
import { useRef, useState } from "react";

import { ImageIcon, Trash2 } from "lucide-react";

import type {
  EditableProduct,
  ProductStatus,
  ProductVisibility,
} from "@otbt/types";
import { PRODUCT_STATUSES, PRODUCT_VISIBILITIES } from "@otbt/types";
import { Button, Card, CardContent, Input } from "@otbt/ui";

type ProductDraft = EditableProduct;

type ProductImageControls = {
  onImageRemove: () => Promise<string | undefined>;
  onImageUpload: (file: File) => Promise<string>;
  removingImage: boolean;
  uploadingImage: boolean;
};

interface ProductFormProps {
  defaultValues: EditableProduct;
  error: Error | null;
  formId: string;
  imageControls?: ProductImageControls;
  onSubmit: (product: EditableProduct) => Promise<void>;
  submitting: boolean;
  submitLabel?: string;
}

const statusLabels: Record<ProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

const visibilityLabels: Record<ProductVisibility, string> = {
  public: "Public",
  members_only: "Members only",
  hidden: "Hidden",
};

export function ProductForm({
  defaultValues,
  error,
  formId,
  imageControls,
  onSubmit,
  submitting,
  submitLabel,
}: ProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [draftProduct, setDraftProduct] = useState<ProductDraft>({
    name: defaultValues.name,
    sku: defaultValues.sku,
    description: defaultValues.description,
    imageUrl: defaultValues.imageUrl,
    membershipDiscountEnabled: defaultValues.membershipDiscountEnabled ?? false,
    price: defaultValues.price,
    stock: defaultValues.stock,
    status: defaultValues.status,
    visibility: defaultValues.visibility,
  });

  function updateDraft<ProductField extends keyof ProductDraft>(
    field: ProductField,
    value: ProductDraft[ProductField],
  ) {
    setDraftProduct((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(draftProduct);
  }

  async function uploadSelectedImage(file: File | null) {
    if (!file || !imageControls) {
      return;
    }

    setImageUploadError(null);

    try {
      const imageUrl = await imageControls.onImageUpload(file);
      updateDraft("imageUrl", imageUrl);
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function removeCurrentImage() {
    if (!imageControls) {
      return;
    }

    setImageUploadError(null);

    try {
      const imageUrl = await imageControls.onImageRemove();
      updateDraft("imageUrl", imageUrl);
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Image removal failed");
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form id={formId} onSubmit={submitProduct}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor={`${formId}-name`}
                >
                  Product name
                </label>
                <Input
                  disabled={submitting}
                  id={`${formId}-name`}
                  onChange={(event) => updateDraft("name", event.currentTarget.value)}
                  placeholder="e.g. Ivory Thorn Rose"
                  required
                  value={draftProduct.name}
                />
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor={`${formId}-description`}
                >
                  Description
                </label>
                <textarea
                  className="min-h-96 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting}
                  id={`${formId}-description`}
                  onChange={(event) => updateDraft("description", event.currentTarget.value)}
                  placeholder="Write product detail copy, care notes, and selling context."
                  required
                  value={draftProduct.description}
                />
              </div>

              {imageControls ? (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium leading-none"
                    htmlFor={`${formId}-image`}
                  >
                    Product image
                  </label>
                  <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center">
                    {draftProduct.imageUrl ? (
                      <img
                        alt="Product preview"
                        className="h-56 w-full rounded-md border bg-background object-contain"
                        src={draftProduct.imageUrl}
                      />
                    ) : (
                      <>
                        <div className="flex size-9 items-center justify-center rounded-md border bg-background">
                          <ImageIcon className="size-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">Upload product image</p>
                      </>
                    )}

                    <input
                      accept="image/*"
                      className="hidden"
                      disabled={submitting || imageControls.uploadingImage}
                      id={`${formId}-image`}
                      onChange={(event) =>
                        uploadSelectedImage(event.currentTarget.files?.[0] ?? null)
                      }
                      ref={fileInputRef}
                      type="file"
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        disabled={
                          submitting ||
                          imageControls.uploadingImage ||
                          imageControls.removingImage
                        }
                        onClick={() => fileInputRef.current?.click()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {imageControls.uploadingImage ? "Uploading..." : "Choose file"}
                      </Button>

                      {draftProduct.imageUrl ? (
                        <Button
                          disabled={
                            submitting ||
                            imageControls.uploadingImage ||
                            imageControls.removingImage
                          }
                          onClick={removeCurrentImage}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="size-4" />
                          {imageControls.removingImage ? "Removing..." : "Remove"}
                        </Button>
                      ) : null}
                    </div>

                    {imageUploadError ? (
                      <p className="text-xs text-destructive">{imageUploadError}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor={`${formId}-sku`}
                >
                  SKU
                </label>
                <Input
                  disabled={submitting}
                  id={`${formId}-sku`}
                  onChange={(event) => updateDraft("sku", event.currentTarget.value)}
                  placeholder="e.g. ITR-001"
                  required
                  value={draftProduct.sku}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium leading-none"
                    htmlFor={`${formId}-price`}
                  >
                    Price
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      className="pl-6"
                      disabled={submitting}
                      id={`${formId}-price`}
                      min="0"
                      onChange={(event) =>
                        updateDraft("price", Number(event.currentTarget.value))
                      }
                      placeholder="0.00"
                      required
                      step="0.01"
                      type="number"
                      value={draftProduct.price}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium leading-none"
                    htmlFor={`${formId}-stock`}
                  >
                    Stock
                  </label>
                  <Input
                    disabled={submitting}
                    id={`${formId}-stock`}
                    min="0"
                    onChange={(event) =>
                      updateDraft("stock", Number(event.currentTarget.value))
                    }
                    placeholder="0"
                    required
                    type="number"
                    value={draftProduct.stock}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor={`${formId}-status`}
                >
                  Status
                </label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting}
                  id={`${formId}-status`}
                  onChange={(event) =>
                    updateDraft("status", event.currentTarget.value as ProductStatus)
                  }
                  value={draftProduct.status}
                >
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor={`${formId}-visibility`}
                >
                  Visibility
                </label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting}
                  id={`${formId}-visibility`}
                  onChange={(event) =>
                    updateDraft("visibility", event.currentTarget.value as ProductVisibility)
                  }
                  value={draftProduct.visibility}
                >
                  {PRODUCT_VISIBILITIES.map((visibility) => (
                    <option key={visibility} value={visibility}>
                      {visibilityLabels[visibility]}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex gap-3 rounded-md border bg-background p-4">
                <input
                  checked={draftProduct.membershipDiscountEnabled}
                  className="mt-0.5 size-4 accent-primary"
                  disabled={submitting}
                  onChange={(event) =>
                    updateDraft(
                      "membershipDiscountEnabled",
                      event.currentTarget.checked,
                    )
                  }
                  type="checkbox"
                />
                <span className="grid gap-1">
                  <span className="text-sm font-medium leading-none text-foreground">
                    Apply member discount
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Members receive the store membership discount for this product.
                  </span>
                </span>
              </label>

              <Button className="hidden" disabled={submitting} type="submit">
                {submitLabel ?? "Save Changes"}
              </Button>
            </div>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-destructive">{error.message}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
