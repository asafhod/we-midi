import { Router } from "express";
import auth from "../middleware/auth";
import { validateAddProject, validateAddProjects, validateUpdateProject } from "../middleware/validator";
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
router.route("/").get(auth, getProjects).post(auth, validateAddProject, addProject);
router.route("/:id").get(auth, getProject).patch(auth, validateUpdateProject, updateProject).delete(auth, deleteProject);
router
  .route("/:id/users")
  .get(auth, getProjectUsers)
  .post(auth, validateAddProjectUser, addProjectUser)
  .patch(auth, validateUpdateProjectUsers, updateProjectUsers)
  .delete(auth, deleteProjectUsers);
router.route("/:id/users/batch").post(auth, validateAddProjectUsers, addProjectUsers);
router
  .route("/:id/users/:username")
  .get(auth, getProjectUser)
  .patch(auth, validateUpdateProjectUser, updateProjectUser)
  .delete(auth, deleteProjectUser);

export default router;
