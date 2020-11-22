const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();
const User = require("../models/userModel");
const checkAuth = require("../middleware/check-auth");

router.post("/signup", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "User with this email already exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              message: "Something went wrong",
              error: err,
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              username: req.body.username,
              gender: req.body.gender,
              occupation: req.body.occupation,
              dateOfBirth: req.body.dateOfBirth,
            });
            user
              .save()
              .then((result) => {
                res.status(201).json({
                  message: "User successfully created",
                  user: {
                    _id: result._id,
                    email: result.email,
                    username: result.username,
                    gender: result.gender,
                    occupation: result.occupation,
                    dateOfBirth: result.dateOfBirth,
                    created_at: result.created_at,
                  },
                });
              })
              .catch((err) => {
                res.status(500).json({
                  message: "Invalid user details",
                  error: err,
                });
              });
          }
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err,
      });
    });
});

router.post("/login", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Login failed",
        });
      } else {
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Login failed",
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                email: user[0].email,
                userId: user[0]._id,
                username: user[0].username,
              },
              process.env.JWT_KEY,
              {
                expiresIn: "1h",
              }
            );
            return res.status(200).json({
              message: "Login successful",
              token: token,
              user: {
                _id: user[0]._id,
                email: user[0].email,
                username: user[0].username,
                gender: user[0].gender,
                occupation: user[0].occupation,
                dateOfBirth: user[0].dateOfBirth,
                created_at: user[0].created_at,
              },
            });
          }
          return res.status(401).json({
            message: "Login failed",
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.patch("/update", checkAuth, (req, res, next) => {
  const id = req.userData.userId;
  const updateFields = {};
  for (const field of req.body.newUserFields) {
    if (field.key != "email") updateFields[field.key] = field.value;
  }
  console.log(updateFields);
  User.update({ _id: id }, { $set: updateFields })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "User Profile updated",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: "User Profile update failed",
        error: err,
      });
    });
});

module.exports = router;
