import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import Layout from '../components/layout/Layout';
import Home from '../pages/Home';
import Assessment from '../pages/Assessment';
import SyntheticData from '../pages/SyntheticData';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { Consent } from '../pages/Consent';
import { Settings } from '../pages/Settings';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminUserDetail } from '../pages/admin/UserDetail';
import AdminOffers from '../pages/admin/Offers';
import AdminOfferDetail from '../pages/admin/OfferDetail';
import NotFound from '../pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/consent" element={<Consent />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/assessment" element={<Assessment />} />
                    <Route path="/synthetic-data" element={<SyntheticData />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
                    <Route path="/admin/offers" element={<AdminOffers />} />
                    <Route path="/admin/offers/:id" element={<AdminOfferDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
