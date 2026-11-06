import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Users, UserRound, ShieldCheck, CarFront, Route, Package, Wallet,
  Clock3, TrendingUp, RefreshCw, Search, Check, X, ArrowUpRight,
  Bell, Settings, Download, CircleAlert, ChartNoAxesCombined, MessageSquare,
  FileText, Shield, Activity, MapPin
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import api from "../services/api";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

const money = value => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(Number(value || 0));
const date = value => value ? new Date(value).toLocaleDateString() : "—";

function PageTitle({ title, subtitle, action }) {
  return <div className="page-title-row"><div><div className="breadcrumbs">UniRide <span>/</span> Administration</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function TablePage({ title, subtitle, endpoint, columns, searchPlaceholder = "Search records", renderActions, empty = "No records found." }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get(endpoint, { params: { q, page, limit: 10 } });
      setItems(data.items || []); setPagination(data.pagination || { total: (data.items || []).length, pages: 1 });
    } catch (e) { setError(e.response?.data?.message || "Could not load data. Check your backend and database."); }
    finally { setLoading(false); }
  }, [endpoint, q, page]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const exportCsv = () => {
    if (!items.length) return;
    const keys = columns.map(c => c.key);
    const csv = [columns.map(c => c.label), ...items.map(item => keys.map(key => String(item[key] ?? "").replaceAll('"','""')))]
      .map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `${title.toLowerCase().replaceAll(" ","-")}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="page-stack">
    <PageTitle title={title} subtitle={subtitle} action={<button className="btn btn-secondary" onClick={exportCsv}><Download size={16}/> Export CSV</button>}/>
    <section className="panel">
      <div className="table-toolbar"><div className="search-box"><Search size={17}/><input value={q} onChange={e => {setQ(e.target.value); setPage(1);}} placeholder={searchPlaceholder}/></div><button className="btn btn-secondary btn-compact" onClick={load}><RefreshCw size={15}/> Refresh</button><span className="muted record-count">{pagination.total} records</span></div>
      {error && <div className="alert alert-error table-alert">{error}</div>}
      <div className="table-wrap"><table><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}{renderActions && <th>Actions</th>}</tr></thead>
        <tbody>{loading ? <tr><td colSpan={columns.length + (renderActions ? 1 : 0)} className="table-message">Loading records…</td></tr> : items.length ? items.map(item => <tr key={item._id || item.id}>{columns.map(c => <td key={c.key}>{c.render ? c.render(item[c.key], item) : (item[c.key] ?? "—")}</td>)}{renderActions && <td><div className="table-actions">{renderActions(item, load)}</div></td>}</tr>) : <tr><td colSpan={columns.length + (renderActions ? 1 : 0)} className="table-message">{empty}</td></tr>}</tbody>
      </table></div>
      <div className="pagination"><span className="muted">Page {page} of {Math.max(pagination.pages || 1, 1)}</span><div><button className="btn btn-secondary btn-compact" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><button className="btn btn-secondary btn-compact" disabled={page >= (pagination.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</button></div></div>
    </section>
  </div>;
}

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const response = await api.get("/admin/dashboard"); setData(response.data); setError(""); }
    catch (e) { setError(e.response?.data?.message || "Unable to load dashboard data."); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const stats = data?.stats || {};
  const chartData = [
    { name: "Students", total: stats.students || 0 },
    { name: "Drivers", total: stats.drivers || 0 },
    { name: "Rides", total: stats.rides || 0 },
    { name: "Pending", total: stats.pendingDrivers || 0 }
  ];
  return <div className="page-stack">
    <PageTitle title="Dashboard Overview" subtitle="Monitor your university mobility and delivery platform." action={<button className="btn btn-secondary" onClick={load}><RefreshCw size={16}/> Refresh data</button>}/>
    {error && <div className="alert alert-error">{error} Make sure the backend is running and an administrator is signed in.</div>}
    <div className="stats-grid">
      <StatCard title="Registered Students" value={(stats.students || 0).toLocaleString()} hint="Student accounts" icon={Users} accent="blue"/>
      <StatCard title="Registered Drivers" value={(stats.drivers || 0).toLocaleString()} hint={`${stats.pendingDrivers || 0} awaiting verification`} icon={UserRound} accent="green"/>
      <StatCard title="Active Rides" value={(stats.activeRides || 0).toLocaleString()} hint="Accepted or in transit" icon={Route} accent="orange"/>
      <StatCard title="Paid Revenue" value={money(stats.revenue)} hint={`${stats.payments || 0} payment records`} icon={Wallet} accent="teal"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><h2>Platform snapshot</h2><p>Current records stored in the database</p></div><span className="panel-icon"><ChartNoAxesCombined size={19}/></span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EDF4"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8290A1", fontSize: 12 }}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#8290A1", fontSize: 12 }}/><Tooltip cursor={{ fill: "#F3F7FC" }}/><Bar dataKey="total" fill="#0B2D55" radius={[6,6,0,0]} maxBarSize={42}/></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel quick-panel">
        <div className="panel-heading"><div><h2>Operations at a glance</h2><p>Items requiring attention</p></div></div>
        <div className="quick-stat"><span className="quick-stat-icon orange"><ShieldCheck size={18}/></span><div><strong>{stats.pendingDrivers || 0} pending</strong><span>Driver verifications</span></div></div>
        <div className="quick-stat"><span className="quick-stat-icon blue"><Package size={18}/></span><div><strong>{stats.activeDeliveries || 0} active</strong><span>Deliveries in progress</span></div></div>
        <div className="quick-stat"><span className="quick-stat-icon green"><Route size={18}/></span><div><strong>{stats.rides || 0} total</strong><span>Ride requests recorded</span></div></div>
        <div className="quick-stat"><span className="quick-stat-icon teal"><Wallet size={18}/></span><div><strong>{money(stats.revenue)}</strong><span>Recorded paid revenue</span></div></div>
      </section>
    </div>
    <section className="panel">
      <div className="panel-heading"><div><h2>Driver verification queue</h2><p>Review applications awaiting approval</p></div><span className="subtle-count">{data?.pendingDriverQueue?.length || 0} shown</span></div>
      <div className="table-wrap"><table><thead><tr><th>Driver</th><th>License number</th><th>Vehicle plate</th><th>Submitted</th><th>Status</th></tr></thead><tbody>
        {(data?.pendingDriverQueue || []).map(driver => <tr key={driver._id}><td><strong>{driver.name}</strong><div className="cell-subtext">{driver.email || driver.phone || ""}</div></td><td>{driver.licenseNumber || "—"}</td><td>{driver.vehiclePlate || "—"}</td><td>{date(driver.createdAt)}</td><td><StatusBadge status={driver.documentStatus}/></td></tr>)}
        {!data?.pendingDriverQueue?.length && <tr><td colSpan="5" className="table-message">{data ? "No pending driver verifications." : "Loading driver queue…"}</td></tr>}
      </tbody></table></div>
    </section>
    <section className="panel">
      <div className="panel-heading"><div><h2>Recent rides</h2><p>Latest ride requests registered in UniRide</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Ride ID</th><th>Student</th><th>Driver</th><th>Pickup</th><th>Destination</th><th>Fare</th><th>Status</th></tr></thead><tbody>
        {(data?.recentRides || []).map(ride => <tr key={ride._id}><td><strong>{ride.rideCode}</strong></td><td>{ride.studentName || "—"}</td><td>{ride.driverName || "—"}</td><td>{ride.pickup || "—"}</td><td>{ride.destination || "—"}</td><td>{money(ride.fare)}</td><td><StatusBadge status={ride.status}/></td></tr>)}
        {!data?.recentRides?.length && <tr><td colSpan="7" className="table-message">{data ? "No ride records yet." : "Loading recent rides…"}</td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}

export function UsersPage() {
  const changeStatus = async (item, reload) => {
    const next = item.status === "active" ? "suspended" : "active";
    if (!window.confirm(`Set ${item.name}'s account status to ${next}?`)) return;
    try { await api.patch(`/admin/users/${item._id}/status`, { status: next }); reload(); }
    catch (e) { window.alert(e.response?.data?.message || "Could not update user."); }
  };
  return <TablePage title="User Management" subtitle="Search and manage student and user accounts." endpoint="/admin/users"
    columns={[{key:"name",label:"Name"},{key:"email",label:"Email"},{key:"role",label:"Role",render:v=><span className="role-pill">{v}</span>},{key:"phone",label:"Phone"},{key:"status",label:"Account status",render:v=><StatusBadge status={v}/>},{key:"createdAt",label:"Registered",render:date}]}
    renderActions={(item,reload)=><button className="btn btn-secondary btn-compact" disabled={item.role === "admin"} onClick={()=>changeStatus(item,reload)}>{item.status === "active" ? "Suspend" : "Activate"}</button>}/>;
}

