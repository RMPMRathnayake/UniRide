import { Navigate, Route, Routes, Link, Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RiderLogin from './pages/Login';
import RiderLayout from './components/DashboardLayout';
import RiderOverview from './pages/Overview';
import BookRide from './pages/BookRide';
import StorePage from './pages/StorePage';
import RiderActive from './pages/Active';
import History from './pages/History';
import Spending from './pages/Spending';
import RiderReviews from './pages/Reviews';
import RiderProfile from './pages/Profile';
import RiderSettings from './pages/Settings';
import { Loading } from './components/UI';
import DriverLogin from './driver/pages/Login';
import DriverLayout from './driver/components/DashboardLayout';
import DriverOverview from './driver/pages/Overview';
import Jobs from './driver/pages/Jobs';
import Earnings from './driver/pages/Earnings';
import DriverReviews from './driver/pages/Reviews';
import DriverProfile from './driver/pages/Profile';
import DriverSettings from './driver/pages/Settings';
import { FullPageLoader } from './driver/components/UI';
import StudentRegister from './auth/StudentRegister';
import DriverRegister from './auth/DriverRegister';
import RoleSelection from './auth/RoleSelection';
import ForgotPassword from './auth/ForgotPassword';
import AdminLayout from './admin/components/AdminLayout';
import AdminLoginPage from './admin/pages/LoginPage';
import { DashboardPage, UsersPage, DriversPage, VehiclesPage, RidesPage, DeliveriesPage, PaymentsPage, PricingPage, FeedbackPage, ReportsPage, NotificationsPage, RolesPage, AuditLogsPage } from './admin/pages/AdminPages';

function ProtectedRole({ role, children }) {
  const { rider, driver, loading } = useAuth();
  if (loading) return role === 'driver' ? <div className="driver-app"><FullPageLoader /></div> : <div className="rider-app"><Loading text="Verifying your UniRide account…" /></div>;
  const account = role === 'driver' ? driver : rider;
  return account ? children : <Navigate to={`/${role}/login`} replace />;
}
function LoginEntry({ role, children }) {
  const { rider, driver, loading } = useAuth();
  if (loading) return role === 'driver' ? <div className="driver-app"><FullPageLoader /></div> : <div className="rider-app"><Loading text="Verifying your UniRide account…" /></div>;
  const account = role === 'driver' ? driver : rider;
  return account ? <Navigate to={`/${role}`} replace /> : <div className={`${role}-app`}>{children}</div>;
}
function StudentRegistration() {
  const navigate = useNavigate();
  return <AuthPageShell><StudentRegister goTo={(target) => navigate(target === 'login' ? '/rider/login' : '/register')} /></AuthPageShell>;
}
function DriverRegistration() {
  const navigate = useNavigate();
  return <AuthPageShell><DriverRegister goTo={(target) => navigate(target === 'driver' ? '/driver/login' : '/register')} /></AuthPageShell>;
}
function AccountTypes() {
  const navigate = useNavigate();
  return <AuthPageShell><RoleSelection goTo={(target) => navigate(target === 'student' ? '/register/student' : target === 'driver' ? '/register/driver' : '/rider/login')} /></AuthPageShell>;
}
function PasswordRecovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const target = location.state?.role === 'driver' ? '/driver/login' : '/rider/login';
  return <AuthPageShell><ForgotPassword goTo={() => navigate(target)} /></AuthPageShell>;
}
function AuthPageShell({ children }) {
  return <main className="uniride-auth-page"><div className="uniride-auth-brand"><img src="/logo.PNG" alt="UniRide logo"/><div><strong>UniRide</strong><span>University Mobility & Delivery Platform</span></div></div><section className="uniride-auth-content">{children}</section></main>;
}
function RoleSelect() {
  const { rider, driver, activeRole, loading } = useAuth();
  return <main className="role-select-page">
    <div className="role-select-nav"><Link to="/" className="role-brand"><img src="/logo.PNG" alt="UniRide logo"/><span>UniRide</span></Link><span>University Mobility & Delivery Platform</span></div>
    <section className="role-hero">
      <div className="role-kicker">UNIVERSITY MOBILITY & DELIVERY PLATFORM</div>
      <h1>Welcome to <span>UniRide.</span></h1>
      <p>One connected platform for campus rides, deliveries and driver services at South Eastern University of Sri Lanka.</p>
      {loading ? <div className="role-loading">Checking your session…</div> : activeRole === 'rider' && rider ? <Link className="role-continue" to="/rider">Continue to student dashboard <span>→</span></Link> : activeRole === 'driver' && driver ? <Link className="role-continue" to="/driver">Continue to driver dashboard <span>→</span></Link> : null}
      <div className="role-cards">
        <Link to="/rider/login" className="role-card"><div className="role-card-top"><span className="role-card-label">FOR STUDENTS</span><span className="role-card-arrow">↗</span></div><div className="role-card-title">Student</div><p>Book campus rides, order products or food, and track your trips and delivery activity.</p><span className="role-card-action">Open student portal <b>→</b></span></Link>
        <Link to="/driver/login" className="role-card driver-role-card"><div className="role-card-top"><span className="role-card-label">FOR DRIVERS</span><span className="role-card-arrow">↗</span></div><div className="role-card-title">Driver</div><p>Manage availability, accept campus rides and deliveries, and review your completed work and earnings.</p><span className="role-card-action">Open driver portal <b>→</b></span></Link>
      </div>
    </section>
    <footer className="role-footer">All rights reserved UniRide · code with ❤️</footer>
  </main>;
}
function AdminGate() { return localStorage.getItem('uniride_admin_token') ? <Outlet/> : <Navigate to="/admin/login" replace/>; }

