import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

/**
 * Route guard component to protect private user pages.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, initialized } = useAuthStore();

  // If the store has not finished checking user profile on boot, show loading state
  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Custom loading spinner */}
          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium tracking-wide">Syncing session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes
  return <Outlet />;
};

export default ProtectedRoute;