export function DriversPage() {
  const verify = async (item, status, reload) => {
    let reason = "";
    if (status === "rejected") { reason = window.prompt("Enter the reason for rejection:") || ""; if (!reason.trim()) return; }
    if (!window.confirm(`${status === "approved" ? "Approve" : status === "rejected" ? "Reject" : "Reset"} verification for ${item.name}?`)) return;
    try { await api.patch(`/admin/drivers/${item._id}/verification`, { status, reason }); reload(); }
    catch (e) { window.alert(e.response?.data?.message || "Could not update verification."); }
  };
  return <TablePage title="Drivers & Verification" subtitle="Review driver details and verification decisions." endpoint="/admin/drivers"
    columns={[{key:"name",label:"Driver"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"licenseNumber",label:"License number"},{key:"vehiclePlate",label:"Vehicle plate"},{key:"documentStatus",label:"Verification",render:v=><StatusBadge status={v}/>},{key:"availability",label:"Availability",render:v=><StatusBadge status={v}/>}]}
    renderActions={(item,reload)=><>{item.documentStatus !== "approved" && <button className="btn btn-success btn-compact" onClick={()=>verify(item,"approved",reload)} title="Approve"><Check size={14}/></button>}{item.documentStatus !== "rejected" && <button className="btn btn-danger btn-compact" onClick={()=>verify(item,"rejected",reload)} title="Reject"><X size={14}/></button>}</>}/>;
}

