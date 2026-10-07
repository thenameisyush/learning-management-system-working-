// back-end/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { promisify } from "util";

const verifyAsync = promisify(jwt.verify);

/**
 * isLoggedIn
 * Accepts token from either cookies (req.cookies.token) OR Authorization header (Bearer <token>)
 * Verifies JWT and attaches decoded payload to req.user
 */
export const isLoggedIn = async (req, res, next) => {
  try {
    // Try cookie first, then Authorization header
    const cookieToken = req.cookies?.token;
    let headerToken = null;
    const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      headerToken = authHeader.split(" ")[1];
    }

    const token = cookieToken || headerToken;

    // If no token send unauthorized message
    if (!token) {
      return res.status(401).json({ message: "Unauthorized, please login to continue" });
    }

    // Verify token
    let decoded;
    try {
      decoded = await verifyAsync(token, process.env.JWT_SECRET || 'secretkey');
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token. Please login again." });
    }

    // Attach decoded payload to req.user
    req.user = decoded;

    // Continue
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

/**
 * authorizeRoles(...roles)
 * Higher-order middleware to allow only specific roles
 */
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to view this route" });
  }
  next();
};

/**
 * authorizeSubscribers
 * Ensures user is ADMIN or has active subscription
 */
export const authorizeSubscribers = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized, please login to continue" });

  if (req.user.role !== "ADMIN" && req.user.subscription?.status !== "active") {
    return res.status(403).json({ message: "Please subscribe to access this route." });
  }

  next();
};

// Default export for compatibility with imports that use default
export default isLoggedIn;
