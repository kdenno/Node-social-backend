const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const graphQlHttp = require("express-graphql");
const graphQlschema = require("./graphql/schemas");
const graphQlresolver = require("./graphql/resolvers");

// const feedRoutes = require("./routes/feed");
// const authRoutes = require("./routes/auth");

const app = express();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname); // configure how file should be named
  }
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimeType === "image/jpg" ||
    file.mimeType === "image/jpeg" ||
    file.mimeType === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

const MONGODB_URI =
  "mongodb+srv://node-complete:B6ANyfkEveghapdK@cluster0-k1a0c.mongodb.net/messages";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// app.use("/feed", feedRoutes);
// app.use("/auth", authRoutes);
app.use(
  "/graphql",
  graphQlHttp({
    schema: graphQlschema,
    rootValue: graphQlresolver
  })
);
// create middle ware for general error handling
app.use((error, req, res, next) => {
  const statusCode = error.statusCode;
  const message = error.message; // message exists by default on error object
  const data = error.data;
  res.status(statusCode).json({
    message: message,
    data: data
  });
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(8080);
    // const server = app.listen(8080);
   /* const io = require("./socket").init(server);
    io.on("connection", socket => {
      console.log("client connected");
    });*/
  })
  .catch(err => console.log(err));
