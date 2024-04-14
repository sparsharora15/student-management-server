
const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema({
  semesterName: { type: String, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], // Reference to Subject schema
});

const schema = new mongoose.Schema({
  totalSem: { type: String, required: true },
  fullName: { type: String, required: true },
  courseYear: { type: String, required: true },
  semesters: { type: [semesterSchema], required: true },
});

const Course = mongoose.model("Course", schema);

module.exports = Course;
