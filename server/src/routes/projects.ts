import { Router } from "express";
import { auth } from "../middleware/auth";
import { getProjects, addProject, deleteProjectHttp } from "../controllers/projects";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, getProjects).post(auth, addProject);
router.route("/:id").delete(auth, deleteProjectHttp);

export default router;
