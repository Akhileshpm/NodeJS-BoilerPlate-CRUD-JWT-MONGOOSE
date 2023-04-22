import mongoose, { Schema } from "mongoose";
import validator from "validator";
import { v4 as uuidv4 } from "uuid";

const resourceSchema = new Schema(
  {
    uuid: {
      type: String,
      default: () => uuidv4(),
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    streams: [
      {
        type: Schema.Types.ObjectId, ref: "streams" 
      },
    ],
    employeeId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email address is invalid");
        }
      },
    },
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    projects: [{
        type: Schema.Types.ObjectId,
        ref: "projects",
    }],
    virtualTeam: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      format: "YYYY-MM-DD",
      required: true,
    },
    status: {
      type: String,
      default: 'Active',
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

const resource = mongoose.model("resources", resourceSchema);

export default resource;
