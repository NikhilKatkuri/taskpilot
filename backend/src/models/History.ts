import { Document, Schema, model, Types } from "mongoose";

/*
--------------------------------
Message Interface
--------------------------------
*/

export interface IMessage {
  messageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface IHistory extends Document {
  userUid: string;
  chatId: string;
  chatTitle?: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    messageId: {
      type: String,
      required: true,
      default: () => new Types.ObjectId().toString(),
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const HistorySchema = new Schema<IHistory>(
  {
    userUid: { type: String, required: true, index: true },
    chatId: {
      type: String,
      required: true,
      default: () => new Types.ObjectId().toString(),
      index: true,
    },
    chatTitle: { type: String },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

HistorySchema.index({ userUid: 1, chatId: 1 }, { unique: true });

export const HistoryModel = model<IHistory>("History", HistorySchema);
