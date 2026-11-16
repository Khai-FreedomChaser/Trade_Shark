const userService = require("../../service/user");

// TODO: Viết handler cho auth + giao dịch ~ BE2
// register / login / refresh / me / deposit / withdraw / buy / sell
// / portfolio / balance-history / alerts 

async function registerUser(req, res) {
    try{
        const result = await userService.registerUser(req.body);
        return res.status(201).json(result);
    }catch(error){
        const statusCode = error.statusCode || 500;
        
        return res.status(statusCode).json({
            message: statusCode === 500 ? "Không thể đăng ký" : error.message,
            error: error.message
        }); 
    }

}

async function loginUser(req, res) {
    try{
        const result = await userService.loginUser(req.body);
        return res.status(200).json(result);
    }catch(error){
        const statusCode = error.statusCode || 500;
        
        return res.status(statusCode).json({
            message: statusCode === 500 ? "Không thể đăng nhập" : error.message,
            error: statusCode === 500  ? "Lỗi nội bộ": error.message 
        });
    }
}

async function refreshAccessToken(req, res) {
    try{
        const { refreshToken } = req.body;
        const result = await userService.refreshAccessToken(refreshToken);

        return res.status(200).json(result);
    }catch(error){
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Không thể làm mới access token" : error.message,
            error: statusCode === 500 ? "Lỗi nội bộ" : error.message
        });
    }
}

async function getMe(req, res) {
    try{
        const userId = req.user.id;
        const result = await userService.getMe(userId);

        return res.status(200).json(result);
    }catch(error){
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Không thể lấy thông tin người dùng" : error.message,
            error: statusCode === 500 ? "Lỗi nội bộ" : error.message
        });

    }

}
module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    getMe
};
