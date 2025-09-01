// components/AuthRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  const location = useLocation();

  return token ? children : <Navigate to={`/?redirect=${encodeURIComponent(location.pathname + location.search)}`} />;
};

export default AuthRoute;
