const mongoose = require('mongoose')

const lectures = mongoose.schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
    },
    TimeTable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TimeTables",
    },
    venue: {
        type: String,
        ref: "TimeTables",
    },
})
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
        type:[lectures],
        required: true,
    },
})


const TimeTableModel = mongoose.model("TimeTables", TimeTableSchema);
module.exports = TimeTableModel;