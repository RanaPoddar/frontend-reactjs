
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import HomeDashboard from './pages/dashboard/HomeDashboard';
import CreateShiftPage from './pages/dashboard/CreateShiftPage';
import ActiveShiftsPage from './pages/dashboard/ActiveShiftsPage';
import CompletedShiftsPage from './pages/dashboard/CompletedShiftsPage';
import ShiftDetailsPage from './pages/dashboard/ShiftDetailsPage';
import EditShiftPage from './pages/dashboard/EditShiftPage';
import AlertsPage from './pages/dashboard/AlertsPage';
import UserManagementPage from './pages/dashboard/UserManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import useAuthStore from './stores/useAuthStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <ToastContainer />
      
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
        />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <HomeDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Create Shift - Requires Edit Permission (Admin or SuperAdmin only) */}
        <Route 
          path="/dashboard/create-shift" 
          element={
            <ProtectedRoute requireEdit={true}>
              <CreateShiftPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Active Shifts - All authenticated users can view */}
        <Route 
          path="/dashboard/active-shifts" 
          element={
            <ProtectedRoute>
              <ActiveShiftsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Alerts Page - All authenticated users can view */}
        <Route 
          path="/dashboard/alerts" 
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Completed Shifts - All authenticated users can view */}
        <Route 
          path="/dashboard/completed-shifts" 
          element={
            <ProtectedRoute>
              <CompletedShiftsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Shift Details - All authenticated users can view */}
        <Route 
          path="/dashboard/shifts/:id" 
          element={
            <ProtectedRoute>
              <ShiftDetailsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Edit Shift - Requires Edit Permission (Admin or SuperAdmin only) */}
        <Route 
          path="/dashboard/shifts/:id/edit" 
          element={
            <ProtectedRoute requireEdit={true}>
              <EditShiftPage />
            </ProtectedRoute>
          } 
        />
        
        {/* User Management - SUPER_ADMIN only */}
        <Route 
          path="/dashboard/user-management" 
          element={
            <ErrorBoundary>
              <ProtectedRoute requireSuperAdmin={true}>
                <UserManagementPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } 
        />
        
        {/* Default Route */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
