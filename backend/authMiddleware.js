require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization; // expects: "Bearer <token>"

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Confirm this user still actually exists in the database.
        // Without this check, a stale token (from a deleted/recreated account)
        // would pass verification but crash every route downstream.
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Account no longer exists. Please log in again.' });
        }

        req.user = { userId: user._id, isAdmin: user.isAdmin }; // fresh from DB, not stale token data
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function verifyAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
}

module.exports = { verifyToken, verifyAdmin };