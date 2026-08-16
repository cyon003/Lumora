import { useCallback, useEffect, useState } from "react";
import { FeatureView } from "../components/FeatureViews.jsx";
import { api } from "../api.js";
import "../components/NotificationCenter.css";

const navigation = [
  ["overview", "⌂", "Overview"], ["rooms", "▦", "Rooms"], ["bar", "♢", "Bar"],
  ["kitchen", "◴", "Kitchen"], ["unavailable", "⊘", "Unavailable Menu"], ["menu", "◫", "Menu"], ["inventory", "◇", "Inventory"],
  ["people", "♙", "Staff"], ["reports", "⌁", "Reports"], ["pos", "▣", "Point of Sale"], ["ai", "✦", "Lumora AI"],
];

const roleAccess = {
  ADMIN: ["overview", "rooms", "bar", "kitchen", "unavailable", "menu", "inventory", "people", "reports", "ai"],
  MANAGER: ["overview", "rooms", "bar", "kitchen", "unavailable", "menu", "inventory", "people", "reports", "ai"],
  HEAD_LADY: ["rooms"],
  BAR: ["bar", "inventory"],
  KITCHEN: ["kitchen", "menu", "inventory"],
  WAITER: ["pos"],
};

function Home({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role === "STAFF" ? "ADMIN" : (user.role || "WAITER");
  const allowedViews = roleAccess[role] || roleAccess.WAITER;
  const [activeView, setActiveView] = useState(allowedViews[0]);
  const [data, setData] = useState({ loading: true });
  const [error, setError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const firstName = user.name?.split(" ")[0] || "Manager";
  const currentLabel = navigation.find(([id]) => id === activeView)?.[2];
  const unavailableFoods = (data.menuItems || []).filter((item) => {
    const text = `${item.category?.name || ""} ${item.name}`.toLowerCase();
    const isDrink = ["drink", "alcohol", "cocktail", "beer", "wine", "whisky", "water", "juice", "cola", "soda", "latte", "beverage"].some((word) => text.includes(word));
    return !isDrink && !item.available;
  });

  const refresh = useCallback(async () => {
    try {
      setError("");
      const [bootstrap, orderData, dashboard, reports, users] = await Promise.all([
        api("/bootstrap"),
        api("/orders"),
        ["ADMIN", "MANAGER"].includes(role) ? api("/dashboard") : Promise.resolve({ metrics: {}, recentOrders: [] }),
        ["ADMIN", "MANAGER"].includes(role) ? api("/reports") : Promise.resolve({ summary: {}, days: [] }),
        ["ADMIN", "MANAGER"].includes(role) ? api("/auth/users") : Promise.resolve({ users: [] }),
      ]);
      setData({ ...bootstrap, orders: orderData.orders, dashboard, reports, users: users.users, loading: false });
    } catch (requestError) {
      setError(requestError.message);
      setData((current) => ({ ...current, loading: false }));
    }
  }, [role, setData, setError]);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    const notificationPolling = role === "MANAGER" ? window.setInterval(refresh, 30000) : null;
    return () => { window.clearTimeout(initialLoad); if (notificationPolling) window.clearInterval(notificationPolling); };
  }, [refresh, role]);

  async function mutate(path, options) {
    try { setError(""); const result = await api(path, options); await refresh(); return result; }
    catch (requestError) { setError(requestError.message); throw requestError; }
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="dash-logo"><span>◆</span><strong>Lumora</strong></div>
        <nav aria-label="Main navigation">
          {navigation.filter(([id]) => allowedViews.includes(id)).map(([id, icon, label]) => (
            <button key={id} className={activeView === id ? "active" : ""} onClick={() => setActiveView(id)}><span>{icon}</span>{label}</button>
          ))}
        </nav>
        <div className="sidebar-bottom"><button onClick={() => window.alert("Restaurant settings are managed by the administrator.")}><span>⚙</span>Settings</button><button onClick={onLogout}><span>↪</span>Log out</button></div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div><h1>{activeView === "overview" ? `Good morning, ${firstName}` : currentLabel}</h1></div>
          <div className="header-actions">{role === "MANAGER" && <div className="notification-center"><button className="manager-notification" aria-label={`${unavailableFoods.length} unavailable food notifications`} onClick={() => setNotificationsOpen(!notificationsOpen)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>{unavailableFoods.length > 0 && <b>{unavailableFoods.length}</b>}</button>{notificationsOpen && <aside className="notification-popover"><header><div><strong>Kitchen notifications</strong><small>Daily unavailable food</small></div><button onClick={() => setNotificationsOpen(false)}>×</button></header>{unavailableFoods.length === 0 ? <div className="notification-empty"><span>✓</span><p>All kitchen food is available today.</p></div> : <div className="notification-list">{unavailableFoods.map((item) => <button key={item.id} onClick={() => { setActiveView("unavailable"); setNotificationsOpen(false); }}><span>{item.emoji}</span><div><strong>{item.name}</strong><small>{item.category.name} · Unavailable today</small></div><i>!</i></button>)}</div>}<footer><button onClick={() => { setActiveView("unavailable"); setNotificationsOpen(false); }}>View unavailable menu</button></footer></aside>}</div>}<div className="profile"><span>{firstName[0]}</span><div><strong>{user.name || "Team member"}</strong><small>{role}</small></div></div></div>
        </header>
        {error && <div className="app-error">{error}<button onClick={refresh}>Retry</button></div>}
        {role === "ADMIN" && <div className="owner-mode"><span>Owner monitoring mode</span><p>You can view all restaurant activity. Operational changes are handled by the Manager.</p></div>}
        {data.loading ? <div className="loading-view"><span />Loading restaurant data...</div> : <FeatureView view={activeView} onNavigate={setActiveView} data={data} mutate={mutate} readOnly={role === "ADMIN"} role={role} />}
      </section>
    </main>
  );
}

export default Home;
