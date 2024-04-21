const mongoose = require("mongoose");
const Lectures = mongoose.Schema({
  lectureNumber: {
    type: Number,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
});
const LectureSchema = mongoose.Schema(
  {
    lectures: [Lectures],
    recessTime: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, autoIndex: false }
);

const LectureModel = mongoose.model("Lecture", LectureSchema);

module.exports = LectureModel;
