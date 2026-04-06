"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  FiLogOut, FiUsers, FiSettings, FiLayers, FiMail,
  FiCheck, FiX, FiPlus, FiTrash2, FiEdit, FiMenu, FiHome,
  FiHash, FiCreditCard,
} from "react-icons/fi";
import { BsBank2 } from "react-icons/bs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface Admin { email: string; role: string; name: string; }

type Section = "dashboard" | "requests" | "users" | "channels" | "tiers" | "settings" | "admin-emails" | "bank-accounts" | "utrs";

function SuperAdminApp() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("superadmin_token");
    if (saved) { setToken(saved); verifyToken(saved); }
    else setLoading(false);
  }, []);

  async function verifyToken(t: string) {
    try {
      const res = await fetch(`${API_URL}/admin-auth/me`, { headers: { Authorization: `Bearer ${t}` } });
      const d = await res.json();
      if (d.success && d.admin.role === "superadmin") setAdmin(d.admin);
      else { localStorage.removeItem("superadmin_token"); setToken(null); }
    } catch { localStorage.removeItem("superadmin_token"); setToken(null); }
    finally { setLoading(false); }
  }

  async function handleGoogleLogin(credential: string) {
    try {
      const res = await fetch(`${API_URL}/admin-auth/google-login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const d = await res.json();
      if (d.success && d.admin.role === "superadmin") {
        localStorage.setItem("superadmin_token", d.token);
        setToken(d.token); setAdmin(d.admin);
      } else { alert(d.message || "Not authorized as superadmin"); }
    } catch { alert("Network error"); }
  }

  function logout() {
    localStorage.removeItem("superadmin_token");
    setToken(null); setAdmin(null);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!admin || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">F</div>
          <h1 className="text-2xl font-bold text-white">Abc<span className="text-indigo-400">Pay</span> Super Admin</h1>
        </div>
        <p className="text-muted text-sm">Sign in with your authorized Google account</p>
        <GoogleLogin
          onSuccess={(r) => r.credential && handleGoogleLogin(r.credential)}
          onError={() => alert("Google login failed")}
          theme="filled_blue" size="large" shape="pill"
        />
      </div>
    );
  }

  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <FiHome size={18} /> },
    { key: "requests", label: "Requests", icon: <FiCheck size={18} /> },
    { key: "users", label: "Users", icon: <FiUsers size={18} /> },
    { key: "channels", label: "Channels", icon: <BsBank2 size={18} /> },
    { key: "tiers", label: "Tiers", icon: <FiLayers size={18} /> },
    { key: "settings", label: "Settings", icon: <FiSettings size={18} /> },
    { key: "bank-accounts", label: "Bank Accounts", icon: <FiCreditCard size={18} /> },
    { key: "utrs", label: "UTRs", icon: <FiHash size={18} /> },
    { key: "admin-emails", label: "Admin Emails", icon: <FiMail size={18} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 h-full w-60 bg-card-bg border-r border-card-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-4 py-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-md flex items-center justify-center text-white font-bold text-xs">F</div>
            <span className="text-sm font-bold text-white">Super Admin</span>
          </div>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm ${section === item.key ? "bg-primary/20 text-white" : "text-muted hover:text-white"}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-card-border px-4 py-3">
          <p className="text-muted text-[10px] truncate mb-1">{admin.email}</p>
          <button onClick={logout} className="flex items-center gap-2 text-muted text-xs hover:text-white">
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-card-border shrink-0 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-white"><FiMenu size={20} /></button>
          <span className="text-white font-semibold text-sm">{navItems.find(n => n.key === section)?.label}</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {section === "dashboard" && <DashboardSection />}
          {section === "requests" && <RequestsSection token={token} />}
          {section === "users" && <UsersSection token={token} />}
          {section === "channels" && <ChannelsSection token={token} />}
          {section === "tiers" && <TiersSection token={token} />}
          {section === "settings" && <SettingsSection token={token} />}
          {section === "bank-accounts" && <BankAccountsSection token={token} />}
          {section === "utrs" && <UTRsSection token={token} />}
          {section === "admin-emails" && <AdminEmailsSection token={token} />}
        </div>
      </main>
    </div>
  );
}

function DashboardSection() {
  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-4">Welcome, Super Admin</h2>
      <p className="text-muted text-sm">Use the sidebar to manage the FastPayz platform.</p>
    </div>
  );
}

function RequestsSection({ token }: { token: string }) {
  const [tab, setTab] = useState<"deposits" | "withdrawals" | "sec-deposits" | "sec-withdrawals">("deposits");
  const [data, setData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  const fetchData = useCallback(async () => {
    setFetching(true);
    const ep: Record<string, string> = {
      deposits: "/admin/deposit-requests?status=pending",
      withdrawals: "/admin/withdrawal-requests?status=pending",
      "sec-deposits": "/admin/security-deposits?status=pending",
      "sec-withdrawals": "/admin/security-withdrawals?status=pending",
    };
    try {
      const res = await fetch(`${API_URL}${ep[tab]}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch {} finally { setFetching(false); }
  }, [token, tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAction(id: string, status: string) {
    const ep: Record<string, string> = {
      deposits: "/admin/update-transaction",
      withdrawals: "/admin/update-transaction",
      "sec-deposits": "/admin/update-security-deposit",
      "sec-withdrawals": "/admin/update-security-withdrawal",
    };
    await fetch(`${API_URL}${ep[tab]}`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    setData(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["deposits", "withdrawals", "sec-deposits", "sec-withdrawals"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${tab === t ? "bg-primary text-white" : "bg-card-bg text-muted border border-card-border"}`}>
            {t.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>
      {fetching ? <p className="text-muted">Loading...</p> : data.length === 0 ? <p className="text-muted">No pending requests</p> : (
        <div className="flex flex-col gap-3">
          {data.map((item: any) => (
            <div key={item.id} className="bg-card-bg border border-card-border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-white font-bold">{"\u20B9"}{parseFloat(item.amount).toLocaleString()}</p>
                <p className="text-muted text-xs">{item.userPhone} &bull; {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(item.id, "approved")} className="bg-success text-white p-2 rounded-lg"><FiCheck size={16} /></button>
                <button onClick={() => handleAction(item.id, "rejected")} className="bg-danger text-white p-2 rounded-lg"><FiX size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersSection({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/superadmin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setUsers(d.data); });
  }, [token]);

  return (
    <div>
      <h2 className="text-white font-bold mb-4">Users ({users.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted text-xs border-b border-card-border">
            <th className="text-left py-2 px-2">Phone</th><th className="text-left py-2 px-2">Email</th><th className="text-left py-2 px-2">Balance</th><th className="text-left py-2 px-2">Referral</th><th className="text-left py-2 px-2">Date</th>
          </tr></thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-card-border/50">
                <td className="py-2 px-2 text-white">{u.phone}</td>
                <td className="py-2 px-2 text-muted text-xs">{u.email || "-"}</td>
                <td className="py-2 px-2 text-white">{u.balance}</td>
                <td className="py-2 px-2 text-cyan-400 text-xs">{u.referralCode}</td>
                <td className="py-2 px-2 text-muted text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChannelsSection({ token }: { token: string }) {
  const [channels, setChannels] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", type: "upi", minAmount: "500", maxAmount: "200000", upiId: "", qrCodeUrl: "", bankAccountNo: "", bankIfsc: "", bankName: "", bankHolderName: "", walletAddress: "", sortOrder: "0" });

  useEffect(() => {
    fetch(`${API_URL}/superadmin/channels`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setChannels(d.data); });
  }, [token]);

  async function uploadQR(file: File): Promise<string> {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/upload/qr`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const d = await res.json();
    setUploading(false);
    return d.success ? d.url : "";
  }

  async function handleCreate() {
    const res = await fetch(`${API_URL}/superadmin/channels/create`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, minAmount: parseInt(form.minAmount), maxAmount: parseInt(form.maxAmount), sortOrder: parseInt(form.sortOrder), active: true }),
    });
    const d = await res.json();
    if (d.success) { setChannels(prev => [...prev, d.channel]); setShowForm(false); setForm({ name: "", type: "upi", minAmount: "500", maxAmount: "200000", upiId: "", qrCodeUrl: "", bankAccountNo: "", bankIfsc: "", bankName: "", bankHolderName: "", walletAddress: "", sortOrder: "0" }); }
  }

  async function handleUpdate(id: string) {
    await fetch(`${API_URL}/superadmin/channels/update`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, ...editData }),
    });
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...editData } : c));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this channel?")) return;
    await fetch(`${API_URL}/superadmin/channels/delete`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setChannels(prev => prev.filter(c => c.id !== id));
  }

  const inputCls = "border border-card-border rounded-lg px-3 py-2 text-white text-sm w-full";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold">Deposit Channels</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-xs"><FiPlus size={14} /> Add Channel</button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-4">
          <p className="text-white font-semibold text-sm mb-3">New Channel</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={`${inputCls} bg-card-bg`}>
              <option value="upi">UPI</option><option value="bank">Bank</option><option value="crypto">Crypto</option>
            </select>
            <input placeholder="Min Amount" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: e.target.value })} className={inputCls} />
            <input placeholder="Max Amount" value={form.maxAmount} onChange={e => setForm({ ...form, maxAmount: e.target.value })} className={inputCls} />
            {form.type === "upi" && <>
              <input placeholder="UPI ID" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} className={inputCls} />
              <div className="flex flex-col gap-2">
                <input placeholder="QR Code URL (or upload below)" value={form.qrCodeUrl} onChange={e => setForm({ ...form, qrCodeUrl: e.target.value })} className={inputCls} />
                <label className="flex items-center gap-2 bg-primary/20 text-primary text-xs px-3 py-2 rounded-lg cursor-pointer">
                  {uploading ? "Uploading..." : "Upload QR Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) { const url = await uploadQR(file); if (url) setForm({ ...form, qrCodeUrl: url }); }
                  }} />
                </label>
              </div>
            </>}
            {form.type === "bank" && <>
              <input placeholder="Account No" value={form.bankAccountNo} onChange={e => setForm({ ...form, bankAccountNo: e.target.value })} className={inputCls} />
              <input placeholder="IFSC Code" value={form.bankIfsc} onChange={e => setForm({ ...form, bankIfsc: e.target.value })} className={inputCls} />
              <input placeholder="Bank Name" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} className={inputCls} />
              <input placeholder="Account Holder Name" value={form.bankHolderName} onChange={e => setForm({ ...form, bankHolderName: e.target.value })} className={inputCls} />
            </>}
            {form.type === "crypto" && <input placeholder="Wallet Address" value={form.walletAddress} onChange={e => setForm({ ...form, walletAddress: e.target.value })} className={`col-span-2 ${inputCls}`} />}
            <button onClick={handleCreate} className="col-span-2 bg-success text-white py-2 rounded-lg text-sm font-semibold">Create Channel</button>
          </div>
        </div>
      )}

      {/* Channel list */}
      <div className="flex flex-col gap-3">
        {channels.map((ch: any) => (
          <div key={ch.id} className="bg-card-bg border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{ch.name} <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary ml-1">{ch.type.toUpperCase()}</span></p>
                <p className="text-muted text-xs mt-0.5">Min: {ch.minAmount?.toLocaleString()} | Max: {ch.maxAmount?.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if (editingId === ch.id) { setEditingId(null); } else { setEditingId(ch.id); setEditData({ upiId: ch.upiId || "", qrCodeUrl: ch.qrCodeUrl || "", bankAccountNo: ch.bankAccountNo || "", bankIfsc: ch.bankIfsc || "", bankName: ch.bankName || "", bankHolderName: ch.bankHolderName || "", walletAddress: ch.walletAddress || "" }); } }} className="text-muted hover:text-white p-1"><FiEdit size={15} /></button>
                <button onClick={() => handleDelete(ch.id)} className="text-danger p-1"><FiTrash2 size={15} /></button>
              </div>
            </div>

            {/* Show details */}
            {ch.type === "upi" && (
              <div className="flex gap-4 items-start">
                {ch.qrCodeUrl ? (
                  <img src={ch.qrCodeUrl} alt="QR" className="w-24 h-24 rounded-lg bg-white p-1 object-contain shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-[#1a2744] flex items-center justify-center text-muted text-xs shrink-0">No QR</div>
                )}
                <div className="text-xs">
                  <p className="text-muted">UPI ID: <span className="text-white">{ch.upiId || "-"}</span></p>
                </div>
              </div>
            )}
            {ch.type === "bank" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="text-muted">Bank: <span className="text-white">{ch.bankName || "-"}</span></p>
                <p className="text-muted">Account: <span className="text-white">{ch.bankAccountNo || "-"}</span></p>
                <p className="text-muted">IFSC: <span className="text-white">{ch.bankIfsc || "-"}</span></p>
                <p className="text-muted">Holder: <span className="text-white">{ch.bankHolderName || "-"}</span></p>
              </div>
            )}
            {ch.type === "crypto" && (
              <p className="text-xs text-muted">Wallet: <span className="text-white break-all">{ch.walletAddress || "-"}</span></p>
            )}

            {/* Edit form */}
            {editingId === ch.id && (
              <div className="mt-3 pt-3 border-t border-card-border grid grid-cols-2 gap-3">
                {ch.type === "upi" && <>
                  <input placeholder="UPI ID" value={editData.upiId} onChange={e => setEditData({ ...editData, upiId: e.target.value })} className={inputCls} />
                  <div className="flex flex-col gap-2">
                    <input placeholder="QR Code URL" value={editData.qrCodeUrl} onChange={e => setEditData({ ...editData, qrCodeUrl: e.target.value })} className={inputCls} />
                    <label className="flex items-center gap-2 bg-primary/20 text-primary text-xs px-3 py-2 rounded-lg cursor-pointer text-center justify-center">
                      {uploading ? "Uploading..." : "Upload New QR"}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) { const url = await uploadQR(file); if (url) setEditData({ ...editData, qrCodeUrl: url }); }
                      }} />
                    </label>
                  </div>
                </>}
                {ch.type === "bank" && <>
                  <input placeholder="Account No" value={editData.bankAccountNo} onChange={e => setEditData({ ...editData, bankAccountNo: e.target.value })} className={inputCls} />
                  <input placeholder="IFSC Code" value={editData.bankIfsc} onChange={e => setEditData({ ...editData, bankIfsc: e.target.value })} className={inputCls} />
                  <input placeholder="Bank Name" value={editData.bankName} onChange={e => setEditData({ ...editData, bankName: e.target.value })} className={inputCls} />
                  <input placeholder="Holder Name" value={editData.bankHolderName} onChange={e => setEditData({ ...editData, bankHolderName: e.target.value })} className={inputCls} />
                </>}
                {ch.type === "crypto" && <input placeholder="Wallet Address" value={editData.walletAddress} onChange={e => setEditData({ ...editData, walletAddress: e.target.value })} className={`col-span-2 ${inputCls}`} />}
                <button onClick={() => handleUpdate(ch.id)} className="col-span-2 bg-success text-white py-2 rounded-lg text-sm font-semibold">Save Changes</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TiersSection({ token }: { token: string }) {
  const [tiers, setTiers] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/superadmin/tiers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setTiers(d.data); });
  }, [token]);

  return (
    <div>
      <h2 className="text-white font-bold mb-4">Tiers</h2>
      <div className="flex flex-col gap-3">
        {tiers.map((t: any) => (
          <div key={t.id} className="bg-card-bg border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-bold">{t.name} Tier <span className="text-muted text-xs">({t.label})</span></p>
              <span className="text-muted text-xs">{t.subtitle}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p className="text-muted">Withdrawal Limit: <span className="text-white">{t.dailyWithdrawalLimit.toLocaleString()}</span></p>
              <p className="text-muted">Hold Time: <span className="text-white">{t.withdrawalHoldTime}</span></p>
              <p className="text-muted">WDR Commission: <span className="text-white">{t.withdrawalCommission}%</span></p>
              <p className="text-muted">Dep Commission: <span className="text-white">{t.depositCommission}%</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSection({ token }: { token: string }) {
  const [settings, setSettings] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/superadmin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setSettings(d.data); });
  }, [token]);

  async function handleSave(key: string) {
    await fetch(`${API_URL}/superadmin/settings/update`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, value: editValue }),
    });
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value: editValue } : s));
    setEditing(null);
  }

  return (
    <div>
      <h2 className="text-white font-bold mb-4">Settings</h2>
      <div className="flex flex-col gap-3">
        {settings.map((s: any) => (
          <div key={s.id} className="bg-card-bg border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-semibold text-sm">{s.key.replace(/_/g, " ").toUpperCase()}</p>
              {editing === s.key ? (
                <button onClick={() => handleSave(s.key)} className="bg-success text-white px-3 py-1 rounded-lg text-xs">Save</button>
              ) : (
                <button onClick={() => { setEditing(s.key); setEditValue(s.value); }} className="text-muted"><FiEdit size={14} /></button>
              )}
            </div>
            {editing === s.key ? (
              <textarea value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full border border-card-border rounded-lg px-3 py-2 text-white text-sm min-h-[60px]" />
            ) : (
              <p className="text-muted text-xs">{s.value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminEmailsSection({ token }: { token: string }) {
  const [emails, setEmails] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/superadmin/admin-emails`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setEmails(d.data); });
  }, [token]);

  async function handleAdd() {
    if (!newEmail) return;
    const res = await fetch(`${API_URL}/superadmin/admin-emails/add`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail, role: newRole, name: newName }),
    });
    const d = await res.json();
    if (d.success) { setEmails(prev => [...prev, d.entry]); setNewEmail(""); setNewName(""); }
    else alert(d.message || "Failed");
  }

  async function handleDelete(id: string) {
    await fetch(`${API_URL}/superadmin/admin-emails/delete`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setEmails(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div>
      <h2 className="text-white font-bold mb-4">Admin Emails</h2>
      <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-white text-sm" />
          <input placeholder="Name (optional)" value={newName} onChange={e => setNewName(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-white text-sm" />
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-white text-sm bg-card-bg">
            <option value="admin">Admin</option><option value="superadmin">Super Admin</option>
          </select>
        </div>
        <button onClick={handleAdd} className="bg-primary text-white py-2 rounded-lg text-sm font-semibold">Add Email</button>
      </div>
      <div className="flex flex-col gap-2">
        {emails.map((e: any) => (
          <div key={e.id} className="bg-card-bg border border-card-border rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">{e.email}</p>
              <p className="text-muted text-xs">{e.role} {e.name ? `- ${e.name}` : ""}</p>
            </div>
            <button onClick={() => handleDelete(e.id)} className="text-danger p-1"><FiTrash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BankAccountsSection({ token }: { token: string }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/superadmin/bank-accounts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setAccounts(d.data); });
  }, [token]);

  return (
    <div>
      <h2 className="text-white font-bold mb-4">Bank Accounts ({accounts.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted text-xs border-b border-card-border">
            <th className="text-left py-2 px-2">User</th>
            <th className="text-left py-2 px-2">Bank</th>
            <th className="text-left py-2 px-2">Account No</th>
            <th className="text-left py-2 px-2">Holder</th>
            <th className="text-left py-2 px-2">IFSC</th>
            <th className="text-left py-2 px-2">Status</th>
            <th className="text-left py-2 px-2">Date</th>
          </tr></thead>
          <tbody>
            {accounts.map((a: any) => (
              <tr key={a.id} className="border-b border-card-border/50">
                <td className="py-2 px-2 text-white text-xs">{a.userPhone}</td>
                <td className="py-2 px-2 text-white text-xs">{a.bankName}</td>
                <td className="py-2 px-2 text-muted text-xs">{a.accountNo}</td>
                <td className="py-2 px-2 text-muted text-xs">{a.accountHolderName}</td>
                <td className="py-2 px-2 text-muted text-xs">{a.ifscCode}</td>
                <td className="py-2 px-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    a.status === "active" ? "bg-success/20 text-success" :
                    a.status === "pending" ? "bg-warning/20 text-warning" :
                    "bg-danger/20 text-danger"
                  }`}>{a.status}</span>
                </td>
                <td className="py-2 px-2 text-muted text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UTRsSection({ token }: { token: string }) {
  const [utrList, setUtrList] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/superadmin/utrs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setUtrList(d.data); });
  }, [token]);

  return (
    <div>
      <h2 className="text-white font-bold mb-4">UTRs ({utrList.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted text-xs border-b border-card-border">
            <th className="text-left py-2 px-2">User</th>
            <th className="text-left py-2 px-2">UTR Number</th>
            <th className="text-left py-2 px-2">Amount</th>
            <th className="text-left py-2 px-2">Bank</th>
            <th className="text-left py-2 px-2">Status</th>
            <th className="text-left py-2 px-2">Date</th>
          </tr></thead>
          <tbody>
            {utrList.map((u: any) => (
              <tr key={u.id} className="border-b border-card-border/50">
                <td className="py-2 px-2 text-white text-xs">{u.userPhone}</td>
                <td className="py-2 px-2 text-cyan-400 text-xs font-medium">{u.utrNumber}</td>
                <td className="py-2 px-2 text-white text-xs">{"\u20B9"}{parseFloat(u.amount).toLocaleString()}</td>
                <td className="py-2 px-2 text-muted text-xs">{u.bankName || "-"}</td>
                <td className="py-2 px-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    u.status === "approved" ? "bg-success/20 text-success" :
                    u.status === "pending" ? "bg-warning/20 text-warning" :
                    "bg-danger/20 text-danger"
                  }`}>{u.status}</span>
                </td>
                <td className="py-2 px-2 text-muted text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SuperAdminApp />
    </GoogleOAuthProvider>
  );
}
