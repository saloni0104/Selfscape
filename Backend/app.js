const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

const userRoutes = require("./api/routes/userRoutes");
const interestRoutes = require("./api/routes/interestRoutes");
const diaryRoutes = require("./api/routes/diaryRoutes");

mongoose.connect(
  "mongodb+srv://RiddhiGupta5:" +
    process.env.MONGO_ATLAS_PASSWORD +
    "@selfscapecluster.oeoxz.mongodb.net/selfscapeDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Reuested-With, Content-Type, Accept, Authorization"
  );
  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use("/user", userRoutes);
app.use("/interest", interestRoutes);
app.use("/diary", diaryRoutes);

app.get("/ping", (req, res, next) => {
  return res.status(200).json({ message: "OK" });
});

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    message: "Something went Wrong",
    error: error.message,
  });
});

module.exports = app;
