import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// protected route component props
interface ProtectedRouteProps {
  redirectPath?: string;
}

// protected route component
const ProtectedRoute = ({ redirectPath = '/login' }: ProtectedRouteProps) => {
  // get auth context
  const { isAuthenticated, isLoading } = useAuth();
  
  // if loading, show a simple loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // if not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // render children
  return <Outlet />;
};

export default ProtectedRoute; 