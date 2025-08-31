import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   Southside Pawn — Single-file React + TypeScript app
   - Admin-only auth (default admin/1234, must change on first login)
   - No hardcoded inventory/users/orders in code (uses localStorage adapter)
   - Public Catalog (shows stock like your preferred style)
   - Animated background hero (set URL in Admin → Settings)
   - Admin Panel: products, orders, applications, business users, settings
   - Product cards support image URL + size (sm/md/lg)
   ========================================================= */

/* -------------------- Types -------------------- */
type Product = {
  id: string;
  name: string;
  description?: string;
  price: number; // in SEK
  stock: number;
  image?: string; // image URL
  cardSize?: "sm" | "md" | "lg"; // visual size
};

type OrderItem = { productId: string; qty: number };

type FulfillmentStatus =
  | "placed"
  | "accepted"
  | "processing"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "fulfilled"
  | "cancelled";

type DeliveryOption = "delivery" | "pickup";

type Invoice = {
  id: string;
  orderId: string;
  business: string; // username
  date: string; // ISO
  total: number;
  paid: boolean;
};

type Order = {
  id: string;
  business: string; // business username placing the order
  items: OrderItem[];
  total: number;
  date: string; // ISO
  status: FulfillmentStatus;
  deliveryOption: DeliveryOption;
  pickupCode?: string; // 6-digit code for pickup
  invoice: Invoice;
};

type Application = {
  id: string;
  fullName: string;
  city: string;
  discordOrEmail: string; // Discord or Email
  ingameName: string;
  phone?: string;
  stateId?: string;
  region: "AU" | "EU" | "NA" | "Other";
  about: string; // Why should you work here + about you
  date: string; // ISO
  status: "new" | "reviewed" | "accepted" | "rejected";
};

type BusinessUser = {
  username: string;
  password: string; // demo only; store hashed in real backend
  displayName: string;
};

type Session =
  | { role: "admin"; username: string }
  | { role: "business"; username: string; displayName: string }
  | null;

/* -------------------- Local Storage Helpers -------------------- */
const LS_KEYS = {
  products: "pawn_products",
  orders: "pawn_orders",
  applications: "pawn_applications",
  businessUsers: "pawn_business_users",
  adminUser: "pawn_admin_user",
  session: "pawn_session",
  theme: "pawn_theme",
  backgroundUrl: "pawn_background_url",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const money = (n: number) =>
  new Intl.NumberFormat("en-SE", { style: "currency", currency: "SEK" }).format(n);

function pickupCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* -------------------- Small UI helpers -------------------- */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-neutral-800 dark:text-neutral-200">
      {children}
    </span>
  );
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none ring-0 transition focus:border-gray-400 focus:ring-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 ${className}`}
        {...rest}
      />
    </label>
  );
}

function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          {label}
        </span>
      )}
      <textarea
        className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none ring-0 transition focus:border-gray-400 focus:ring-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 ${className}`}
        {...rest}
      />
    </label>
  );
}

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  }
) {
  const { variant = "primary", className = "", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary:
      "bg-black text-white hover:bg-gray-900 shadow dark:bg-white dark:text-black dark:hover:bg-neutral-200",
    ghost:
      "bg-transparent text-gray-800 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
  } as const;
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest} />;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
      {children}
    </div>
  );
}

