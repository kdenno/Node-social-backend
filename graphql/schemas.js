const { buildSchema } = require("graphql");

// build schema and export it
module.exports = buildSchema(`
type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!

}

type User {
    _id: ID!
    name: String!
    email: String!
    password: String
    posts: [Post!]!

}
input userInputData {
    email: String!
    name: String!
    password: String!

}
input PostInputData {
    title: String!
    imageUrl: String!
    content: String!
    
}

type RootMutation {
    createUser(userInput: userInputData): User!
    createPost(postInput: PostInputData):Post!

}
type SuccessfulLoginData {
    token: String!
    userId: String!
}
type RootQuery {
    login(email: String!, password: String!): SuccessfulLoginData!
}

schema {
    query: RootQuery
    mutation: RootMutation

}
`);
/*
module.exports = buildSchema(`
type TestData {
    text: String!
    views: Int!
}

type RootQuery {
    hello: TestData
}
schema {
    query: RootQuery
}

`);
 */
