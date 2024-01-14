import { Router } from "express";
import auth from "../middleware/auth";
import { checkAdmin } from "../middleware/checkAdmin";
import { getUsers, getUser, updateUser, deleteUser } from "../controllers/users";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, checkAdmin, getUsers);
router.route("/:username").get(auth, checkAdmin, getUser).patch(auth, checkAdmin, updateUser).delete(auth, checkAdmin, deleteUser);

export default router;
