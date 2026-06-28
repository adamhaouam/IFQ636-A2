import { NumberSequenceModel } from "./number-sequence.model.js";

export interface NumberSequenceStore {
  nextValue(name: string): Promise<number>;
}

class MongoNumberSequenceStore implements NumberSequenceStore {
  async nextValue(name: string) {
    const sequence = await NumberSequenceModel.findOneAndUpdate(
      { name },
      { $inc: { value: 1 }, $setOnInsert: { name } },
      { new: true, upsert: true },
    ).exec();

    if (!sequence) {
      throw new Error(`Unable to increment number sequence ${name}`);
    }

    return sequence.value;
  }
}

export class NumberSequenceService {
  constructor(
    private readonly store: NumberSequenceStore = new MongoNumberSequenceStore(),
  ) {}

  nextValue(name: string) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error("Number sequence name is required");
    }

    return this.store.nextValue(normalizedName);
  }
}

export const numberSequenceService = new NumberSequenceService();
