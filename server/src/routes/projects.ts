import { Router } from "express";

// import authentication middleware
import auth from "../middleware/auth";

// import validation middleware
import { validateAddProject, validateAddProjects, validateUpdateProject } from "../middleware/validator";

// import Project controllers
import {
  getProjects,
  getProject,
  addProject,
  addProjects,
  updateProject,
  deleteProject,
  deleteProjects,
} from "../controllers/projects";

// initialize router
const router = Router();

// routes
router.route("/").get(getProjects).post(auth, validateAddProject, addProject).delete(auth, deleteProjects);
router.route("/batch").post(auth, validateAddProjects, addProjects);
router.route("/:id").get(getProject).patch(auth, validateUpdateProject, updateProject).delete(auth, deleteProject);

export default router;
