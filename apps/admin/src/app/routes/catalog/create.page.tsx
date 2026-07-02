import { useNavigate, useLocation } from "react-router";
import { Link } from "@otbt/web";

import type { EditableProduct } from "@otbt/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@otbt/ui";

import { ProductForm, useCreateProduct } from "../../../modules/products";

const defaultProductValues: EditableProduct = {
  name: "",
  sku: "",
  description: "",
  membershipDiscountEnabled: false,
  price: 0,
  stock: 0,
  status: "draft",
  visibility: "hidden",
};


const setProductValues = (product: EditableProduct): EditableProduct => {
  const productFields = { ...product };
  productFields.name = `${product.name} (Copy)`;
  productFields.sku = `${product.sku}-2`;
  productFields.status = "draft";
  productFields.visibility = "hidden";
  productFields.membershipDiscountEnabled =
    product.membershipDiscountEnabled ?? false;
  return productFields;
};

export function CatalogueCreatePage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  async function saveProduct(productDraft: EditableProduct) {
    await createProduct.mutateAsync(productDraft);
    navigate("/");
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  to="/"
                >
                  Catalog
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Add product</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Add Product
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Create a new catalogue product with pricing, stock, and publishing controls.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/" unstyled>
              Cancel
            </Link>
          </Button>
          <Button
            disabled={createProduct.isPending}
            form="product-create-form"
            type="submit"
          >
            {createProduct.isPending ? "Saving..." : "Create Product"}
          </Button>
        </div>
      </div>

      <ProductForm
        defaultValues={setProductValues(useLocation().state?.product || defaultProductValues)}
        error={createProduct.error}
        formId="product-create-form"
        onSubmit={saveProduct}
        submitting={createProduct.isPending}
        submitLabel="Create Product"
      />
    </section>
  );
}
