const jwt = require('jsonwebtoken');

function isAuthenticated(req, res, next) {
    const token = req.cookies.eier;

    if (!token) {
        return res.redirect("/login");
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT Error:", err);
            return res.redirect("/login");
        }
        console.log("Decoded JWT:", decoded);
        req.eier = decoded;
        next();
    });
}

module.exports = { isAuthenticated };