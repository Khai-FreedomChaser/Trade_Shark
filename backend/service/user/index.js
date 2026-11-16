const datasource = require("../../db/data-source");

function getUserRepository() {
  return datasource.getRepository("User");
}
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { genId } = require("../../utils/id");
const { marketState } = require("../market");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );
}
function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  )
}

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function registerUser(userData) {
  const { userName, email, password, dateOfBirth } = userData || {};

  if (
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || !password ||
    typeof userName !== "string" || !userName.trim()
  ) {
    throw createError("Email, mật khẩu và tên người dùng là bắt buộc", 400);
  }

  const normEmail = email.trim().toLowerCase();
  const normUserName = userName.trim();

  if (normEmail.length > 100 || normUserName.length > 50) {
    throw createError("Email hoặc tên người dùng quá dài", 400);
  }

  const repository = getUserRepository();
  const existingUser = await repository.findOneBy({ email: normEmail });

  if (existingUser) {
    throw createError("Email đã được sử dụng", 409);
  }

  const parsedDate = dateOfBirth ? new Date(dateOfBirth) : null;
  if (parsedDate && Number.isNaN(parsedDate.getTime())) {
    throw createError("Ngày sinh không hợp lệ", 400);
  }

  const user = repository.create({
    id: genId("usr"),
    userName: normUserName,
    email: normEmail,
    password: await bcrypt.hash(password, 12),
    dateOfBirth: parsedDate,
    createdAt: new Date()
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const tokenData = jwt.decode(refreshToken);

  user.refreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

  user.refreshTokenExpiry = new Date(tokenData.exp * 1000);

  const savedUser = await repository.save(user);

  return {
    user: {
      id: savedUser.id,
      userName: savedUser.userName,
      email: savedUser.email,
      balance: Number(savedUser.balance ?? 0)
    },
    accessToken,
    refreshToken
  };
}

async function loginUser(credentials) {
  const { email, password } = credentials || {};

    if (
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || !password
  ) {
    throw createError("Email và mật khẩu là bắt buộc", 400);
  }

  const repository = getUserRepository();
  const user = await repository.findOneBy({
    email: email.trim().toLowerCase()
  });

  if(!user || !(await bcrypt.compare(password, user.password))) {
    throw createError("Email hoặc mật khẩu không đúng", 401);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const tokenData = jwt.decode(refreshToken);

  user.refreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  user.refreshTokenExpiry = new Date(tokenData.exp * 1000);
  user.lastLogin = new Date();

  const savedUser = await repository.save(user);

  return {
    user: {
      id: savedUser.id,
      userName: savedUser.userName,
      email: savedUser.email,
      balance: Number(savedUser.balance ?? 0)
    },
    accessToken,
    refreshToken
  };
}

async function refreshAccessToken(refreshToken) {
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    throw createError("Refresh token là bắt buộc", 400);
  }

  let decoded;

  try{
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  }catch (error) {
    throw createError("Refresh token không hợp lệ", 401);
  }

  if (typeof decoded === "string" ||!decoded.sub ||decoded.type !== "refresh"  ) {
    throw createError("Refresh token không hợp lệ", 401);
  }

  const repository = getUserRepository();
  const user = await repository.findOneBy({ id: decoded.sub });

  if (!user || !user.refreshToken || !user.refreshTokenExpiry) {
    throw createError("Refresh token không hợp lệ", 401);
  }

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  if (
    tokenHash !== user.refreshToken ||
    new Date(user.refreshTokenExpiry).getTime() <= Date.now()
  ) {
    throw createError("Refresh token không hợp lệ hoặc đã hết hạn", 401);
  }

  return {
    accessToken: signAccessToken(user)
  };


}

async function getMe(userId) {
  const repository = getUserRepository();
  const user = await repository.findOneBy({ id: userId });

  if (!user) {
    throw createError("Người dùng không tồn tại", 404);
  }

  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    balance: Number(user.balance ?? 0)
  };
}

async function deposit(userId, amount) {
  if (typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.round(amount * 100) !== amount * 100) {
    throw createError("Số tiền nạp phải là số dương, tối đa 2 chữ số thập phân", 400);
  }

  return datasource.transaction(async (manager) => {
    const userRepository = manager.getRepository("User");
    const historyRepository = manager.getRepository("BalanceHistory");
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      throw createError("Người dùng không tồn tại", 404);
    }

    await userRepository.increment({ id: userId }, "balance", amount);

    await historyRepository.save(
      historyRepository.create({
        id: genId("bh"),
        userId,
        amount,
        type: "deposit",
        createdAt: new Date()
      })
    );

    const updatedUser = await userRepository.findOneBy({ id: userId });

    return {
      balance: Number(updatedUser.balance ?? 0)
    };
  });
}

async function withdrawal(userId, amount) {
  if (typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.round(amount * 100) !== amount * 100) {
    throw createError("Số tiền rút phải là số dương, tối đa 2 chữ số thập phân", 400);
  }

  return datasource.transaction(async (manager) => {
    const userRepository = manager.getRepository("User");
    const historyRepository = manager.getRepository("BalanceHistory");

    const user = await userRepository.findOne({
      where : {id: userId},
      lock: { mode: "pessimistic_write" }
    });

    if (!user) {
      throw createError("Người dùng không tồn tại", 404);
    }

    const balanceCents = Math.round(Number(user.balance) * 100);
    const amountCents = Math.round(amount * 100);

    if (amountCents > balanceCents) {
      throw createError("Số dư không đủ để rút", 400);
    }

    await userRepository.decrement({ id: userId }, "balance", amount); 

    await historyRepository.save(
      historyRepository.create({
        id: genId("bh"),
        userId,
        amount,
        type: "withdrawal",
        createdAt: new Date()
      })
    );

    const updatedUser = await userRepository.findOneBy({ id: userId });

    return {
      balance: Number(updatedUser.balance ?? 0)
    };
  });
}

