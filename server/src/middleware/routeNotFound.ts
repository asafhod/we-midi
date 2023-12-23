// import NotFound error
import { NotFoundError } from "../errors";

// catch-all route middleware used when route is not found
const routeNotFound = () => {
  throw new NotFoundError("Resource not found");
};

export default routeNotFound;
