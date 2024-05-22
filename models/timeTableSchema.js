const mongoose = require("mongoose");

const lectures = mongoose.schema({
  lectureNumber: {
    type: string,
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teachers",
  },
  venue: {
    type: String,
    required: true,
  },
});
const TimeTableSchema = mongoose.schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  sem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  lecture: {
    type: [lectures],
    required: true,
  },
});

const TimeTableModel = mongoose.model("TimeTables", TimeTableSchema);
module.exports = TimeTableModel;
