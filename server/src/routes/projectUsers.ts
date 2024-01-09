import { Router } from "express";
import { auth } from "../middleware/auth";
import { validateAddProjectUsers, validateUpdateProjectUsers } from "../middleware/validator";
import {
  getProjectUsers,
  getProjectUser,
  addProjectUsers,
  updateProjectUsers,
  deleteProjectUsers,
  deleteProjectUser,
} from "../controllers/projectUsers";

// initialize router
const router = Router();

// routes
router
  .route("/")
  .get(auth, getProjectUsers)
  .patch(auth, validateUpdateProjectUsers, updateProjectUsers)
  .delete(auth, deleteProjectUsers);
router.route("/batch").post(auth, validateAddProjectUsers, addProjectUsers);
router.route("/:projectID/:username").get(auth, getProjectUser).delete(auth, deleteProjectUser);

export default router;
