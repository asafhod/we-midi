import { Router } from "express";
import auth from "../middleware/auth";
import { checkAdminMiddleware } from "../middleware/checkAdmin";
import { getProjectUsers, getProjectUser, acceptProjectUser, deleteProjectUserHttp } from "../controllers/projectUsers";

// initialize router
const router = Router();

// routes
router.route("/").get(auth, checkAdminMiddleware, getProjectUsers);
router
  .route("/:projectID/:username")
  .get(auth, checkAdminMiddleware, getProjectUser)
  .patch(auth, acceptProjectUser)
  .delete(auth, deleteProjectUserHttp);

export default router;
