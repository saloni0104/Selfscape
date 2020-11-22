const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const Interest = require("../models/interestModel");
const checkAuth = require("../middleware/check-auth");

router.post("/", checkAuth, (req, res, next) => {
  const interest = new Interest({
    _id: new mongoose.Types.ObjectId(),
    interestName: req.body.interestName,
    description: req.body.description,
    category: req.body.category,
    user: req.userData.userId,
  });
  interest
    .save()
    .then((result) => {
      return res.status(201).json({
        message: "Interest added successfully",
        interest: {
          _id: result._id,
          interestName: result.interestName,
          description: result.description,
          category: result.category,
          user: result.user,
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Failed Adding Interest",
        error: err,
      });
    });
});

router.get("/", checkAuth, (req, res, next) => {
  Interest.find({ user: req.userData.userId })
    .exec()
    .then((result) => {
      return res.status(200).json({
        message: "Found interests",
        interest: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Failed to find interests",
        error: err,
      });
    });
});

router.get("/checkStatus", checkAuth, (req, res, next) => {
  Interest.find({ user: req.userData.userId })
    .exec()
    .then((result) => {
      var hasLeisure = result.some(
        (interest) => interest.category == "Leisure"
      );
      var hasProductive = result.some(
        (interest) => interest.category == "Productive"
      );
      var hasLearning = result.some(
        (interest) => interest.category == "Learning"
      );
      if (hasLeisure && hasProductive && hasLearning) {
        return res.status(200).json({
          message: "User has added all required interests",
        });
      } else {
        console.log(hasLeisure);
        console.log(hasProductive);
        console.log(hasLearning);
        return res.status(400).json({
          message: "Some required interests are missing",
          hasLeisure: hasLeisure,
          hasLearning: hasLearning,
          hasProductive: hasProductive,
        });
      }
    });
});

router.get("/filter", checkAuth, (req, res, next) => {
  const id = req.query.interestId;
  const category = req.query.category;
  if (id != undefined) {
    Interest.findById(id)
      .exec()
      .then((interest) => {
        res.status(200).json({
          message: "Fond Interest",
          interest: interest,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  } else {
    Interest.find({
      user: req.userData.userId,
      category: category,
    })
      .exec()
      .then((result) => {
        return res.status(200).json({
          message: "Found interests",
          interest: result,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: "Failed to find interests",
          error: err,
        });
      });
  }
});

router.delete("/:interestId", checkAuth, (req, res, next) => {
  Interest.remove({ _id: req.params.interestId, user: req.userData.userId })
    .exec()
    .then((result) => {
      res.status(200).json({ message: "Interest Deleted" });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Interest deletion failed",
        error: err,
      });
    });
});

router.patch("/:interestId", checkAuth, (req, res, next) => {
  const id = req.params.interestId;
  const updateFields = {};
  for (const field of req.body.newInterestFields) {
    if (field.key != "interestName") updateFields[field.key] = field.value;
  }
  console.log(updateFields);
  Interest.update(
    { _id: id, user: req.userData.userId },
    { $set: updateFields }
  )
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Interest updated",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: "Interest update failed",
        error: err,
      });
    });
});

router.get("/bot", checkAuth, (req, res, next) => {
  const message = req.query.message.toLowerCase().replace("+", " ");
  var category,
    respMessage = null;
  if (
    message.includes("sad") ||
    message.includes("gloomy") ||
    message.includes("1")
  ) {
    category = "Leisure";
  } else if (
    message.includes("fine") ||
    message.includes("good") ||
    message.includes("neutral") ||
    message.includes("2")
  ) {
    category = "Productive";
  } else if (
    message.includes("happy") ||
    message.includes("excited") ||
    message.includes("3")
  ) {
    category = "Learning";
  } else if (message.includes("hello") || message.includes("hi")) {
    respMessage =
      "Hello " +
      req.userData.username +
      "! How is your mood today ? <br/> 1. Sad / Gloomy <br/> 2. Fine / Neutral <br/> 3. Happy / Excited";
  } else if (message.includes("your name") && message.includes("?")) {
    respMessage =
      "Hello I am selfscape! How is your mood today ? <br/> 1. Sad / Gloomy <br/> 2. Fine / Neutral <br/> 3. Happy / Excited";
  } else if (message.includes("made you") && message.includes("?")) {
    respMessage = "Manorama, Riddhi and Saloni made me";
  } else if (
    (message.includes("do you do") ||
      message.includes("you are") ||
      message.includes("are you")) &&
    message.includes("?")
  ) {
    respMessage =
      "I am an interactive assistant to help you find suitable activity that you can do today :)";
  } else if (message.includes("thank")) {
    respMessage = "You are welcome! I am happy to help you :P";
  } else if (
    message.includes("don't want") ||
    message.includes("not do") ||
    message.includes("no")
  ) {
    respMessage =
      "Oh! No problem :) <br/> I will be happy to suggest you some other activity <br/> What is your mood ? <br/> 1. Sad / Gloomy <br/> 2. Fine / Neutral <br/> 3. Happy / Excited";
  } else {
    respMessage = "Sorry! I did not get you :(";
  }
  if (respMessage != null) {
    return res.status(200).json({
      message: respMessage,
    });
  } else {
    Interest.find({
      user: req.userData.userId,
      category: category,
    })
      .exec()
      .then((result) => {
        var index = Math.floor(Math.random() * result.length);
        var activityName = result[index].interestName;
        respMessage =
          "Hey " +
          req.userData.username +
          ", why don't you try " +
          activityName +
          " today :)";
        return res.status(200).json({
          message: respMessage,
        });
      });
  }
});

module.exports = router;
