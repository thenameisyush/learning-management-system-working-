// back-end/middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

export default async function auth(req, res, next) {
  try {
    // token is expected in Authorization header as: "Bearer <token>"
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // payload may contain { id, role, name, email } depending on your auth
    // If you have a User model and want to fetch full user, uncomment below:
    // import User from '../models/User.js';
    // req.user = await User.findById(payload.id).select('-password');
    req.user = payload;

    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Server error in auth middleware' });
  }
}
