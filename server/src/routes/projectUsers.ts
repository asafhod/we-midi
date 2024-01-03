import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  validateAddProjectUsers,
  validateAddProjectUser,
  validateUpdateProjectUsers,
  validateUpdateProjectUser,
} from "../middleware/validator";
import {
  getProjectUsers,
  getProjectUser,
  addProjectUsers,
  addProjectUser,
  updateProjectUsers,
  updateProjectUser,
  deleteProjectUsers,
  deleteProjectUser,
} from "../controllers/projectUsers";

// initialize router
const router = Router();

// routes
router
  .route("/")
  .get(auth, getProjectUsers)
  .post(auth, validateAddProjectUser, addProjectUser)
  .patch(auth, validateUpdateProjectUsers, updateProjectUsers)
  .delete(auth, deleteProjectUsers);
router.route("/batch").post(auth, validateAddProjectUsers, addProjectUsers);
router
  .route("/:projectID/:username")
  .get(auth, getProjectUser)
  .patch(auth, validateUpdateProjectUser, updateProjectUser)
  .delete(auth, deleteProjectUser);

export default router;
