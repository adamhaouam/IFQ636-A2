import {
  ORDER_NUMBER_FORMATS,
  type OrderNumberFormat,
  PRODUCT_BROWSING_MODES,
  type ProductBrowsingMode,
  type StoreSettingsSnapshot,
  type StoreSettingsUpdate,
} from "@otbt/types";

import {
  SettingsRecordModel,
  STORE_SETTINGS_KEY,
  type SettingsRecordDocument,
} from "./settings-record.model.js";

const DEFAULT_SETTINGS = {
  orderNumberFormat: "sequential",
  productBrowsingMode: "infinite",
  productBrowsingPageSize: 24,
} as const;

function serializeSettings(record: SettingsRecordDocument): StoreSettingsSnapshot {
  return {
    createdAt: record.createdAt.toISOString(),
    orderNumberFormat: record.orderNumberFormat,
    productBrowsingMode: record.productBrowsingMode,
    productBrowsingPageSize: record.productBrowsingPageSize,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function assertOrderNumberFormat(value: unknown): asserts value is OrderNumberFormat {
  if (!ORDER_NUMBER_FORMATS.includes(value as OrderNumberFormat)) {
    throw new Error("Invalid order number format");
  }
}

function assertProductBrowsingMode(
  value: unknown,
): asserts value is ProductBrowsingMode {
  if (!PRODUCT_BROWSING_MODES.includes(value as ProductBrowsingMode)) {
    throw new Error("Invalid product browsing mode");
  }
}

function normalizeSettingsUpdate(input: StoreSettingsUpdate): StoreSettingsUpdate {
  const update: StoreSettingsUpdate = {};

  if (input.orderNumberFormat !== undefined) {
    assertOrderNumberFormat(input.orderNumberFormat);
    update.orderNumberFormat = input.orderNumberFormat;
  }

  if (input.productBrowsingMode !== undefined) {
    assertProductBrowsingMode(input.productBrowsingMode);
    update.productBrowsingMode = input.productBrowsingMode;
  }

  if (input.productBrowsingPageSize !== undefined) {
    if (
      !Number.isInteger(input.productBrowsingPageSize) ||
      input.productBrowsingPageSize < 1 ||
      input.productBrowsingPageSize > 100
    ) {
      throw new Error("Product browsing page size must be between 1 and 100");
    }

    update.productBrowsingPageSize = input.productBrowsingPageSize;
  }

  return update;
}

async function ensureSettingsRecordDefaults(record: SettingsRecordDocument) {
  const update: Partial<
    Pick<SettingsRecordDocument, "productBrowsingMode" | "productBrowsingPageSize">
  > = {};

  if (!record.productBrowsingMode) {
    update.productBrowsingMode = DEFAULT_SETTINGS.productBrowsingMode;
  }

  if (!Number.isInteger(record.productBrowsingPageSize)) {
    update.productBrowsingPageSize = DEFAULT_SETTINGS.productBrowsingPageSize;
  }

  if (Object.keys(update).length === 0) {
    return record;
  }

  const updatedRecord = await SettingsRecordModel.findOneAndUpdate(
    { key: STORE_SETTINGS_KEY },
    { $set: update },
    { new: true, runValidators: true },
  ).exec();

  if (!updatedRecord) {
    throw new Error("Store settings record could not be updated");
  }

  return updatedRecord;
}

export class StoreSettings {
  private static instance: StoreSettings | null = null;

  private constructor() {}

  static getInstance() {
    StoreSettings.instance ??= new StoreSettings();
    return StoreSettings.instance;
  }

  static resetForTesting() {
    StoreSettings.instance = null;
  }

  private async getOrCreateRecord() {
    const record = await SettingsRecordModel.findOneAndUpdate(
      { key: STORE_SETTINGS_KEY },
      { $setOnInsert: { key: STORE_SETTINGS_KEY, ...DEFAULT_SETTINGS } },
      { new: true, runValidators: true, upsert: true },
    ).exec();

    return ensureSettingsRecordDefaults(record);
  }

  async getSettings() {
    return serializeSettings(await this.getOrCreateRecord());
  }

  async getOrderNumberFormat() {
    const settings = await this.getSettings();
    return settings.orderNumberFormat;
  }

  async updateSettings(input: StoreSettingsUpdate) {
    const update = normalizeSettingsUpdate(input);

    if (Object.keys(update).length === 0) {
      return this.getSettings();
    }

    await this.getOrCreateRecord();

    const record = await SettingsRecordModel.findOneAndUpdate(
      { key: STORE_SETTINGS_KEY },
      { $set: update },
      { new: true, runValidators: true },
    ).exec();

    if (!record) {
      throw new Error("Store settings record could not be updated");
    }

    return serializeSettings(record);
  }
}
