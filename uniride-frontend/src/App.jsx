import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import {
  DashboardPage, UsersPage, DriversPage, VehiclesPage, RidesPage, DeliveriesPage,
  PaymentsPage, PricingPage, FeedbackPage, ReportsPage, NotificationsPage, RolesPage, AuditLogsPage
} from "./pages/AdminPages";

function NotFound() {
  return <div className="not-found"><h1>Page not found</h1><p>The page you requested does not exist.</p><a className="btn btn-primary" href="/admin">Back to dashboard</a></div>;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route path="/admin" element={<AdminLayout/>}>
        <Route index element={<DashboardPage/>}/>
        <Route path="users" element={<UsersPage/>}/>
        <Route path="drivers" element={<DriversPage/>}/>
        <Route path="vehicles" element={<VehiclesPage/>}/>
        <Route path="rides" element={<RidesPage/>}/>
        <Route path="deliveries" element={<DeliveriesPage/>}/>
        <Route path="payments" element={<PaymentsPage/>}/>
        <Route path="pricing" element={<PricingPage/>}/>
        <Route path="feedback" element={<FeedbackPage/>}/>
        <Route path="reports" element={<ReportsPage/>}/>
        <Route path="notifications" element={<NotificationsPage/>}/>
        <Route path="roles" element={<RolesPage/>}/>
        <Route path="audit-logs" element={<AuditLogsPage/>}/>
      </Route>
    </Route>
    <Route path="/" element={<Navigate to={localStorage.getItem("uniride_admin_token") ? "/admin" : "/login"} replace/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes>;
}
