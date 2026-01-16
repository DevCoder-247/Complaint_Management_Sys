import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import CreateComplaint from './pages/CreateCompaint';
import ComplaintDetails from './pages/ComplaintDetails';
import DepartmentDashboard from './pages/DepartmentDashboard';
import OfficerDashboard from './pages/OfficerDashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="create-complaint" element={
                <PrivateRoute allowedRoles={['citizen']}>
                  <CreateComplaint />
                </PrivateRoute>
              } />
              <Route path="complaint/:id" element={
                <PrivateRoute>
                  <ComplaintDetails />
                </PrivateRoute>
              } />
              <Route path="department" element={
                <PrivateRoute allowedRoles={['department']}>
                  <DepartmentDashboard />
                </PrivateRoute>
              } />
              <Route path="l2-dashboard" element={
                <PrivateRoute allowedRoles={['l2_officer']}>
                  <OfficerDashboard level="l2" />
                </PrivateRoute>
              } />
              <Route path="l3-dashboard" element={
                <PrivateRoute allowedRoles={['l3_officer']}>
                  <OfficerDashboard level="l3" />
                </PrivateRoute>
              } />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;