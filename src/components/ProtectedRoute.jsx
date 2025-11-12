// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, userType }) {
  const storedUserType = localStorage.getItem('userType');
  
  if (!storedUserType) {
    return <Navigate to="/" />;
  }
  
  if (storedUserType !== userType) {
    return <Navigate to="/" />;
  }
  
  return children;
}


