import { Router } from "express";
import auth from "../middleware/auth";
import { getProjectUsers, getProjectUser, acceptProjectUser, deleteProjectUserHttp } from "../controllers/projectUsers";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, getProjectUsers);
router.route("/:projectID/:username").get(auth, getProjectUser).patch(auth, acceptProjectUser).delete(auth, deleteProjectUserHttp);

export default router;
