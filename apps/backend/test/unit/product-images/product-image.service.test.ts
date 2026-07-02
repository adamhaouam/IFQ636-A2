import { readFile, rm, stat } from "node:fs/promises";
import { expect } from "chai";

import {
  deleteProductImage,
  storeProductImage,
} from "../../../src/modules/product-images/product-image.service.js";

async function fileExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("product-image.service", () => {
  const createdPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(createdPaths.map((path) => rm(path, { force: true })));
    createdPaths.length = 0;
  });

  describe("storeProductImage (create)", () => {
    it("writes the file to disk and returns its public url", async () => {
      const stored = await storeProductImage({
        buffer: Buffer.from("fake-image-bytes"),
        originalName: "thorn.png",
      });
      createdPaths.push(stored.path);

      expect(stored.imageUrl).to.match(/^\/uploads\/products\/[^/]+\.png$/);
      expect(stored.filename).to.match(/\.png$/);
      expect(await fileExists(stored.path)).to.equal(true);
      expect((await readFile(stored.path)).toString()).to.equal("fake-image-bytes");
    });

    it("falls back to a .bin extension for unrecognized file types", async () => {
      const stored = await storeProductImage({
        buffer: Buffer.from("fake-bytes"),
        originalName: "thorn.exe",
      });
      createdPaths.push(stored.path);

      expect(stored.filename).to.match(/\.bin$/);
      expect(stored.imageUrl).to.match(/\.bin$/);
    });

    it("generates a unique filename per call", async () => {
      const first = await storeProductImage({
        buffer: Buffer.from("a"),
        originalName: "thorn.png",
      });
      const second = await storeProductImage({
        buffer: Buffer.from("b"),
        originalName: "thorn.png",
      });
      createdPaths.push(first.path, second.path);

      expect(first.filename).to.not.equal(second.filename);
    });
  });

  describe("deleteProductImage (delete)", () => {
    it("removes a previously stored image", async () => {
      const stored = await storeProductImage({
        buffer: Buffer.from("fake-image-bytes"),
        originalName: "thorn.png",
      });
      createdPaths.push(stored.path);

      expect(await fileExists(stored.path)).to.equal(true);

      await deleteProductImage(stored.imageUrl);

      expect(await fileExists(stored.path)).to.equal(false);
    });

    it("does nothing for an image url outside the product images path", async () => {
      await deleteProductImage("/uploads/other/thorn.png");
    });

    it("does not throw for an image that no longer exists", async () => {
      await deleteProductImage("/uploads/products/already-gone.png");
    });
  });
});
