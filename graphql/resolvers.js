const userModel = require('../models/user');
const bcrypt = require('bcryptjs');
module.exports = {
  createUser: function async({userInput}, req) {
   // const email = args.userInput.email;
   const existingUser = await userModel.findOne({email: userInput.email});
   if(existingUser) {
   const error = new Error('User already exists');
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
  return {...createdUser._doc, _id:createdUser._id.toString()}

  }
}

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