/* -------------------- Root App -------------------- */
export default function PawnshopPortalApp() {
  const [route, setRoute] = useState<
    "catalog" | "adminLogin" | "adminPanel" | "applyJob"
  >("catalog");

  const [session, setSession] = useState<Session>(null);

  // Theme
  const [dark, setDark] = useState<boolean>(load<boolean>(LS_KEYS.theme, true));
  useEffect(() => save(LS_KEYS.theme, dark), [dark]);

  // Background image (animated hero)
  const [bgUrl, setBgUrl] = useState<string>(load<string>(LS_KEYS.backgroundUrl, ""));
  useEffect(() => save(LS_KEYS.backgroundUrl, bgUrl), [bgUrl]);

  // Core data (persisted) — NO HARDCODED SEEDS
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [adminUser, setAdminUser] = useState<{
    username: string;
    password: string;
    mustChange?: boolean;
  }>({ username: "admin", password: "1234", mustChange: true });

  // seed / load
  useEffect(() => {
    const seeded = load<Product[]>(LS_KEYS.products, []);
    const seededOrders = load<Order[]>(LS_KEYS.orders, []);
    const seededApps = load<Application[]>(LS_KEYS.applications, []);
    const seededUsers = load<BusinessUser[]>(LS_KEYS.businessUsers, []);
    const storedAdmin = load<{ username: string; password: string; mustChange?: boolean }>(
      LS_KEYS.adminUser,
      { username: "admin", password: "1234", mustChange: true }
    );
    const seededSession = load<Session>(LS_KEYS.session, null);

    setProducts(seeded);
    setOrders(seededOrders);
    setApplications(seededApps);
    setBusinessUsers(seededUsers);
    setAdminUser(storedAdmin);
    setSession(seededSession);
  }, []);

  // persist on changes
  useEffect(() => save(LS_KEYS.products, products), [products]);
  useEffect(() => save(LS_KEYS.orders, orders), [orders]);
  useEffect(() => save(LS_KEYS.applications, applications), [applications]);
  useEffect(() => save(LS_KEYS.businessUsers, businessUsers), [businessUsers]);
  useEffect(() => save(LS_KEYS.adminUser, adminUser), [adminUser]);
  useEffect(() => save(LS_KEYS.session, session), [session]);

  /* --------------- Actions --------------- */
  const [showPwdModal, setShowPwdModal] = useState(false);

  function loginAdmin(username: string, password: string): string | null {
    const stored = adminUser;
    if (username !== stored.username || password !== stored.password) return "Login failed.";
    setSession({ role: "admin", username });
    setRoute("adminPanel");
    setShowPwdModal(stored.mustChange === true);
    return null;
  }

  function changeAdminPassword(current: string, next: string) {
    if (current !== adminUser.password) return "Current password is incorrect.";
    if (!next || next.length < 4) return "New password must be at least 4 characters.";
    setAdminUser({ username: adminUser.username, password: next, mustChange: false });
    setShowPwdModal(false);
    return null;
  }

  function logout() {
    setSession(null);
    setRoute("catalog");
  }

  function upsertProduct(p: Product) {
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? { ...p } : x)) : [...prev, { ...p }];
    });
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function placeOrder(
    business: string,
    items: OrderItem[],
    deliveryOption: DeliveryOption
  ): string | null {
    // Validate stock
    const insufficient = items.find((it) => {
      const product = products.find((p) => p.id === it.productId);
      return !product || product.stock < it.qty || it.qty <= 0;
    });
    if (insufficient) return "Insufficient stock or invalid quantity.";

    const total = items.reduce((sum, it) => {
      const product = products.find((p) => p.id === it.productId)!;
      return sum + product.price * it.qty;
    }, 0);

    // Decrement stock
    setProducts((prev) =>
      prev.map((p) => {
        const match = items.find((it) => it.productId === p.id);
        return match ? { ...p, stock: p.stock - match.qty } : p;
      })
    );

    const inv: Invoice = {
      id: uid("inv"),
      orderId: "",
      business,
      date: new Date().toISOString(),
      total,
      paid: false,
    };

    const order: Order = {
      id: uid("o"),
      business,
      items: items.map((x) => ({ ...x })),
      total,
      date: new Date().toISOString(),
      status: "placed",
      deliveryOption,
      pickupCode: deliveryOption === "pickup" ? pickupCode() : undefined,
      invoice: inv,
    };
    order.invoice.orderId = order.id;
    setOrders((prev) => [order, ...prev]);
    return null;
  }

  function setOrderStatus(orderId: string, status: FulfillmentStatus) {
    setOrders((prev) => {
      const old = prev.find((o) => o.id === orderId);
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      // Restock if cancelling a previously placed/accepted/processing order
      if (old && ["placed", "accepted", "processing"].includes(old.status) && status === "cancelled") {
        setProducts((pp) =>
          pp.map((p) => {
            const itm = old.items.find((i) => i.productId === p.id);
            return itm ? { ...p, stock: p.stock + itm.qty } : p;
          })
        );
      }
      return next;
    });
  }

  function setOrderDelivery(orderId: string, option: DeliveryOption) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              deliveryOption: option,
              pickupCode: option === "pickup" ? o.pickupCode || pickupCode() : undefined,
            }
          : o
      )
    );
  }

  function setInvoicePaid(orderId: string, paid: boolean) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, invoice: { ...o.invoice, paid } } : o))
    );
  }

  function submitApplication(app: Omit<Application, "id" | "status" | "date">) {
    const newApp: Application = {
      id: uid("a"),
      date: new Date().toISOString(),
      status: "new",
      ...app,
    };
    setApplications((prev) => [newApp, ...prev]);
  }

  /* --------------- Pages --------------- */
  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
        <TopNav
          route={route}
          onNavigate={setRoute}
          session={session}
          onLogout={logout}
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
        />

        {/* Global style injector for animations */}
        <StyleInjector />

        <main className="mx-auto max-w-6xl px-4 py-6">
          {route === "catalog" && (
            <Catalog
              products={products}
              onApply={() => setRoute("applyJob")}
              backgroundUrl={bgUrl}
            />
          )}

          {route === "adminLogin" && (
            <AdminLogin onLogin={loginAdmin} onBack={() => setRoute("catalog")} />
          )}

          {route === "adminPanel" && session?.role === "admin" && (
            <AdminPanel
              products={products}
              orders={orders}
              applications={applications}
              businessUsers={businessUsers}
              adminUser={adminUser}
              onUpsertProduct={upsertProduct}
              onDeleteProduct={deleteProduct}
              onOrderStatus={setOrderStatus}
              onOrderDelivery={setOrderDelivery}
              onInvoicePaid={setInvoicePaid}
              onSetApplications={setApplications}
              onSetBusinessUsers={setBusinessUsers}
              onSetAdminUser={setAdminUser}
              backgroundUrl={bgUrl}
              onSetBackgroundUrl={setBgUrl}
            />
          )}

          {route === "applyJob" && (
            <ApplyPage onSubmit={submitApplication} onBack={() => setRoute("catalog")} />
          )}
        </main>

        {showPwdModal && (
          <PasswordModal onClose={() => setShowPwdModal(false)} onChange={changeAdminPassword} />
        )}

        <Footer />
      </div>
    </div>
  );
}