export default function App() {
  return <Routes>
    <Route path="/" element={<RoleSelect/>}/>
    <Route path="/register" element={<AccountTypes/>}/>
    <Route path="/register/student" element={<StudentRegistration/>}/>
    <Route path="/register/driver" element={<DriverRegistration/>}/>
    <Route path="/forgot-password" element={<PasswordRecovery/>}/>
    <Route path="/rider/login" element={<LoginEntry role="rider"><RiderLogin/></LoginEntry>}/>
    <Route path="/rider" element={<ProtectedRole role="rider"><div className="rider-app"><RiderLayout/></div></ProtectedRole>}>
      <Route index element={<RiderOverview/>}/><Route path="book-ride" element={<BookRide/>}/><Route path="products" element={<StorePage type="product"/>}/><Route path="food" element={<StorePage type="food"/>}/><Route path="active" element={<RiderActive/>}/><Route path="history" element={<History/>}/><Route path="spending" element={<Spending/>}/><Route path="reviews" element={<RiderReviews/>}/><Route path="profile" element={<RiderProfile/>}/><Route path="settings" element={<RiderSettings/>}/><Route path="*" element={<Navigate to="/rider" replace/>}/>
    </Route>
    <Route path="/driver/login" element={<LoginEntry role="driver"><DriverLogin/></LoginEntry>}/>
    <Route path="/driver" element={<ProtectedRole role="driver"><div className="driver-app"><DriverLayout/></div></ProtectedRole>}>
      <Route index element={<DriverOverview/>}/><Route path="available" element={<Jobs mode="available"/>}/><Route path="active" element={<Jobs mode="active"/>}/><Route path="completed" element={<Jobs mode="completed"/>}/><Route path="earnings" element={<Earnings/>}/><Route path="reviews" element={<DriverReviews/>}/><Route path="profile" element={<DriverProfile/>}/><Route path="settings" element={<DriverSettings/>}/><Route path="*" element={<Navigate to="/driver" replace/>}/>
    </Route>
    <Route path="/admin/login" element={<AdminLoginPage/>}/>
    <Route element={<AdminGate/>}><Route path="/admin" element={<AdminLayout/>}>
      <Route index element={<DashboardPage/>}/><Route path="users" element={<UsersPage/>}/><Route path="drivers" element={<DriversPage/>}/><Route path="vehicles" element={<VehiclesPage/>}/><Route path="rides" element={<RidesPage/>}/><Route path="deliveries" element={<DeliveriesPage/>}/><Route path="payments" element={<PaymentsPage/>}/><Route path="pricing" element={<PricingPage/>}/><Route path="feedback" element={<FeedbackPage/>}/><Route path="reports" element={<ReportsPage/>}/><Route path="notifications" element={<NotificationsPage/>}/><Route path="roles" element={<RolesPage/>}/><Route path="audit-logs" element={<AuditLogsPage/>}/>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
