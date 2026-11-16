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

async function deposit(req, res) {
  try {
    const result = await userService.deposit(req.user.id, req.body?.amount);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      message: statusCode === 500 ? "Không thể nạp tiền" : error.message,
      error: statusCode === 500 ? "Lỗi nội bộ" : error.message
    });
  }
}

async function withdrawal(req, res) {
  try {
    const result = await userService.withdrawal(req.user.id, req.body?.amount);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      message: statusCode === 500 ? "Không thể rút tiền" : error.message,
      error: statusCode === 500 ? "Lỗi nội bộ" : error.message
    });
  }
}

async function buyStock(req, res) {
  try {
    const result = await userService.buyStock(req.user.id, req.body?.symbol, req.body?.quantity);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;  
    
    return res.status(statusCode).json({
        message: statusCode === 500 ? "Không thể mua cổ phiếu" : error.message,
        error: statusCode === 500 ? "Lỗi nội bộ" : error.message
    });
  }
}

async function sellStock(req, res) {
  try {
    const result = await userService.sellStock(req.user.id, req.body?.symbol, req.body?.quantity);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      message: statusCode === 500 ? "Không thể bán cổ phiếu" : error.message,
      error: statusCode === 500 ? "Lỗi nội bộ" : error.message
    });
  }
}

async function getBalanceHistory(req, res) {
  try {
    const result = await userService.getBalanceHistory(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500; 

    return res.status(statusCode).json({
      message: statusCode === 500 ? "Không thể lấy lịch sử số dư" : error.message,
      error: statusCode === 500 ? "Lỗi nội bộ" : error.message
    });
  } 
}

async function getPortfolio(req, res) {
    try {
        const result = await userService.getPortfolio(req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Không thể lấy danh mục đầu tư" : error.message,
            error: statusCode === 500 ? "Lỗi nội bộ" : error.message
        });
    }
}

async function getAlerts(req, res) {
    try {
        const result = await userService.getUserAlerts(req.user.id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            message: statusCode === 500 ? "Không thể lấy thông báo" : error.message,
            error: statusCode === 500 ? "Lỗi nội bộ" : error.message
        });
    }       

}

async function saveUserAlert(req, res) {
  try {
    const result = await userService.saveUserAlert(req.user.id, req.body);
    return res.status(result.isNew ? 201 : 200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      message: statusCode === 500 ? "Không thể lưu cảnh báo" : error.message,
      error: statusCode === 500 ? "Lỗi nội bộ" : error.message
    });
  }
}

async function deleteUserAlert(req, res) {
  try {
    const result = await userService.deleteUserAlert(req.user.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      message: statusCode === 500 ? "Không thể xóa cảnh báo" : error.message,
      error: statusCode === 500 ? "Lỗi nội bộ" : error.message
    });
  }
}

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    getMe,
    deposit,
    withdrawal,
    buyStock,
    sellStock,
    getBalanceHistory,
    getPortfolio,
    getAlerts,
    saveUserAlert,
    deleteUserAlert
};
