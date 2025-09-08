import { Outlet, Navigate } from "react-router-dom"

const ProtectedRoutes = ({ isAuthenticated }) => {
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />
}

export default ProtectedRoutes
