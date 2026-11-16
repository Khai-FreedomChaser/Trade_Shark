import { Navigate, useLocation } from "react-router-dom";
import { userService } from "../../services/userService";

export default function AuthGuard({ children }) {
  const location = useLocation();

  if (!userService.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
