import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import Jobs from './pages/Jobs';
import Earnings from './pages/Earnings';
import Reviews from './pages/Reviews';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { FullPageLoader } from './components/UI';

function Protected({ children }) {
  const { driver, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return driver ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { driver } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={driver ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="available" element={<Jobs mode="available" />} />
        <Route path="active" element={<Jobs mode="active" />} />
        <Route path="completed" element={<Jobs mode="completed" />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
