const mongoose = require("mongoose");

const SubjectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, autoIndex: false }
);

const SubjectModel = mongoose.model("Subject", SubjectSchema);

module.exports = SubjectModel;
