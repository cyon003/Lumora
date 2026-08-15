import jwt from "jsonwebtoken";

export const ROLES = ["ADMIN", "MANAGER", "HEAD_LADY", "BAR", "KITCHEN", "WAITER"];

export function authenticate(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Invalid authorization format",
    });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role === "STAFF" ? "ADMIN" : req.user?.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    req.user.role = role;
    next();
  };
}
