
// src/components/ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation();
  const role = sessionStorage.getItem('role');
  const token = sessionStorage.getItem('token');

  console.log(`ProtectedRoute check - Role: ${role}, Token: ${token ? 'exists' : 'missing'}`);

  if (!token) {
    console.log("No token found, redirecting to login");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!role || !roles.includes(role.toLowerCase())) {
    console.log(`Role ${role} not authorized for this route`);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;