export function VehiclesPage() {
  return <TablePage title="Vehicle Management" subtitle="Review registered three-wheelers and other vehicles." endpoint="/admin/vehicles"
    columns={[{key:"plateNumber",label:"Registration number"},{key:"driverName",label:"Driver"},{key:"type",label:"Vehicle type"},{key:"status",label:"Verification",render:v=><StatusBadge status={v}/>},{key:"createdAt",label:"Registered",render:date}]}/>;
}
export function RidesPage() {
  return <TablePage title="Ride Management" subtitle="Monitor booking requests and ride progress." endpoint="/admin/rides"
    columns={[{key:"rideCode",label:"Ride ID"},{key:"studentName",label:"Student"},{key:"driverName",label:"Driver"},{key:"pickup",label:"Pickup"},{key:"destination",label:"Destination"},{key:"fare",label:"Fare",render:money},{key:"status",label:"Status",render:v=><StatusBadge status={v}/>},{key:"createdAt",label:"Created",render:date}]}/>;
}
export function DeliveriesPage() {
  return <TablePage title="Delivery Management" subtitle="Monitor grocery and essential-item delivery requests." endpoint="/admin/deliveries"
    columns={[{key:"deliveryCode",label:"Delivery ID"},{key:"studentName",label:"Student"},{key:"driverName",label:"Driver"},{key:"items",label:"Items"},{key:"pickup",label:"Pickup"},{key:"destination",label:"Destination"},{key:"amount",label:"Amount",render:money},{key:"status",label:"Status",render:v=><StatusBadge status={v}/>}]}/>;
}
export function PaymentsPage() {
  return <TablePage title="Payments & Revenue" subtitle="Review payment records and transaction statuses." endpoint="/admin/payments"
    columns={[{key:"transactionCode",label:"Transaction ID"},{key:"customerName",label:"Customer"},{key:"serviceType",label:"Service"},{key:"amount",label:"Amount",render:money},{key:"method",label:"Method"},{key:"status",label:"Payment status",render:v=><StatusBadge status={v}/>},{key:"createdAt",label:"Date",render:date}]}/>;
}
export function FeedbackPage() {
  return <TablePage title="Feedback & Complaints" subtitle="Review student ratings and service feedback." endpoint="/admin/feedback"
    columns={[{key:"studentName",label:"Student"},{key:"driverName",label:"Driver"},{key:"rating",label:"Rating",render:v=><span className="rating-value">★ {v || "—"}/5</span>},{key:"comment",label:"Comment"},{key:"status",label:"Case status",render:v=><StatusBadge status={v}/>},{key:"createdAt",label:"Submitted",render:date}]}/>;
}

