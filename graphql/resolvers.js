const userModel = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Post = require("../models/post");
const { clearImage } = require("../util/file");

module.exports = {
  createUser: async function({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Invalid Email" });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password too short" });
    }
    if (errors.length > 0) {
      const error = new Error("Input Invalid");
      error.code = 422;
      error.data = errors;
      throw error;
    }
    // const email = args.userInput.email;
    const existingUser = await userModel.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("User already exists");
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const newUser = new userModel({
      email: userInput.email,
      password: hashedPw,
      name: userInput.name
    });
    const createdUser = await newUser.save();
    // return userObj but id should be a string so we need to override the original id
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function({ email, password }) {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      const error = new Error("Wrong email");
      error.code = 401;
      throw error;
    }
    const isMatching = await bcrypt.compare(password, user.password);
    if (!isMatching) {
      const error = new Error("Incorrect Password");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      "supersupersecretkey",
      { expiresIn: "1h" }
    );
    return { token: token, userId: user._id.toString() };
  },
  createPost: async function({ PostInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    const title = PostInput.title;
    const imageUrl = PostInput.imageUrl;
    const content = PostInput.content;
    // Do some validation

    // find user
    const user = await userModel.findById(req.userId);
    if (!user) {
      const error = new Error("No user found");
      error.code = 401;
      throw error;
    }
    const newPost = new Post({
      title: title,
      imageUrl: imageUrl,
      content: content,
      creator: user
    });
    const createdPost = await newPost.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    };
  },
  updatePost: async function({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate("creator");
    if (!post) {
      throw new Error("No Post found");
    }
    if (req.userId.toString() !== post.creator._id.toString()) {
      throw new Error("Not Authorized");
    }
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },
  deletePost: async function({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }
    // check is he owns the post
    if (post.creator.toString() !== req.userId.toString()) {
      throw new Error("UnAuthorized");
    }
    // delete image
    clearImage(post.imageUrl);
    // delete post
    await Post.findByIdAndRemove(id);
    // remove post from user
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    return true;
  },
  getPost: async function({ Id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(Id).populate("creator");
    if (!post) {
      const error = new Error("Post not found");
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  },
  getPosts: async function({ page }, req) {
    // check if user is authenticated
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");
    return {
      posts: posts.map(p => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        };
      }),
      totalNumber: totalPosts
    };
  },
  user: async function(req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    // get user
    const user = User.findById(req.userId);
    if (!user) {
      throw new Error("User not found");
    }
    return { ...user._doc, _id: user._id.toString() };
  },
  updateStatus: async function({ status }, req) {
    if (!req.isAuth) {
      throw new Error("Not Authorized");
    }
    const user = await User.findById(req.userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.status = status;
    await user.save();
    return { ...user._doc, _id: user._id.toString() };
  }
};

/*
module.exports = {
  // method defined in the query
  hello() {
    return {
      text: "Hello World",
      views: 12345
    };
  }
};
*/
