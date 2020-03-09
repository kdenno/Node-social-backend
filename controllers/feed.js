const { validationResult } = require("express-validator/check");
const Post = require("../models/post");
exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      res.status().json({ message: "Success", posts: posts });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById()
    .then(post => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 500;
        throw error; // this will work though we are in a promise because throwing an error in the then block automatically shifts it to the catch block so next() will grab it automatically
      }
      res.status(200).json({ message: "Success", post: post });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!req.file) {
    const error = new Error("No image uploaded");
    error.statusCode = 422;
    throw new error();
  }
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw new error();
  }
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path;
  // Create post in db
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: { name: "Deno" }
  });
  post
    .save()
    .then(result => {
      res.status(201).json({
        message: "Post created successfully!",
        post: result
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    });
};
