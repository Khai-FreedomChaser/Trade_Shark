const JWT = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const [scheme, token] = authHeader ? authHeader.split(" ") : [];

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Cần đăng nhập",
            error: "Thiếu Bearer access token"
        });
    }

    try{
        const decoded = JWT.verify(token, process.env.JWT_ACCESS_SECRET);
        if(typeof decoded === "string" ||!decoded.sub || decoded.type === "refresh"){
            return res.status(401).json({
                message: "Access token không hợp lệ",
                error: "ACcess token không hợp lệ"
            });
        }
        req.user = { id: decoded.sub };
        return next();
    }catch(error){
        return res.status(401).json({
            message: "Access token không hợp lệ hoặc đã hết hạn",
            error: "Access token không hợp lệ hoặc đã hết hạn"
        });
    }
}
module.exports = { 
    authMiddleware 
};