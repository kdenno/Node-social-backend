const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

exports.createUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.name;
  bcrypt
    .hash(password, 12)
    .then(hashedP => {
      User.email = email;
      User.password = hashedP;
      User.name = name;
      return User.save();
    })
    .then(result => {
      res.status(201).json({ message: "User created", UserId: result._id });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    });
};
