import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = localStorage.getItem("lg_user");

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}