import express from "express";

import {
  register,
  login,
  getCurrentUser,
  listUsers,
  updateUserRole,
} from "../controllers/authController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.get("/users", authenticate, authorize("ADMIN", "MANAGER"), listUsers);
router.patch("/users/:id/role", authenticate, authorize("MANAGER"), updateUserRole);

export default router;
