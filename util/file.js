const path = require("path");
const fs = require("fs");

exports.clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath); // this file is in the controllers folder, jump out to the root folder with '..'
  fs.unlink(filePath, err => console.log(err));
};
