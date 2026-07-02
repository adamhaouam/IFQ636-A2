import { expect } from "chai";
import sinon from "sinon";

import { ProductModel, type ProductDocument } from "../../../src/modules/products/product.model.js";
import {
  clearProductImage,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../../../src/modules/products/product.service.js";

type ProductRecord = ProductDocument & { _id: { toString(): string } };

function createDocument(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    _id: { toString: () => "product-1" },
    name: "Thorn Bouquet",
    sku: "THN-001",
    description: "A bouquet of dark thorns.",
    imageUrl: undefined,
    price: 42,
    stock: 5,
    status: "active",
    visibility: "public",
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
    updatedAt: new Date("2026-06-20T00:00:00.000Z"),
    ...overrides,
  } as ProductRecord;
}

function fakeQuery<T>(result: T) {
  const query = {
    exec: () => Promise.resolve(result),
    lean: () => query,
    sort: () => query,
  };

  return query;
}

describe("product.service", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("createProduct (create)", () => {
    it("creates and serializes a product", async () => {
      const createStub = sinon
        .stub(ProductModel, "create")
        .resolves(createDocument() as never);

      const product = await createProduct({
        name: "Thorn Bouquet",
        sku: "THN-001",
        description: "A bouquet of dark thorns.",
        price: 42,
        stock: 5,
        status: "active",
        visibility: "public",
      });

      expect(product.id).to.equal("product-1");
      expect(product.name).to.equal("Thorn Bouquet");
      expect(createStub.calledOnce).to.equal(true);
    });
  });

  describe("listProducts (fetch)", () => {
    it("lists all products with no filters", async () => {
      const findStub = sinon
        .stub(ProductModel, "find")
        .returns(fakeQuery([createDocument()]) as never);

      const products = await listProducts();

      expect(products).to.have.length(1);
      expect((findStub.firstCall.args as unknown[])[0]).to.deep.equal({});
    });

    it("applies status and visibility filters to the query", async () => {
      const findStub = sinon.stub(ProductModel, "find").returns(fakeQuery([]) as never);

      await listProducts({ status: "active", visibility: "public" });

      expect((findStub.firstCall.args as unknown[])[0]).to.deep.equal({
        status: "active",
        visibility: "public",
      });
    });
  });

  describe("getProduct (fetch)", () => {
    it("returns null without querying when the id is not a valid ObjectId", async () => {
      const findOneStub = sinon.stub(ProductModel, "findOne");

      const product = await getProduct("not-a-valid-id");

      expect(product).to.equal(null);
      expect(findOneStub.called).to.equal(false);
    });

    it("returns the serialized product when found", async () => {
      sinon.stub(ProductModel, "findOne").returns(fakeQuery(createDocument()) as never);

      const product = await getProduct("000000000000000000000000");

      expect(product?.id).to.equal("product-1");
    });

    it("merges status/visibility constraints into the query", async () => {
      const findOneStub = sinon
        .stub(ProductModel, "findOne")
        .returns(fakeQuery(createDocument()) as never);

      await getProduct("000000000000000000000000", { status: "active" });

      expect(findOneStub.firstCall.args[0]).to.deep.equal({
        _id: "000000000000000000000000",
        status: "active",
      });
    });

    it("returns null when no product is found", async () => {
      sinon.stub(ProductModel, "findOne").returns(fakeQuery(null) as never);

      const product = await getProduct("000000000000000000000000");

      expect(product).to.equal(null);
    });
  });

  describe("updateProduct (update)", () => {
    it("returns null without querying when the id is not a valid ObjectId", async () => {
      const updateStub = sinon.stub(ProductModel, "findByIdAndUpdate");

      const product = await updateProduct("not-a-valid-id", { name: "New name" });

      expect(product).to.equal(null);
      expect(updateStub.called).to.equal(false);
    });

    it("forwards the update to findByIdAndUpdate and returns the serialized result", async () => {
      const updateStub = sinon
        .stub(ProductModel, "findByIdAndUpdate")
        .returns(fakeQuery(createDocument({ name: "Updated Bouquet" })) as never);

      const product = await updateProduct("000000000000000000000000", {
        name: "Updated Bouquet",
      });

      expect(product?.name).to.equal("Updated Bouquet");
      expect(updateStub.firstCall.args[0]).to.equal("000000000000000000000000");
      expect(updateStub.firstCall.args[1]).to.deep.equal({ name: "Updated Bouquet" });
    });

    it("returns null when the product is not found", async () => {
      sinon.stub(ProductModel, "findByIdAndUpdate").returns(fakeQuery(null) as never);

      const product = await updateProduct("000000000000000000000000", {
        name: "Updated Bouquet",
      });

      expect(product).to.equal(null);
    });
  });

  describe("clearProductImage (delete)", () => {
    it("returns null without querying when the id is not a valid ObjectId", async () => {
      const updateStub = sinon.stub(ProductModel, "findByIdAndUpdate");

      const product = await clearProductImage("not-a-valid-id");

      expect(product).to.equal(null);
      expect(updateStub.called).to.equal(false);
    });

    it("unsets the imageUrl field", async () => {
      const updateStub = sinon
        .stub(ProductModel, "findByIdAndUpdate")
        .returns(fakeQuery(createDocument({ imageUrl: undefined })) as never);

      const product = await clearProductImage("000000000000000000000000");

      expect(product?.imageUrl).to.equal(undefined);
      expect(updateStub.firstCall.args[1]).to.deep.equal({ $unset: { imageUrl: "" } });
    });

    it("returns null when the product is not found", async () => {
      sinon.stub(ProductModel, "findByIdAndUpdate").returns(fakeQuery(null) as never);

      const product = await clearProductImage("000000000000000000000000");

      expect(product).to.equal(null);
    });
  });
});
