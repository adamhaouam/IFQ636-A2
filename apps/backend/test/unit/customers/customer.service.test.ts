import { expect } from "chai";
import sinon from "sinon";

import { HttpError } from "../../../src/middleware/error-handler.js";
import { CustomerModel, type CustomerDocument } from "../../../src/modules/customers/customer.model.js";
import {
  getCustomer,
  listCustomers,
  registerCustomer,
  findCustomerByCredentials,
  updateCustomer,
} from "../../../src/modules/customers/customer.service.js";
import { hashCustomerPassword } from "../../../src/modules/customers/customer.passwords.js";

type CustomerRecord = CustomerDocument & { _id: { toString(): string } };

function createDocument(overrides: Partial<CustomerRecord> = {}): CustomerRecord {
  return {
    _id: { toString: () => "customer-1" },
    firstName: "Mara",
    lastName: "Vale",
    email: "mara@example.com",
    passwordHash: "irrelevant-hash",
    status: "active",
    accessLevel: "standard",
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
    updatedAt: new Date("2026-06-20T00:00:00.000Z"),
    ...overrides,
  } as CustomerRecord;
}

function fakeQuery<T>(result: T) {
  return {
    exec: () => Promise.resolve(result),
    sort: () => fakeQuery(result),
  };
}

describe("customer.service", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("registerCustomer (create)", () => {
    it("creates a customer with a normalized email and hashed password", async () => {
      sinon.stub(CustomerModel, "findOne").returns(fakeQuery(null) as never);
      const createStub = sinon
        .stub(CustomerModel, "create")
        .resolves(createDocument({ email: "new@example.com" }) as never);

      const customer = await registerCustomer({
        firstName: "  Mara  ",
        lastName: "  Vale  ",
        email: "  NEW@Example.com  ",
        password: "correct-horse-battery-staple",
      });

      expect(customer.id).to.equal("customer-1");
      expect(createStub.calledOnce).to.equal(true);

      const createInput = createStub.firstCall.args[0] as {
        firstName: string;
        lastName: string;
        email: string;
        passwordHash: string;
      };

      expect(createInput.firstName).to.equal("Mara");
      expect(createInput.lastName).to.equal("Vale");
      expect(createInput.email).to.equal("new@example.com");
      expect(createInput.passwordHash).to.not.equal("correct-horse-battery-staple");
      expect(createInput.passwordHash).to.match(/^\$2[aby]\$/);
    });

    it("rejects registration when the email is already taken", async () => {
      sinon.stub(CustomerModel, "findOne").returns(fakeQuery(createDocument()) as never);
      const createStub = sinon.stub(CustomerModel, "create");

      try {
        await registerCustomer({
          firstName: "Mara",
          lastName: "Vale",
          email: "mara@example.com",
          password: "correct-horse-battery-staple",
        });
        expect.fail("expected registerCustomer to throw");
      } catch (error) {
        expect(error).to.be.instanceOf(HttpError);
        expect((error as HttpError).message).to.equal(
          "Customer email already registered",
        );
      }

      expect(createStub.called).to.equal(false);
    });
  });

  describe("findCustomerByCredentials (fetch)", () => {
    it("returns the customer when the password matches", async () => {
      const passwordHash = await hashCustomerPassword("correct-horse-battery-staple");
      sinon
        .stub(CustomerModel, "findOne")
        .returns(fakeQuery(createDocument({ passwordHash })) as never);

      const customer = await findCustomerByCredentials(
        "mara@example.com",
        "correct-horse-battery-staple",
      );

      expect(customer).to.not.equal(null);
      expect(customer?.id).to.equal("customer-1");
    });

    it("returns null when the password does not match", async () => {
      const passwordHash = await hashCustomerPassword("correct-horse-battery-staple");
      sinon
        .stub(CustomerModel, "findOne")
        .returns(fakeQuery(createDocument({ passwordHash })) as never);

      const customer = await findCustomerByCredentials("mara@example.com", "wrong-password");

      expect(customer).to.equal(null);
    });

    it("returns null when no customer matches the email", async () => {
      sinon.stub(CustomerModel, "findOne").returns(fakeQuery(null) as never);

      const customer = await findCustomerByCredentials(
        "missing@example.com",
        "correct-horse-battery-staple",
      );

      expect(customer).to.equal(null);
    });
  });

  describe("getCustomer (fetch)", () => {
    it("returns null without querying when the id is not a valid ObjectId", async () => {
      const findByIdStub = sinon.stub(CustomerModel, "findById");

      const customer = await getCustomer("not-a-valid-id");

      expect(customer).to.equal(null);
      expect(findByIdStub.called).to.equal(false);
    });

    it("returns the serialized customer when found", async () => {
      sinon
        .stub(CustomerModel, "findById")
        .returns(fakeQuery(createDocument()) as never);

      const customer = await getCustomer("000000000000000000000000");

      expect(customer).to.deep.equal({
        id: "customer-1",
        firstName: "Mara",
        lastName: "Vale",
        email: "mara@example.com",
        status: "active",
        accessLevel: "standard",
        createdAt: "2026-06-20T00:00:00.000Z",
        updatedAt: "2026-06-20T00:00:00.000Z",
      });
    });

    it("returns null when no customer is found", async () => {
      sinon.stub(CustomerModel, "findById").returns(fakeQuery(null) as never);

      const customer = await getCustomer("000000000000000000000000");

      expect(customer).to.equal(null);
    });
  });

  describe("listCustomers (fetch)", () => {
    it("returns all customers serialized", async () => {
      sinon
        .stub(CustomerModel, "find")
        .returns(fakeQuery([createDocument(), createDocument({ _id: { toString: () => "customer-2" } })]) as never);

      const customers = await listCustomers();

      expect(customers).to.have.length(2);
      expect(customers.map((customer) => customer.id)).to.deep.equal([
        "customer-1",
        "customer-2",
      ]);
    });
  });

  describe("updateCustomer (update)", () => {
    it("returns null without querying when the id is not a valid ObjectId", async () => {
      const updateStub = sinon.stub(CustomerModel, "findByIdAndUpdate");

      const customer = await updateCustomer("not-a-valid-id", { firstName: "New" });

      expect(customer).to.equal(null);
      expect(updateStub.called).to.equal(false);
    });

    it("normalizes and forwards only the provided fields", async () => {
      const updateStub = sinon
        .stub(CustomerModel, "findByIdAndUpdate")
        .returns(fakeQuery(createDocument({ firstName: "Updated", email: "updated@example.com" })) as never);

      const customer = await updateCustomer("000000000000000000000000", {
        firstName: "  Updated  ",
        email: "  UPDATED@Example.com  ",
      });

      expect(customer?.firstName).to.equal("Updated");
      expect(updateStub.calledOnce).to.equal(true);
      expect(updateStub.firstCall.args[1]).to.deep.equal({
        firstName: "Updated",
        email: "updated@example.com",
      });
    });

    it("returns null when the customer is not found", async () => {
      sinon.stub(CustomerModel, "findByIdAndUpdate").returns(fakeQuery(null) as never);

      const customer = await updateCustomer("000000000000000000000000", {
        firstName: "Updated",
      });

      expect(customer).to.equal(null);
    });
  });
});