export function PricingPage() {
  const [form, setForm] = useState({ baseFare: 100, perKmRate: 50, deliverySurcharge: 100 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api.get("/admin/pricing").then(({data}) => setForm({baseFare:data.item.baseFare, perKmRate:data.item.perKmRate, deliverySurcharge:data.item.deliverySurcharge})).catch(e=>setError(e.response?.data?.message || "Could not load pricing.")).finally(()=>setLoading(false)); }, []);
  const update = e => setForm({...form, [e.target.name]: e.target.value});
  const save = async e => {
    e.preventDefault(); setSaving(true); setMessage(""); setError("");
    try { const {data} = await api.patch("/admin/pricing", Object.fromEntries(Object.entries(form).map(([k,v])=>[k,Number(v)]))); setForm({baseFare:data.item.baseFare,perKmRate:data.item.perKmRate,deliverySurcharge:data.item.deliverySurcharge}); setMessage("Global pricing updated successfully."); }
    catch (e) { setError(e.response?.data?.message || "Could not save pricing."); }
    finally { setSaving(false); }
  };
  return <div className="page-stack"><PageTitle title="Pricing Configuration" subtitle="Configure the global fare values used by the platform."/>
    <section className="panel pricing-panel"><div className="panel-heading"><div><h2>Global campus rates</h2><p>Amounts are stored in Sri Lankan rupees (LKR).</p></div><span className="panel-icon"><Settings size={19}/></span></div>
      {message && <div className="alert alert-success">{message}</div>}{error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={save}><div className="form-grid">
        <label>Base fare (LKR)<input type="number" min="0" step="0.01" name="baseFare" value={form.baseFare} onChange={update} required/></label>
        <label>Rate per kilometre (LKR)<input type="number" min="0" step="0.01" name="perKmRate" value={form.perKmRate} onChange={update} required/></label>
        <label>Delivery surcharge (LKR)<input type="number" min="0" step="0.01" name="deliverySurcharge" value={form.deliverySurcharge} onChange={update} required/></label>
      </div><div className="form-footer"><p className="muted">Confirm fare calculation rules with your Fare & Payment module teammate before deployment.</p><button className="btn btn-primary" disabled={loading || saving}>{saving ? "Saving…" : "Save global rates"}</button></div></form>
    </section>
  </div>;
}

export function ReportsPage() {
  const [data,setData] = useState(null); const [error,setError] = useState("");
  useEffect(()=>{api.get("/admin/reports").then(r=>setData(r.data)).catch(e=>setError(e.response?.data?.message || "Could not load reports."));},[]);
  const groups = [
    ["Ride status",data?.ridesByStatus || []],
    ["Delivery status",data?.deliveriesByStatus || []],
    ["Payment totals",data?.paymentTotals || []]
  ];
  const exportReport = () => {
    if (!data) return;
    const rows = [["Report","Status","Count","Amount"]];
    for (const [title,items] of groups) for (const item of items) rows.push([title,item._id,item.count ?? "",item.amount ?? ""]);
    const csv = rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"})); const a=document.createElement("a"); a.href=url; a.download="uniride-reports.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="page-stack"><PageTitle title="Reports & Analytics" subtitle="Summaries based on records currently stored in MongoDB." action={<button className="btn btn-secondary" onClick={exportReport} disabled={!data}><Download size={16}/> Export CSV</button>}/>{error&&<div className="alert alert-error">{error}</div>}
    <div className="report-grid">{groups.map(([title,items])=><section className="panel" key={title}><div className="panel-heading"><h2>{title}</h2></div>{items.length ? <div className="report-list">{items.map(item=><div className="report-row" key={item._id}><span><StatusBadge status={item._id}/></span><strong>{item.count ?? 0}{item.amount != null ? ` · ${money(item.amount)}` : ""}</strong></div>)}</div>:<p className="empty-note">No report data available yet.</p>}</section>)}</div>
  </div>;
}

export function NotificationsPage() {
  const [items,setItems]=useState([]); const [error,setError]=useState("");
  const load=useCallback(()=>api.get("/admin/notifications").then(r=>setItems(r.data.items||[])).catch(e=>setError(e.response?.data?.message||"Could not load notifications.")),[]);
  useEffect(()=>{load();},[load]);
  const markRead=async id=>{try{await api.patch(`/admin/notifications/${id}/read`);load();}catch(e){setError(e.response?.data?.message||"Could not update notification.");}};
  return <div className="page-stack"><PageTitle title="Notifications" subtitle="Review administrative alerts and mark them as read."/><section className="panel notification-list">{error&&<div className="alert alert-error">{error}</div>}{items.map(item=><article className={`notification-item ${item.read?"is-read":""}`} key={item._id}><span className="notification-icon"><Bell size={18}/></span><div className="notification-copy"><strong>{item.title}</strong><p>{item.message}</p><span className="muted">{date(item.createdAt)}</span></div>{!item.read&&<button className="btn btn-secondary btn-compact" onClick={()=>markRead(item._id)}>Mark read</button>}</article>)}{!items.length&&<p className="empty-note">No notifications have been created yet.</p>}</section></div>;
}

export function RolesPage() {
  return <TablePage title="Roles & Permissions" subtitle="Review the platform's current role definitions. Role editing is not enabled in this starter." endpoint="/admin/roles" columns={[{key:"role",label:"Role",render:v=><span className="role-pill">{v}</span>},{key:"description",label:"Description"}]}/>;
}
export function AuditLogsPage() {
  return <TablePage title="Audit Logs" subtitle="Review recorded administrative actions." endpoint="/admin/audit-logs" columns={[{key:"createdAt",label:"Date",render:date},{key:"actor",label:"Administrator"},{key:"action",label:"Action"},{key:"target",label:"Target"},{key:"details",label:"Details"},{key:"ip",label:"IP address"}]}/>;
}