/* -------------------- Layout Components -------------------- */
function TopNav({
  route,
  onNavigate,
  session,
  onLogout,
  dark,
  onToggleDark,
}: {
  route: string;
  onNavigate: (r: any) => void;
  session: Session;
  onLogout: () => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-neutral-800 dark:bg-neutral-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white shadow dark:bg-white dark:text-black">
            💰
          </div>
          <div className="leading-tight">
            <div className="text-xl font-extrabold tracking-tight">SOUTHSIDE PAWN</div>
            <div className="text-[11px] font-medium uppercase text-gray-500 dark:text-neutral-400">
              Buy • Pawn • Sell
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button
            variant={route === "catalog" ? "primary" : "ghost"}
            onClick={() => onNavigate("catalog")}
          >
            Catalog
          </Button>
          <Button
            variant={route === "applyJob" ? "primary" : "ghost"}
            onClick={() => onNavigate("applyJob")}
          >
            Apply for Job
          </Button>

          {session?.role === "admin" ? (
            <>
              <Button
                variant={route === "adminPanel" ? "primary" : "ghost"}
                onClick={() => onNavigate("adminPanel")}
              >
                Admin
              </Button>
              <Button variant="ghost" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onNavigate("adminLogin")}>
              Admin Login
            </Button>
          )}

          {/* Dark mode toggle */}
          <Button variant="ghost" onClick={onToggleDark} aria-label="Toggle dark mode">
            {dark ? "☀️ Light" : "🌙 Dark"}
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white/70 dark:border-neutral-800 dark:bg-neutral-950/70">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 dark:text-neutral-400">
        © {new Date().getFullYear()} Southside Pawn • Demo front-end using localStorage. Connect a
        backend for production use.
      </div>
    </footer>
  );
}

