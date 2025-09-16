// src/auth/auth.guard.js
import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { auth } from "../firebase/firebase"
import { onAuthStateChanged } from "firebase/auth"

const ProtectedRoutes = ({ isAuthenticated, setIsAuthenticated }) => {
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
    })

    return () => unsubscribe()
  }, [setIsAuthenticated])

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />
}

export default ProtectedRoutes