async function buyStock(userId, symbol, quantity){
  const normSymbol = symbol.trim().toUpperCase();

  if(quantity <= 0 || !Number.isInteger(quantity)){
    throw createError("Số lượng mua phải là số nguyên dương", 400);
  }

  const market = marketState.get(normSymbol);

  if(!market){
    throw createError("Cổ phiếu không tồn tại", 404);
  }

  return datasource.transaction(async (manager) => {
    const userRepository = manager.getRepository("User");
    const stockUserRepository = manager.getRepository("StockUser");

    const user = await userRepository.findOne({ 
      where: { id: userId },
      lock: { mode: "pessimistic_write" }
    });

    if(!user){
      throw createError("Người dùng không tồn tại", 404);
    }

    // if(user.balance <= 0 || user.balance < market.price * quantity){
    //   throw createError("Số dư không đủ để mua cổ phiếu", 400);
    // }

    const position = await stockUserRepository.findOne({
      where: {
        userId,
        stockId: market.stockId
      },
      lock: { mode: "pessimistic_write" }
    });
    
    const priceCents = Math.round(Number(market.price) * 100);
    const totalCostCents = priceCents * quantity;
    const balanceCents = Math.round(Number(user.balance) * 100);

    if (balanceCents < totalCostCents) {
      throw createError("Số dư không đủ để mua cổ phiếu", 400);
    }

    const oldQuantity = position ? Number(position.quantity) : 0;
    const oldAverageCents = position ? Math.round(Number(position.averagePrice) * 100): 0;

    const newQuantity = oldQuantity + quantity;
    const newAverageCents = Math.round((oldQuantity * oldAverageCents + quantity * priceCents) / newQuantity);

    const updatedPosition = position || stockUserRepository.create({
      userId,
      stockId: market.stockId,
      createdAt: new Date()
    });

    updatedPosition.quantity = newQuantity;
    updatedPosition.averagePrice = newAverageCents / 100;
    await stockUserRepository.save(updatedPosition);

    await userRepository.decrement({ id: userId }, "balance", totalCostCents / 100);

    const historyRepository = manager.getRepository("BalanceHistory");

    await historyRepository.save(
      historyRepository.create({
        id: genId("bh"),
        userId,
        stockId: market.stockId,
        amount: -(totalCostCents / 100),
        type: "trade",
        createdAt: new Date()
      })
    );
    return {
      symbol: normSymbol,
      quantity: newQuantity,
      averagePrice: newAverageCents / 100,
      balance: (balanceCents - totalCostCents) / 100
    };
  });
  
}

async function sellStock(userId, symbol, quantity) {
  if (typeof symbol !== "string" || !symbol.trim()) {
    throw createError("Mã cổ phiếu là bắt buộc", 400);
  }

  const normSymbol = symbol.trim().toUpperCase();

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createError("Số lượng bán phải là số nguyên dương", 400);
  }

  const market = marketState.get(normSymbol);

  if (!market) {
    throw createError("Cổ phiếu không tồn tại", 404);
  }

  return datasource.transaction(async (manager) => {
    const userRepository = manager.getRepository("User");
    const stockUserRepository = manager.getRepository("StockUser");
    const historyRepository = manager.getRepository("BalanceHistory");

    const user = await userRepository.findOne({
      where: { id: userId },
      lock: { mode: "pessimistic_write" }
    });

    if (!user) {
      throw createError("Người dùng không tồn tại", 404);
    }

    const position = await stockUserRepository.findOne({
      where: { userId, stockId: market.stockId },
      lock: { mode: "pessimistic_write" }
    });

    if (!position || Number(position.quantity) < quantity) {
      throw createError("Không sở hữu đủ số cổ phiếu để bán", 400);
    }

    const priceCents = Math.round(Number(market.price) * 100);
    const proceedsCents = priceCents * quantity;
    const remainingQuantity = Number(position.quantity) - quantity;

    if (remainingQuantity === 0) {
      await stockUserRepository.delete({ userId, stockId: market.stockId });
    } else {
      position.quantity = remainingQuantity;
      await stockUserRepository.save(position);
    }

    await userRepository.increment(
      { id: userId },
      "balance",
      proceedsCents / 100
    );

    await historyRepository.save(
      historyRepository.create({
        id: genId("bh"),
        userId,
        stockId: market.stockId,
        amount: proceedsCents / 100,
        type: "trade",
        createdAt: new Date()
      })
    );

    const updatedUser = await userRepository.findOneBy({ id: userId });

    return {
      symbol: normSymbol,
      soldQuantity: quantity,
      executionPrice: priceCents / 100,
      remainingQuantity,
      balance: Number(updatedUser.balance)
    };
  });
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  getMe,
  deposit,
  withdrawal,
  buyStock,
  sellStock
};


