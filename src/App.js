import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import authUtils from './utils/authUtils';
import Profile from './pages/Profile';
import Test from './pages/test';
import Users from './pages/UserManagement';
import NVLManagement from './pages/Nvl';
import TPManagement from './pages/Tp';
import ReportManagement from './pages/BaoCao';
import ReportMobile from './pages/BaoCaoMobie';
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!authUtils.isAuthenticated()) {
    // Lưu lại đường dẫn hiện tại trước khi chuyển hướng
    localStorage.setItem('returnUrl', location.pathname + location.search);
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    // Không cần basename vì đã có domain
    <BrowserRouter>
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/test" element={<Test />} />
                  <Route path="/nvl" element={<NVLManagement />} />
                  <Route path="/tp" element={<TPManagement />} />
                  <Route path="/report" element={<ReportManagement />} />
                  <Route path="/reportMobile" element={<ReportMobile />} />



                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;