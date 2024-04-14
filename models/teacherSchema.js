const mongoose = require("mongoose");
const TeacherSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    employeeID: {
      type: String,
      required: true,
      unique: true
    },
    phoneNo: {
      type: String,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    teachingDepartment: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Course",
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    isDelete: {
      default: false,
      type: Boolean,
    },
    profilePicturePublicId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['teacher'], // Define allowed roles
      default: 'teacher' // Set default role
    }
  },
  { timestamps: true, autoIndex: false }
);
const teacherModel = mongoose.model("Teachers", TeacherSchema);
module.exports = teacherModel;