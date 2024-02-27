import { MongoClient } from "mongodb";

// get environment variables
const { MONGODB_URI, DATABASE_NAME } = process.env;

// validate environment variables
if (!MONGODB_URI || !DATABASE_NAME) {
  const errorMessage = "Environment variables MONGODB_URI and DATABASE_NAME are required";

  console.error(errorMessage);
  throw new Error(errorMessage);
}

// define MongoDB client
const client = new MongoClient(MONGODB_URI);

// lambda function handler
export const handler = async (event) => {
  try {
    // get newly registered username from Cognito post-confirmation event
    const username = event.userName;

    // validate that username exists
    if (!username) throw new Error("Username on Cognito post-confirmation event is undefined");

    // get database instance from MongoDB client using database name environment variable
    const db = client.db(DATABASE_NAME);

    // get reference to Users collection from the database instance
    const usersCollection = db.collection("users");

    // insert new user into Users collection
    await usersCollection.insertOne({ username: username.toLowerCase(), isAdmin: false });

    // return the Cognito post-confirmation event
    return event;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
