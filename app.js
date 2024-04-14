const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const morgan = require('morgan');
const port = process.env.PORT || 4000;
app.use(express.json());
app.use(cors());
const { connect } = require("./config/db");
connect();
const adminRoutes = require("./routes/adminRoutes");
// const chatRoutes = require("./routes/teacherRoutes");
app.use('/api/admin',adminRoutes)
app.use(morgan('dev'));
app.listen(port, () => {
  console.log(`server is running at ${port}`);
});
