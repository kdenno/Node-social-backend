const { validationResult } = require("express-validator/check");
const Post = require("../models/post");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
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
  let creator;
  // Create post in db
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
  post
    .save()
    .then(result => {
      // add this post to the user
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        message: "Post created successfully!",
        post: post,
        creator: { name: creator.name, _id: creator._id }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
        next(err);
      }
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw new error();
  }
  const postId = req.params.postId;
  const updatedTitle = req.body.title;
  const updatedContent = req.body.content;
  let imageUrl = req.body.image;
  if (!imageUrl) {
    // new image has been set
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No Image uploaded");
    error.statusCode = 422;
    throw error;
  }
  // get the post
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 500;
        throw error;
      }
      // check if user is authorized to update this
      if (post.creator.toString() !== req.userId) {
        const error = new Error("An Authorized");
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        // image changed, delete old image
        clearImage(post.imageUrl);
      }
      post.title = updatedTitle;
      post.content = updatedContent;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then(result => {
      res.status(200).json({ message: "Updated successfuly", post: result });
    })
    .catch(err => {
      next(err);
    });
};
const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath); // this file is in the controllers folder, jump out to the root folder with '..'
  fs.unlink(filePath, err => console.log(err));
};
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  // find product
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 500;
        throw error;
      }
      // check if user owns the post
      // check if user is authorized to update this
      if (post.creator.toString() !== req.userId) {
        const error = new Error("An Authorized");
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      res.status(201).json({ message: "Post deleted" });
    })
    .catch(err => next(err));
};
