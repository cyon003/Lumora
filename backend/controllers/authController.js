import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../database/prisma.js";
import { ROLES } from "../middleware/authMiddleware.js";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userCount === 0 ? "ADMIN" : "WAITER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to register user",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const normalizedRole = user.role === "STAFF" ? "ADMIN" : user.role;
    if (normalizedRole !== user.role) {
      await prisma.user.update({ where: { id: user.id }, data: { role: normalizedRole } });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: normalizedRole,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in",
    });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, branchId: true, createdAt: true }, orderBy: { name: "asc" } });
    return res.json({ users: users.map((user) => ({ ...user, role: user.role === "STAFF" ? "ADMIN" : user.role })) });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "Unable to retrieve users" });
  }
}

export async function updateUserRole(req, res) {
  try {
    const role = String(req.body.role || "").toUpperCase();
    if (!ROLES.includes(role) || role === "ADMIN") return res.status(400).json({ message: "Managers may assign MANAGER, HEAD_LADY, KITCHEN, or WAITER roles" });
    const target = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "ADMIN") return res.status(403).json({ message: "The restaurant owner role cannot be changed" });
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { role }, select: { id: true, name: true, email: true, role: true } });
    return res.json({ user });
  } catch (error) {
    console.error("Update role error:", error);
    return res.status(500).json({ message: "Unable to update user role" });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Unable to retrieve user",
    });
  }
}