/* -------------------- Public Catalog -------------------- */
function Catalog({
  products,
  onApply,
  backgroundUrl,
}: {
  products: Product[];
  onApply: () => void;
  backgroundUrl?: string;
}) {
  return (
    <div className="space-y-6">
      {/* Hero with animated background */}
      <BackgroundHero backgroundUrl={backgroundUrl}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between animate-[pop_.4s_ease]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Catalog</h1>
            <p className="text-gray-100/90">
              Browse our current stock and prices. Businesses can log in to place orders.
            </p>
          </div>
          <Button onClick={onApply}>Apply to work here</Button>
        </div>
      </BackgroundHero>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="group">
            <div className="flex flex-col gap-2">
              {p.image && (
                <div
                  className={`overflow-hidden rounded-xl ${
                    p.cardSize === "lg" ? "h-48" : p.cardSize === "sm" ? "h-28" : "h-36"
                  }`}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{p.name}</div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-neutral-800 dark:text-neutral-200">
                  {p.stock} in stock
                </span>
              </div>
              {p.description && (
                <div className="text-sm text-gray-600 dark:text-neutral-400">{p.description}</div>
              )}
              <div className="mt-1 text-xl font-bold">{money(p.price)}</div>
              <div className="pt-1 text-[10px] text-gray-400">ID: {p.id}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Admin Login & Panel -------------------- */
function AdminLogin({
  onLogin,
  onBack,
}: {
  onLogin: (u: string, p: string) => string | null;
  onBack: () => void;
}) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h2 className="mb-4 text-xl font-bold">Admin Login</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(onLogin(u, p));
          }}
          method="post"
          action="/login"
          autoComplete="on"
        >
          <div className="space-y-3">
            <TextInput
              label="Username"
              name="username"
              autoComplete="username"
              value={u}
              onChange={(e) => setU(e.target.value)}
            />
            <TextInput
              label="Password"
              type="password"
              name="current-password"
              autoComplete="current-password"
              value={p}
              onChange={(e) => setP(e.target.value)}
            />
            {err && (
              <div className="rounded-xl bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {err}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit">Login</Button>
              <Button variant="ghost" onClick={onBack} type="button">
                Back
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-500">
              First run default is <b>admin</b> / <b>1234</b>. You will be asked to change it.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

function PasswordModal({
  onClose,
  onChange,
}: {
  onClose: () => void;
  onChange: (current: string, next: string) => string | null;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-3 text-lg font-bold">Change Admin Password</h3>
        <p className="mb-3 text-sm text-gray-600 dark:text-neutral-400">
          For security, please update your password now.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (next !== confirm) {
              setErr("Passwords do not match.");
              return;
            }
            const res = onChange(current, next);
            if (res) setErr(res);
          }}
          method="post"
          action="/change-password"
          autoComplete="on"
        >
          <div className="space-y-3">
            <TextInput
              label="Current Password"
              type="password"
              name="current-password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <TextInput
              label="New Password"
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <TextInput
              label="Confirm New Password"
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {err && (
              <div className="rounded-xl bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {err}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={onClose}>
                Later
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({
  products,
  orders,
  applications,
  businessUsers,
  adminUser,
  onUpsertProduct,
  onDeleteProduct,
  onOrderStatus,
  onOrderDelivery,
  onInvoicePaid,
  onSetApplications,
  onSetBusinessUsers,
  onSetAdminUser,
  backgroundUrl,
  onSetBackgroundUrl,
}: {
  products: Product[];
  orders: Order[];
  applications: Application[];
  businessUsers: BusinessUser[];
  adminUser: { username: string; password: string; mustChange?: boolean };
  onUpsertProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onOrderStatus: (id: string, s: FulfillmentStatus) => void;
  onOrderDelivery: (id: string, option: DeliveryOption) => void;
  onInvoicePaid: (id: string, paid: boolean) => void;
  onSetApplications: (apps: Application[]) => void;
  onSetBusinessUsers: (users: BusinessUser[]) => void;
  onSetAdminUser: (u: { username: string; password: string; mustChange?: boolean }) => void;
  backgroundUrl?: string;
  onSetBackgroundUrl?: (url: string) => void;
}) {
  const [tab, setTab] = useState<"products" | "orders" | "applications" | "users" | "settings">(
    "products"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Manage prices, stock, orders, invoices, applications, and business accounts.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "products" ? "primary" : "ghost"} onClick={() => setTab("products")}>
          Products
        </Button>
        <Button variant={tab === "orders" ? "primary" : "ghost"} onClick={() => setTab("orders")}>
          Orders
        </Button>
        <Button
          variant={tab === "applications" ? "primary" : "ghost"}
          onClick={() => setTab("applications")}
        >
          Applications
        </Button>
        <Button variant={tab === "users" ? "primary" : "ghost"} onClick={() => setTab("users")}>
          Business Users
        </Button>
        <Button variant={tab === "settings" ? "primary" : "ghost"} onClick={() => setTab("settings")}>
          Settings
        </Button>
      </div>

      {tab === "products" && (
        <ProductsTab products={products} onUpsert={onUpsertProduct} onDelete={onDeleteProduct} />
      )}

      {tab === "orders" && (
        <OrdersTab
          products={products}
          orders={orders}
          onSetStatus={onOrderStatus}
          onSetDelivery={onOrderDelivery}
          onSetInvoicePaid={onInvoicePaid}
        />
      )}

      {tab === "applications" && (
        <ApplicationsTab apps={applications} onSetApps={onSetApplications} />
      )}

      {tab === "users" && <UsersTab users={businessUsers} onSetUsers={onSetBusinessUsers} />}

      {tab === "settings" && (
        <SettingsTab
          adminUser={adminUser}
          onSetAdminUser={onSetAdminUser}
          backgroundUrl={backgroundUrl}
          onSetBackgroundUrl={onSetBackgroundUrl}
        />
      )}
    </div>
  );
}

function ProductsTab({
  products,
  onUpsert,
  onDelete,
}: {
  products: Product[];
  onUpsert: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const empty: Product = {
    id: "",
    name: "",
    price: 0,
    stock: 0,
    description: "",
    image: "",
    cardSize: "md",
  };
  const [form, setForm] = useState<Product>(empty);

  function submit() {
    const id = form.id || uid("p");
    const price = Number(form.price) || 0;
    const stock = Math.max(0, Number(form.stock) || 0);
    onUpsert({ ...form, id, price, stock, cardSize: form.cardSize || "md" });
    setForm(empty);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <h3 className="mb-3 text-lg font-semibold">Add / Edit Product</h3>
        <div className="space-y-3">
          <TextInput
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextInput
            label="Image URL"
            value={form.image || ""}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
              Card Size
            </span>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              value={form.cardSize || "md"}
              onChange={(e) =>
                setForm({ ...form, cardSize: e.target.value as Product["cardSize"] })
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
          <TextInput
            label="Price (SEK)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <TextInput
            label="Stock"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
          />
          <div className="flex items-center gap-2">
            <Button onClick={submit}>{form.id ? "Update" : "Create"}</Button>
            {form.id && (
              <Button variant="ghost" onClick={() => setForm(empty)}>
                Cancel
              </Button>
            )}
          </div>
          {form.id && (
            <div className="text-xs text-gray-500 dark:text-neutral-500">Editing ID: {form.id}</div>
          )}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold">All Products</h3>
        <div className="divide-y rounded-2xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800">
          <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-600 dark:bg-neutral-900 dark:text-neutral-300">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Stock</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>
          {products.map((p) => (
            <div key={p.id} className="grid grid-cols-12 items-center gap-2 p-3">
              <div className="col-span-4">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-600 dark:text-neutral-400">{p.description}</div>
                <div className="text-[10px] text-gray-400 dark:text-neutral-600">{p.id}</div>
              </div>
              <div className="col-span-2">{money(p.price)}</div>
              <div className="col-span-2">{p.stock}</div>
              <div className="col-span-4 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setForm(p)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => onDelete(p.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function OrdersTab({
  products,
  orders,
  onSetStatus,
  onSetDelivery,
  onSetInvoicePaid,
}: {
  products: Product[];
  orders: Order[];
  onSetStatus: (id: string, s: FulfillmentStatus) => void;
  onSetDelivery: (id: string, o: DeliveryOption) => void;
  onSetInvoicePaid: (id: string, paid: boolean) => void;
}) {
  function nameFor(pid: string) {
    return products.find((p) => p.id === pid)?.name || pid;
  }
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold">Orders</h3>
      {orders.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-neutral-500">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-gray-200 p-3 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{o.business}</div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">
                  {new Date(o.date).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1 text-sm">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>
                        {nameFor(it.productId)}{" "}
                        <span className="text-gray-500 dark:text-neutral-500">× {it.qty}</span>
                      </span>
                      <span className="font-medium">
                        {money(
                          (products.find((p) => p.id === it.productId)?.price || 0) * it.qty
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2 dark:bg-neutral-900">
                    <span className="text-sm text-gray-600 dark:text-neutral-400">Total</span>
                    <span className="text-lg font-bold">{money(o.total)}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <select
                      className="rounded-xl border border-gray-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      value={o.status}
                      onChange={(e) => onSetStatus(o.id, e.target.value as FulfillmentStatus)}
                    >
                      <option value="placed">Placed</option>
                      <option value="accepted">Accepted</option>
                      <option value="processing">Processing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="ready_for_pickup">Ready for Pickup</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      className="rounded-xl border border-gray-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      value={o.deliveryOption}
                      onChange={(e) => onSetDelivery(o.id, e.target.value as DeliveryOption)}
                    >
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </select>

                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={o.invoice.paid}
                        onChange={(e) => onSetInvoicePaid(o.id, e.target.checked)}
                      />
                      Invoice Paid
                    </label>
                  </div>
                  {o.pickupCode && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-2 text-sm dark:border-neutral-700">
                      Pickup code: <b>{o.pickupCode}</b>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge>Order #{o.id}</Badge>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => window.alert(renderInvoiceText(o))}>
                    View Invoice
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ApplicationsTab({
  apps,
  onSetApps,
}: {
  apps: Application[];
  onSetApps: (a: Application[]) => void;
}) {
  function setStatus(id: string, status: Application["status"]) {
    onSetApps(apps.map((a) => (a.id === id ? { ...a, status } : a)));
  }
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold">Job Applications</h3>
      {apps.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-neutral-500">No applications yet.</div>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="rounded-2xl border border-gray-200 p-3 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{a.fullName}</div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">
                  {new Date(a.date).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-neutral-200">
                <div className="text-gray-600 dark:text-neutral-400">
                  City: {a.city} · Contact: {a.discordOrEmail} · In-game: {a.ingameName}
                </div>
                <div className="text-gray-600 dark:text-neutral-400">
                  Phone: {a.phone || "—"} · State ID: {a.stateId || "—"} · Region: {a.region}
                </div>
                <div className="mt-2 whitespace-pre-wrap">{a.about}</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge>Status: {a.status}</Badge>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-xl border border-gray-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value as Application["status"])}
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function UsersTab({
  users,
  onSetUsers,
}: {
  users: BusinessUser[];
  onSetUsers: (u: BusinessUser[]) => void;
}) {
  const empty: BusinessUser = { username: "", password: "", displayName: "" };
  const [form, setForm] = useState<BusinessUser>(empty);

  function submit() {
    if (!form.username || !form.password || !form.displayName) return;
    const exists = users.some((u) => u.username === form.username);
    const next = exists
      ? users.map((u) => (u.username === form.username ? { ...form } : u))
      : [...users, { ...form }];
    onSetUsers(next);
    setForm(empty);
  }

  function remove(username: string) {
    onSetUsers(users.filter((u) => u.username !== username));
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <h3 className="mb-3 text-lg font-semibold">Add / Edit Business User</h3>
        <div className="space-y-3">
          <TextInput
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <TextInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <TextInput
            label="Display Name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Button onClick={submit}>
              {users.some((u) => u.username === form.username) ? "Update" : "Create"}
            </Button>
            {form.username && (
              <Button variant="ghost" onClick={() => setForm(empty)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold">All Business Users</h3>
        <div className="divide-y rounded-2xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800">
          <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-600 dark:bg-neutral-900 dark:text-neutral-300">
            <div className="col-span-4">Username</div>
            <div className="col-span-4">Display Name</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>
          {users.map((u) => (
            <div key={u.username} className="grid grid-cols-12 items-center gap-2 p-3">
              <div className="col-span-4">{u.username}</div>
              <div className="col-span-4">{u.displayName}</div>
              <div className="col-span-4 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setForm(u)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => remove(u.username)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SettingsTab({
  adminUser,
  onSetAdminUser,
  backgroundUrl,
  onSetBackgroundUrl,
}: {
  adminUser: { username: string; password: string; mustChange?: boolean };
  onSetAdminUser: (u: { username: string; password: string; mustChange?: boolean }) => void;
  backgroundUrl?: string;
  onSetBackgroundUrl?: (u: string) => void;
}) {
  const [form, setForm] = useState(adminUser);
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold">Settings</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TextInput
          label="Admin Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <TextInput
          label="Admin Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="flex items-end">
          <Button onClick={() => onSetAdminUser(form)}>Save</Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <TextInput
            label="Background Image URL (shop photo)"
            value={backgroundUrl || ""}
            onChange={(e) => onSetBackgroundUrl && onSetBackgroundUrl(e.target.value)}
            placeholder="Paste your shop image URL here"
          />
        </div>
        <div className="flex items-end">
          <Button variant="ghost" onClick={() => onSetBackgroundUrl && onSetBackgroundUrl("")}>
            Clear
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-neutral-500">
        Passwords & settings are stored in <code>localStorage</code> for the demo. Replace with a
        backend for production.
      </p>
    </Card>
  );
}

/* -------------------- Job Application Page -------------------- */
function ApplyPage({
  onSubmit,
  onBack,
}: {
  onSubmit: (a: Omit<Application, "id" | "status" | "date">) => void;
  onBack: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [discordOrEmail, setDiscordOrEmail] = useState("");
  const [ingameName, setIngameName] = useState("");
  const [phone, setPhone] = useState("");
  const [stateId, setStateId] = useState("");
  const [region, setRegion] = useState<Application["region"]>("EU");
  const [about, setAbout] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    if (!fullName || !discordOrEmail || !ingameName || !about) return;
    onSubmit({ fullName, city, discordOrEmail, ingameName, phone, stateId, region, about });
    setDone(true);
    setFullName("");
    setCity("");
    setDiscordOrEmail("");
    setIngameName("");
    setPhone("");
    setStateId("");
    setRegion("EU");
    setAbout("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Apply for Job</h1>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      {done && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          Application sent! We'll get back to you soon.
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <TextInput label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <TextInput
            label="Discord or Email"
            value={discordOrEmail}
            onChange={(e) => setDiscordOrEmail(e.target.value)}
          />
          <TextInput
            label="In-game Name"
            value={ingameName}
            onChange={(e) => setIngameName(e.target.value)}
          />
          <TextInput label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextInput label="State ID (optional)" value={stateId} onChange={(e) => setStateId(e.target.value)} />
          <div className="md:col-span-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
                Region
              </span>
              <select
                className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                value={region}
                onChange={(e) => setRegion(e.target.value as Application["region"])}
              >
                <option value="AU">AU</option>
                <option value="EU">EU</option>
                <option value="NA">NA</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>
          <div className="md:col-span-2">
            <TextArea
              label="Why should you work here? Tell us about you"
              rows={6}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-end">
            <Button onClick={submit}>Submit Application</Button>
          </div>
        </div>
      </Card>

      <div className="text-sm text-gray-500 dark:text-neutral-500">
        Admin can review applications under the <b>Applications</b> tab.
      </div>
    </div>
  );
}

/* -------------------- Animated Background Components & Styles -------------------- */
function StyleInjector() {
  return (
    <style>{`
      @keyframes panZoom { 0% { transform: scale(1) translateY(0); } 100% { transform: scale(1.08) translateY(-2%); } }
      @keyframes neonFlicker { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; } 20%, 24%, 55% { opacity: .4; } }
      @keyframes sweep { 0% {transform: translateX(-100%);} 100% {transform: translateX(100%);} }
      @keyframes pop { 0% { transform: scale(.9); opacity:.3 } 60% { transform: scale(1.04); opacity:1 } 100% { transform: scale(1); } }
      @keyframes floatUp { 0% { transform: translateY(6px); opacity: 0 } 100% { transform: translateY(-8px); opacity: 1 } }
      @keyframes pulseBorder { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.5) } 100% { box-shadow: 0 0 0 12px rgba(34,197,94,0) } }
    `}</style>
  );
}

function BackgroundHero({
  backgroundUrl,
  children,
}: {
  backgroundUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-800">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: backgroundUrl
            ? `url(${backgroundUrl})`
            : "linear-gradient(135deg, #111 0%, #333 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.05)",
          animation: "panZoom 20s ease-in-out infinite alternate",
        }}
      />
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/40" />
      {/* neon sign glow bar */}
      <div
        className="pointer-events-none absolute left-4 top-4 h-10 w-64 rounded-md bg-yellow-300/70 blur-md"
        style={{ animation: "neonFlicker 6s infinite" }}
      />
      {/* moving light sweep */}
      <div className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/5" style={{ animation: "sweep 9s linear infinite" }} />
      <div className="relative z-10 p-6 text-white">{children}</div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */
function labelForStatus(s: FulfillmentStatus) {
  switch (s) {
    case "placed":
      return "Placed";
    case "accepted":
      return "Accepted";
    case "processing":
      return "Processing";
    case "out_for_delivery":
      return "Out for Delivery";
    case "ready_for_pickup":
      return "Ready for Pickup";
    case "fulfilled":
      return "Fulfilled";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

function renderInvoiceText(o: Order) {
  const lines = o.items.map((it) => ` - ${it.qty} × ${it.productId}`).join("\n");
  return `INVOICE ${o.invoice.id}
Business: ${o.business}
Date: ${new Date(o.invoice.date).toLocaleString()}
Order: ${o.id}
Items:
${lines}
Total: ${money(o.total)}
Paid: ${o.invoice.paid ? "Yes" : "No"}`;
}
