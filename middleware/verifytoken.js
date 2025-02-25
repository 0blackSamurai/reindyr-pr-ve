const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.eier;
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.eier = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = { verifyToken };