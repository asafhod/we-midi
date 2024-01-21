import { Router } from "express";
import auth from "../middleware/auth";
import { checkAdminMiddleware } from "../middleware/checkAdmin";
import { getUsers, getUser, updateUser, deleteUser } from "../controllers/users";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, checkAdminMiddleware, getUsers);
router
  .route("/:username")
  .get(auth, checkAdminMiddleware, getUser)
  .patch(auth, checkAdminMiddleware, updateUser)
  .delete(auth, checkAdminMiddleware, deleteUser);

export default router;
