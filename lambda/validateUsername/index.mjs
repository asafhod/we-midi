// lambda function handler
export const handler = async (event, context, callback) => {
  try {
    // define maximum username length
    const MAX_USERNAME_LENGTH = 25;

    // define forbidden characters RegEx
    const FORBIDDEN_CHARACTERS = /[ '"`\/\\,\.!?;:\t\n\r\f\v]/;

    // get username of the user attempting to register from the Cognito pre-signup event
    const username = event.userName;

    // validate that username exists
    if (!username) throw new Error("Username is required");

    // validate that username does not exceed maximum length
    if (username.length > MAX_USERNAME_LENGTH) throw new Error(`Username cannot exceed ${MAX_USERNAME_LENGTH} characters`);

    // validate username does not contain forbidden characters
    if (FORBIDDEN_CHARACTERS.test(username)) throw new Error(`Username contains forbidden characters`);

    // return the pre-signup event to Cognito
    callback(null, event);
  } catch (error) {
    console.error(error);

    // return the error to Cognito
    callback(error, event);
  }
};
