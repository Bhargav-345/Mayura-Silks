const jwt = require('jsonwebtoken');

const JWT_SECRET = 'replace_this_with_a_long_random_string_later'; // must match the secret in server.js

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization; // expects: "Bearer <token>"

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
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