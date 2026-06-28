import { model, Schema } from "mongoose";

export interface NumberSequenceDocument {
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

const numberSequenceSchema = new Schema<NumberSequenceDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    value: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const NumberSequenceModel = model<NumberSequenceDocument>(
  "NumberSequence",
  numberSequenceSchema,
);
