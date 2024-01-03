import { Router } from "express";
import { auth } from "../middleware/auth";
import { validateAddProject, validateUpdateProject } from "../middleware/validator";
import { getProjects, getProject, addProject, updateProject, deleteProject } from "../controllers/projects";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, getProjects).post(auth, validateAddProject, addProject);
router.route("/:id").get(auth, getProject).patch(auth, validateUpdateProject, updateProject).delete(auth, deleteProject);

export default router;
