import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors";
import cognitoTokenVerifier from "../utilities/cognitoTokenVerifier";

// user authentication middleware
const auth = async (req: Request, _res: Response, next: NextFunction) => {
  // get authorization header
  const authHeader: string | undefined = req.headers.authorization;

  // validate authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authorization header is missing or invalid");
  }

  // get Cognito token from authorization header
  const token: string = authHeader.split(" ")[1];

  try {
    // verify and decode Cognito token
    const payload = await cognitoTokenVerifier.verify(token);

    // set user's username obtained from Cognito token on request body
    req.username = payload.username;

    // call next middleware
    next();
  } catch (error) {
    throw new UnauthorizedError("Authentication token is invalid or expired");
  }
};

export default auth;
