import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './screens/Dashboard';
import TripPage from './screens/TripPage';
import Auth from './screens/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-[#0d2d4d] to-teal">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const router = useMemo(() => createBrowserRouter([
    {
      path: "/auth",
      element: (
        <AuthRoute>
          <Auth />
        </AuthRoute>
      ),
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
      errorElement: <div>Error</div>,
    },
    {
      path: "/trip/:tripId",
      element: (
        <ProtectedRoute>
          <TripPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/share/:shareToken",
      element: <TripPage />,
    },
  ]), []);

  return <RouterProvider router={router} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
