// TODO: Determine what routes are necessary and what needs validation, then implement

import { Router } from "express";

// import authentication and admin verification middleware
import auth from "../middleware/auth";
import checkAdmin from "../middleware/checkAdmin";

// import validation middleware
import { validateLoginReg } from "../middleware/validator";

// import User controllers
import { login, getUsers, getUser, registerUser, deleteUser } from "../controllers/users";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, checkAdmin, getUsers).post(auth, checkAdmin, validateLoginReg, registerUser);
router.route("/login").post(validateLoginReg, login);
router.route("/:username").get(auth, checkAdmin, getUser).delete(auth, checkAdmin, deleteUser);

export default router;
