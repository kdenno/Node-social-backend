const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        const error = new Error("User with this Email was not found");
        error.statusCode = 401;
        throw err;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        const err = new Error("Wrong Password");
        err.statusCode = 401;
        throw err;
      }
      // create user token
      const token = jwt.sign(
        { email: loadedUser.email, userId: loadedUser._id.toString() },
        "supersupersecretkey",
        { expiresIn: "1h" }
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    });
};
