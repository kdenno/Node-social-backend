const express = require("express");
const routes = express.Router();
const { body } = require("express-validator");
const User = require("../models/user");
const authController = require("../controllers/authController");

routes.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Enter valid Email")
      .normalizeEmail()
      .custom((value, { req }) => {
        User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            // user already exists, reject them
            return Promise.reject("Email already exists");
          }
        });
      }),
    body("password")
      .trim()
      .isLength({ min: 5 }),
    body("name")
      .trim()
      .not()
      .isEmpty()
  ],
  authController.createUser
);
routes.post("/login", authController.login);

module.exports = router;
