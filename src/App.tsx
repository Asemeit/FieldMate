import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import { resolveUserRole } from './config/admin';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import DetectPage from './pages/DetectPage';
import ResultsPage from './pages/ResultsPage';
import WeatherPage from './pages/WeatherPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import SupportPage from './pages/SupportPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// Protected Route wrapper to simulate farmer authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();

  let sessionUser = user;
  if (!sessionUser) {
    try {
      const raw = sessionStorage.getItem('fieldmate_active_user');
      if (raw) sessionUser = JSON.parse(raw);
    } catch {
      sessionUser = null;
    }
  }
  
  if (!sessionUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();

  let sessionUser = user;
  if (!sessionUser) {
    try {
      const raw = sessionStorage.getItem('fieldmate_active_user');
      if (raw) sessionUser = JSON.parse(raw);
    } catch {
      sessionUser = null;
    }
  }

  if (!sessionUser) {
    return <Navigate to="/login" replace />;
  }

  if ((sessionUser.role ?? resolveUserRole(sessionUser.email)) !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <Layout>
      <Routes>
        {/* Public Landing & Security Portals */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* Farmer Dashboard & Core Features (Protected) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/detect" 
          element={
            <ProtectedRoute>
              <DetectPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/results/:id" 
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/weather" 
          element={
            <ProtectedRoute>
              <WeatherPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <ErrorBoundary label="settings">
                <SettingsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <ErrorBoundary label="admin">
                <AdminPage />
              </ErrorBoundary>
            </AdminRoute>
          }
        />
        
        {/* Catch-all fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}

export default App;
