// TODO: Implement. Should validation functions and/or error handling be in a middleware pattern? Or just call a validation function per case and have error handler function in the catch?

const router = (message: string, username: string, projectID: string) => {
  console.log(`Received message from user ${username} for project ID ${projectID}: ${message}`);

  // TODO: Is using this try-catch the best way?
  try {
    switch (message) {
      case "blerg":
        console.log("derp");
        break;
      default:
        console.log("zerp");
        break;
    }
  } catch (error) {
    console.error(error); // placeholder
  }
};

export default router;
