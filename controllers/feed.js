const { validationResult } = require("express-validator/check");
const Post = require("../models/post");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const io = require("../socket");
exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 });
    res.status().json({ message: "Success", posts: posts });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      next(err);
    }
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 500;
      throw error; // this will work though we are in a promise because throwing an error in the then block automatically shifts it to the catch block so next() will grab it automatically
    }
    res.status(200).json({ message: "Success", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      next(err);
    }
  }
};

exports.createPost = async (req, res, next) => {
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
    creator: req.userId
  });
  try {
    await post.save();
    // add this post to the user
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    // trigger update to all connected clients
    io.getIo().emit("posts", {
      action: "create",
      post: { ...post.doc, creator: { _id: req.userId, name: user.name } }
    });
    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: { name: user.name, _id: user._id }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      next(err);
    }
  }
};

exports.updatePost = async (req, res, next) => {
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
  try {
    const post = Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 500;
      throw error;
    }
    // check if user is authorized to update this
    if (post.creator._id.toString() !== req.userId) {
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
    const result = await post.save();
    // trigger update
    io.emit("update", { action: "update", post: result });
    res.status(200).json({ message: "Updated successfuly", post: result });
  } catch (err) {
    next(err);
  }
};
const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath); // this file is in the controllers folder, jump out to the root folder with '..'
  fs.unlink(filePath, err => console.log(err));
};
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  // find product
  try {
    const post = await Post.findById(postId);
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
    await Post.findByIdAndRemove(postId);

    // create relation
    const userdata = await User.findById(req.userId);
    // remove post id
    userdata.posts.pull(postId);
    await userdata.save();
    res.status(201).json({ message: "Post deleted" });
  } catch (err) {
    next(err);
  }
};
