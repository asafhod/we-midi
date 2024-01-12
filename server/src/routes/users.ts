import { Router } from "express";
import { auth } from "../middleware/auth";
import { getUsers, getUser, updateUser, deleteUser } from "../controllers/users";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, getUsers);
router.route("/:username").get(auth, getUser).patch(auth, updateUser).delete(auth, deleteUser);

export default router;
