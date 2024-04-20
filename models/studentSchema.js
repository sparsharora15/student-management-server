const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    dob: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
      ref: "Course",
    },
    profilePicturePublicId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student"],
      default: "student",
    },
    address: { type: String, required: true },
    fullName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    email: { type: String, required: true },
    fName: { type: String, required: true },
    phoneNo: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, autoIndex: false }
);

const User = mongoose.model("Student", userSchema);

module.exports = User;
