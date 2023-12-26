import { CognitoJwtVerifier } from "aws-jwt-verify";

// retrieve AWS credentials from environment variables
const { AWS_USER_POOL_ID, AWS_CLIENT_ID } = process.env;

// validate AWS credentials
if (!AWS_USER_POOL_ID || !AWS_CLIENT_ID) {
  console.error("Environment variables AWS_USER_POOL_ID and AWS_CLIENT_ID are required.");
  process.exit(1);
}

// create Cognito JWT verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: AWS_USER_POOL_ID,
  tokenUse: "access",
  clientId: AWS_CLIENT_ID,
});

export default verifier;
