import { cloneMockState, getMockState } from "./user-data";

export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const MOCK_PASSWORD = "123456";
let mockPassword = MOCK_PASSWORD;

function authError(message) {
  const error = new Error(message);
  error.status = 401;
  return error;
}

export function mockLogin({ email, password }) {
  const state = getMockState();
  if (!email || !password || email !== state.user.email || password !== mockPassword) {
    throw authError("Email hoặc mật khẩu không đúng");
  }

  return {
    user: cloneMockState().user,
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token"
  };
}

export function mockRegister(payload) {
  const state = getMockState();
  if (!payload?.email || !payload?.password || !payload?.userName) {
    throw new Error("Email, mật khẩu và tên người dùng là bắt buộc");
  }

  state.user = {
    ...state.user,
    email: payload.email,
    userName: payload.userName,
    dateOfBirth: payload.dateOfBirth || null
  };
  mockPassword = payload.password;

  return {
    user: cloneMockState().user,
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token"
  };
}

export function mockRefresh(refreshToken) {
  if (refreshToken !== "mock-refresh-token") {
    throw authError("Refresh token không hợp lệ");
  }
  return { accessToken: "mock-access-token" };
}

export function saveTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}
