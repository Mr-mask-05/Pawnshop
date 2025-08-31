import React, { useEffect, useState } from "react";

/**
 * Southside Pawn – Full Single-File Portal (TypeScript + React)
 * - Unified login (Staff + Business)
 * - Account panel: change email/password after login
 * - Catalog (public prices, no stock shown)
 * - Business portal: cart, discounts, delivery/pickup, stock decrement, invoice & status
 * - Staff site: products CRUD, orders, businesses + sub-accounts, applications, settings
 * - Role-based staff tabs (owner/manager/inventory/orders/viewer)
 * - Dark mode toggle
 * - LocalStorage persistence
 * - Safe ID generator (no Math.random)
 * - NO forgot-password flow
 */

/* ================== Safe ID ================== */
let __idCounter = 0;
(function initCounter() {
  try {
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem("__app_id_counter")
        : null;
    __idCounter = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    __idCounter = 0;
  }
})();
function nextId(prefix = "id"): string {
  const ts = Date.now().toString(36);
  __idCounter = (__idCounter + 1) % 1_000_000_000;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("__app_id_counter", String(__idCounter));
    }
  } catch {}
  return `${prefix}_${ts}_${__idCounter.toString(36)}`;
}

/* ================== Types ================== */
type StaffRole = "owner" | "manager" | "inventory" | "orders" | "viewer";
type BizRole = "owner" | "manager" | "employee";

type Product = {
  id: string;
  name: string;
  description?: string;
  publicPrice: number;
  businessPrice: number;
  stock: number;
  image?: string;
  cardSize?: "sm" | "md" | "lg";
};

type OrderItem = { productId: string; qty: number };
type DeliveryOption = "pickup" | "delivery";
type FulfillmentStatus =
  | "placed"
  | "accepted"
  | "processing"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "fulfilled"
  | "cancelled";

type Invoice = { id: string; date: string; paid: boolean; total: number };
type Order = {
  id: string;
  businessId: string;
  placedBy: string;
  items: OrderItem[];
  total: number;
  status: FulfillmentStatus;
  delivery: DeliveryOption;
  pickupCode?: string;
  invoice: Invoice;
  createdAt: string;
};

type Application = {
  id: string;
  inGameFullName: string;
  discordOrEmail: string;
  phone?: string;
  stateId?: string;
  region: "AU" | "EU" | "NA" | "Other";
  about: string;
  moreThan5Hours: boolean;
  date: string;
  status: "new" | "reviewed" | "accepted" | "rejected";
};

type Business = { id: string; name: string; discountPct: number };

type BusinessUser = {
  username: string;
  password: string;
  displayName: string;
  role: BizRole;
  businessId: string;
  email?: string;
};

type StaffUser = {
  username: string;
  password: string;
  role: StaffRole;
  email?: string;
};

type Session =
  | { role: "staff"; username: string; staffRole: StaffRole }
  | {
      role: "business";
      username: string;
      businessId: string;
      bizRole: BizRole;
      displayName: string;
    }
  | null;

/* ================== Storage Keys ================== */
const LS = {
  products: "pawn_products",
  orders: "pawn_orders",
  applications: "pawn_applications",
  businesses: "pawn_businesses",
  businessUsers: "pawn_business_users",
  staffUsers: "pawn_staff_users",
  session: "pawn_session",
  theme: "pawn_theme",
  background: "pawn_bg",
} as const;

function load<T>(k: string, d: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : d;
  } catch {
    return d;
  }
}
function save<T>(k: string, v: T) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

const money = (n: number) =>
  new Intl.NumberFormat("en-SE", { style: "currency", currency: "SEK" }).format(
    n
  );

/* ================== UI Primitives ================== */
function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  }
) {
  const { variant = "primary", className = "", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60";
  const s = {
    primary:
      "bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black",
    ghost:
      "bg-transparent text-gray-800 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
  } as const;
  return <button className={`${base} ${s[variant]} ${className}`} {...rest} />;
}
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  );
}
function TextInput(
  p: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, ...rest } = p;
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          {label}
        </span>
      )}
      <input
        {...rest}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </label>
  );
}
function TextArea(
  p: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, ...rest } = p;
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          {label}
        </span>
      )}
      <textarea
        {...rest}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </label>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-neutral-800 dark:text-neutral-200">
      {children}
    </span>
  );
}

/* ================== Root App ================== */
export default function App() {
  const [dark, setDark] = useState(load(LS.theme, true));
  useEffect(() => save(LS.theme, dark), [dark]);

  const [bgUrl, setBgUrl] = useState(load(LS.background, ""));
  useEffect(() => save(LS.background, bgUrl), [bgUrl]);

  const [route, setRoute] =
    useState<"catalog" | "login" | "portal" | "apply">("catalog");
  const [session, setSession] = useState<Session>(load(LS.session, null));
  useEffect(() => save(LS.session, session), [session]);

  // Data
  const [products, setProducts] = useState<Product[]>(load(LS.products, []));
  useEffect(() => save(LS.products, products), [products]);

  const [orders, setOrders] = useState<Order[]>(load(LS.orders, []));
  useEffect(() => save(LS.orders, orders), [orders]);

  const [applications, setApplications] = useState<Application[]>(
    load(LS.applications, [])
  );
  useEffect(() => save(LS.applications, applications), [applications]);

  const [businesses, setBusinesses] = useState<Business[]>(
    load(LS.businesses, [])
  );
  useEffect(() => save(LS.businesses, businesses), [businesses]);

  const [bizUsers, setBizUsers] = useState<BusinessUser[]>(
    load(LS.businessUsers, [])
  );
  useEffect(() => save(LS.businessUsers, bizUsers), [bizUsers]);

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(
    load(LS.staffUsers, [{ username: "admin", password: "1234", role: "owner" }])
  );
  useEffect(() => save(LS.staffUsers, staffUsers), [staffUsers]);

  // Auto-delete rejected apps older than 2 days
  useEffect(() => {
    const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const next = applications.filter(
      (a) => !(a.status === "rejected" && new Date(a.date).getTime() < cutoff)
    );
    if (next.length !== applications.length) setApplications(next);
  }, [applications]);

  function logout() {
    setSession(null);
    setRoute("catalog");
  }

  // --------- Auth (no forgot-password) ---------
  function login(username: string, password: string): string | null {
    const s = staffUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (s) {
      setSession({ role: "staff", username: s.username, staffRole: s.role });
      setRoute("portal");
      return null;
    }
    const b = bizUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (b) {
      setSession({
        role: "business",
        username: b.username,
        businessId: b.businessId,
        bizRole: b.role,
        displayName: b.displayName,
      });
      setRoute("portal");
      return null;
    }
    return "Invalid credentials.";
  }

  function updateAccount(patch: {
    email?: string;
    password?: string;
  }): string | null {
    if (!session) return "Not logged in";
    if (session.role === "staff") {
      const next = staffUsers.map((u) =>
        u.username === session.username ? { ...u, ...patch } : u
      );
      setStaffUsers(next);
      return null;
    }
    const next = bizUsers.map((u) =>
      u.username === session.username ? { ...u, ...patch } : u
    );
    setBizUsers(next);
    return null;
  }

  // --------- Orders (place & manage) ---------
  function placeOrder(items: OrderItem[], opt: DeliveryOption): string | null {
    if (session?.role !== "business") return "Not logged in as business";
    // stock check
    for (const it of items) {
      const p = products.find((x) => x.id === it.productId);
      if (!p || it.qty <= 0 || p.stock < it.qty) return "Invalid qty/stock";
    }
    const biz = businesses.find((b) => b.id === session.businessId);
    const discount = biz ? biz.discountPct : 0;
    const total = items.reduce((s, it) => {
      const p = products.find((x) => x.id === it.productId)!;
      const price = p.businessPrice * (1 - discount / 100);
      return s + price * it.qty;
    }, 0);
    setProducts((prev) =>
      prev.map((p) => {
        const m = items.find((i) => i.productId === p.id);
        return m ? { ...p, stock: p.stock - m.qty } : p;
      })
    );
    const o: Order = {
      id: nextId("ord"),
      businessId: session.businessId,
      placedBy: session.username,
      items: items.map((i) => ({ ...i })),
      total,
      status: "placed",
      delivery: opt,
      pickupCode:
        opt === "pickup" ? String(100000 + (__idCounter % 900000)) : undefined,
      invoice: {
        id: nextId("inv"),
        date: new Date().toISOString(),
        paid: false,
        total,
      },
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [o, ...prev]);
    return null;
  }
  function setOrderStatus(id: string, s: FulfillmentStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: s } : o))
    );
  }
  function setInvoicePaid(id: string, paid: boolean) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, invoice: { ...o.invoice, paid } } : o
      )
    );
  }

  // --------- Products ---------
  function upsertProduct(p: Product) {
    setProducts((prev) =>
      prev.some((x) => x.id === p.id)
        ? prev.map((x) => (x.id === p.id ? { ...p } : x))
        : [...prev, { ...p, id: p.id || nextId("prod") }]
    );
  }
  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // --------- Businesses + users ---------
  function upsertBusiness(b: Business) {
    setBusinesses((prev) =>
      prev.some((x) => x.id === b.id)
        ? prev.map((x) => (x.id === b.id ? { ...b } : x))
        : [...prev, { ...b, id: b.id || nextId("biz") }]
    );
  }
  function deleteBusiness(id: string) {
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    setBizUsers((prev) => prev.filter((u) => u.businessId !== id));
  }
  function upsertBizUser(u: BusinessUser) {
    setBizUsers((prev) =>
      prev.some((x) => x.username === u.username)
        ? prev.map((x) => (x.username === u.username ? { ...u } : x))
        : [...prev, u]
    );
  }
  function deleteBizUser(username: string) {
    setBizUsers((prev) => prev.filter((u) => u.username !== username));
  }

  // --------- Applications ---------
  function submitApplication(a: Omit<Application, "id" | "date" | "status">) {
    const app: Application = {
      id: nextId("app"),
      date: new Date().toISOString(),
      status: "new",
      ...a,
    };
    setApplications((prev) => [app, ...prev]);
  }
  function setAppStatus(id: string, status: Application["status"]) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
                💰
              </div>
              <div className="leading-tight">
                <div className="text-xl font-extrabold">SOUTHSIDE PAWN</div>
                <div className="text-[12px] text-gray-500 dark:text-neutral-400">
                  Catalog • Orders • Hiring
                </div>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Button
                variant={route === "catalog" ? "primary" : "ghost"}
                onClick={() => setRoute("catalog")}
              >
                Catalog
              </Button>
              <Button
                variant={route === "apply" ? "primary" : "ghost"}
                onClick={() => setRoute("apply")}
              >
                Apply
              </Button>
              {!session && (
                <Button
                  variant={route === "login" ? "primary" : "ghost"}
                  onClick={() => setRoute("login")}
                >
                  Login
                </Button>
              )}
              {session && (
                <Button
                  variant={route === "portal" ? "primary" : "ghost"}
                  onClick={() => setRoute("portal")}
                >
                  Portal
                </Button>
              )}
              {session && (
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDark((d) => !d)}>
                {dark ? "☀️ Light" : "🌙 Dark"}
              </Button>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6">
          {route === "catalog" && <Catalog products={products} bgUrl={bgUrl} />}

          {route === "login" && (
            <LoginPage onLogin={login} onBack={() => setRoute("catalog")} />
          )}

          {route === "portal" && session?.role === "staff" && (
            <StaffSite
              session={session}
              products={products}
              orders={orders}
              applications={applications}
              onUpsertProduct={upsertProduct}
              onDeleteProduct={deleteProduct}
              onSetStatus={setOrderStatus}
              onSetInvoicePaid={setInvoicePaid}
              onSetAppStatus={setAppStatus}
              businesses={businesses}
              bizUsers={bizUsers}
              onUpsertBusiness={upsertBusiness}
              onDeleteBusiness={deleteBusiness}
              onUpsertBizUser={upsertBizUser}
              onDeleteBizUser={deleteBizUser}
              onUpdateAccount={updateAccount}
              bgUrl={bgUrl}
              onSetBgUrl={setBgUrl}
            />
          )}

          {route === "portal" && session?.role === "business" && (
            <BusinessPortal
              session={session as Extract<Session, { role: "business" }>}
              products={products}
              businesses={businesses}
              orders={orders.filter((o) => o.businessId === session.businessId)}
              onPlaceOrder={placeOrder}
              onUpdateAccount={updateAccount}
            />
          )}

          {route === "apply" && <ApplyPage onSubmit={submitApplication} />}
        </main>
      </div>
    </div>
  );
}
/* ================== Screens ================== */
function Catalog({
  products,
  bgUrl,
}: {
  products: Product[];
  bgUrl?: string;
}) {
  return (
    <div className="space-y-6">
      <Hero bgUrl={bgUrl}>
        <h1 className="text-3xl font-extrabold">Shop Catalog</h1>
        <p className="text-white/90">Public prices only (no stock shown)</p>
      </Hero>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="group">
            {p.image && (
              <div
                className={`overflow-hidden rounded-xl ${
                  p.cardSize === "lg" ? "h-52" : p.cardSize === "sm" ? "h-28" : "h-40"
                }`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <div className="font-semibold">{p.name}</div>
            </div>
            {p.description && (
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                {p.description}
              </div>
            )}
            <div className="mt-1 text-xl font-bold">{money(p.publicPrice)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoginPage({
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
        <h2 className="mb-4 text-xl font-bold">Login</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(onLogin(u, p));
          }}
        >
          <TextInput
            label="Username"
            value={u}
            onChange={(e) => setU(e.target.value)}
          />
          <TextInput
            label="Password"
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
          />
          {err && <div className="mt-2 text-sm text-red-500">{err}</div>}
          <div className="mt-3 flex items-center justify-between">
            <Button type="submit">Login</Button>
            <Button variant="ghost" type="button" onClick={onBack}>
              Back
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function BusinessPortal({
  session,
  products,
  businesses,
  orders,
  onPlaceOrder,
  onUpdateAccount,
}: {
  session: Extract<Session, { role: "business" }>;
  products: Product[];
  businesses: Business[];
  orders: Order[];
  onPlaceOrder: (items: OrderItem[], opt: DeliveryOption) => string | null;
  onUpdateAccount: (p: { email?: string; password?: string }) => string | null;
}) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const biz = businesses.find((b) => b.id === session.businessId);
  const discount = biz?.discountPct || 0;
  const linePrice = (pid: string) => {
    const p = products.find((pp) => pp.id === pid);
    return p ? p.businessPrice * (1 - discount / 100) : 0;
  };
  const total = cart.reduce((s, l) => s + linePrice(l.productId) * l.qty, 0);
  function add(pid: string, qty: number) {
    if (qty <= 0) return;
    setCart((prev) => {
      const ex = prev.find((l) => l.productId === pid);
      return ex
        ? prev.map((l) =>
            l.productId === pid ? { ...l, qty: l.qty + qty } : l
          )
        : [...prev, { productId: pid, qty }];
    });
  }

  return (
    <div className="space-y-6">
      <AccountPanel username={session.username} onUpdate={onUpdateAccount} />

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Inventory</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center gap-3">
                {p.image && (
                  <img
                    src={p.image}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600 dark:text-neutral-400">
                    {money(linePrice(p.id))} • Stock: {p.stock}
                  </div>
                </div>
              </div>
              <AddToCart max={p.stock} onAdd={(q) => add(p.id, q)} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Checkout</h3>
        {cart.length === 0 ? (
          <div className="text-sm text-gray-500">Cart is empty.</div>
        ) : (
          <div className="space-y-3">
            {cart.map((l) => {
              const p = products.find((pp) => pp.id === l.productId)!;
              return (
                <div
                  key={l.productId}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-neutral-800"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600 dark:text-neutral-400">
                      {money(linePrice(p.id))} each
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={p.stock}
                      value={l.qty}
                      onChange={(e) =>
                        setCart((prev) =>
                          prev.map((x) =>
                            x.productId === l.productId
                              ? {
                                  ...x,
                                  qty: Math.max(
                                    1,
                                    Math.min(Number(e.target.value) || 1, p.stock)
                                  ),
                                }
                              : x
                          )
                        )
                      }
                      className="w-20 rounded-xl border border-gray-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <div className="w-28 text-right font-semibold">
                      {money(linePrice(p.id) * l.qty)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t pt-3 dark:border-neutral-800">
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                Total
              </div>
              <div className="text-lg font-bold">{money(total)}</div>
            </div>
            <PlaceOrderBar
              onPlace={(opt) => {
                const err = onPlaceOrder(cart, opt);
                if (err) alert(err);
                else setCart([]);
              }}
            />
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Company Orders</h3>
        {orders.length === 0 ? (
          <div className="text-sm text-gray-500">No orders yet.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-gray-200 p-3 dark:border-neutral-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">Order #{o.id}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">
                  Status: <b>{prettyStatus(o.status)}</b> •{" "}
                  {o.delivery === "pickup"
                    ? o.pickupCode
                      ? `Pickup code: ${o.pickupCode}`
                      : "Pickup"
                    : "Delivery"}
                </div>
                <div className="mt-1 font-semibold">{money(o.total)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StaffSite({
  session,
  products,
  orders,
  applications,
  onUpsertProduct,
  onDeleteProduct,
  onSetStatus,
  onSetInvoicePaid,
  onSetAppStatus,
  businesses,
  bizUsers,
  onUpsertBusiness,
  onDeleteBusiness,
  onUpsertBizUser,
  onDeleteBizUser,
  onUpdateAccount,
  bgUrl,
  onSetBgUrl,
}: {
  session: Extract<Session, { role: "staff" }>;
  products: Product[];
  orders: Order[];
  applications: Application[];
  onUpsertProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onSetStatus: (id: string, s: FulfillmentStatus) => void;
  onSetInvoicePaid: (id: string, paid: boolean) => void;
  onSetAppStatus: (id: string, s: Application["status"]) => void;
  businesses: Business[];
  bizUsers: BusinessUser[];
  onUpsertBusiness: (b: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onUpsertBizUser: (u: BusinessUser) => void;
  onDeleteBizUser: (u: string) => void;
  onUpdateAccount: (p: { email?: string; password?: string }) => string | null;
  bgUrl?: string;
  onSetBgUrl: (u: string) => void;
}) {
  // Role-based tab visibility & permissions
  const role = session.staffRole;
  const show = {
    products: ["owner", "manager", "inventory", "viewer"].includes(role),
    orders: ["owner", "manager", "orders", "viewer"].includes(role),
    applications: ["owner", "manager"].includes(role),
    business: ["owner", "manager"].includes(role),
    settings: ["owner", "manager"].includes(role),
  } as const;
  const can = {
    editProducts: ["owner", "manager", "inventory"].includes(role),
    deleteProducts: ["owner", "manager"].includes(role),
    manageOrders: ["owner", "manager", "orders"].includes(role),
    reviewApps: ["owner", "manager"].includes(role),
    manageBiz: ["owner", "manager"].includes(role),
  } as const;

  const firstTab =
    (Object.keys(show) as Array<keyof typeof show>).find((k) => show[k]) ||
    "products";
  const [tab, setTab] = useState<
    "products" | "orders" | "applications" | "business" | "settings"
  >(firstTab as any);

  return (
    <div className="space-y-6">
      <AccountPanel username={session.username} onUpdate={onUpdateAccount} />
      <div className="flex flex-wrap gap-2">
        {show.products && (
          <Button
            variant={tab === "products" ? "primary" : "ghost"}
            onClick={() => setTab("products")}
          >
            Products
          </Button>
        )}
        {show.orders && (
          <Button
            variant={tab === "orders" ? "primary" : "ghost"}
            onClick={() => setTab("orders")}
          >
            Orders
          </Button>
        )}
        {show.applications && (
          <Button
            variant={tab === "applications" ? "primary" : "ghost"}
            onClick={() => setTab("applications")}
          >
            Applications
          </Button>
        )}
        {show.business && (
          <Button
            variant={tab === "business" ? "primary" : "ghost"}
            onClick={() => setTab("business")}
          >
            Businesses
          </Button>
        )}
        {show.settings && (
          <Button
            variant={tab === "settings" ? "primary" : "ghost"}
            onClick={() => setTab("settings")}
          >
            Settings
          </Button>
        )}
      </div>

      {tab === "products" && (
        <ProductsTab
          products={products}
          onUpsert={onUpsertProduct}
          onDelete={onDeleteProduct}
          canEdit={can.editProducts}
          canDelete={can.deleteProducts}
        />
      )}

      {tab === "orders" && (
        <OrdersTab
          products={products}
          orders={orders}
          onSetStatus={onSetStatus}
          onSetInvoicePaid={onSetInvoicePaid}
          canManage={can.manageOrders}
        />
      )}

      {tab === "applications" && (
        <ApplicationsTab
          apps={applications}
          onSetStatus={onSetAppStatus}
          canReview={can.reviewApps}
        />
      )}

      {tab === "business" && can.manageBiz && (
        <BusinessTab
          businesses={businesses}
          users={bizUsers}
          onUpsertBusiness={onUpsertBusiness}
          onDeleteBusiness={onDeleteBusiness}
          onUpsertUser={onUpsertBizUser}
          onDeleteUser={onDeleteBizUser}
        />
      )}

      {tab === "settings" && <SettingsTab bgUrl={bgUrl} onSetBgUrl={onSetBgUrl} />}
    </div>
  );
}

/* ================== Sections ================== */
function ProductsTab({
  products,
  onUpsert,
  onDelete,
  canEdit,
  canDelete,
}: {
  products: Product[];
  onUpsert: (p: Product) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const empty: Product = {
    id: "",
    name: "",
    description: "",
    publicPrice: 0,
    businessPrice: 0,
    stock: 0,
    image: "",
    cardSize: "md",
  };
  const [form, setForm] = useState<Product>(empty);
  function submit() {
    const id = form.id || nextId("prod");
    const cleaned: Product = {
      ...form,
      id,
      publicPrice: Number(form.publicPrice) || 0,
      businessPrice: Number(form.businessPrice) || 0,
      stock: Math.max(0, Number(form.stock) || 0),
      cardSize: form.cardSize || "md",
    };
    onUpsert(cleaned);
    setForm(empty);
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <h3 className="mb-3 text-lg font-semibold">Add / Edit Product</h3>
        {canEdit ? (
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
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Card Size</span>
              <select
                className="w-full rounded-xl border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                value={form.cardSize}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cardSize: e.target.value as Product["cardSize"],
                  })
                }
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>
            <TextInput
              label="Public Price (SEK)"
              type="number"
              value={form.publicPrice}
              onChange={(e) =>
                setForm({ ...form, publicPrice: Number(e.target.value) })
              }
            />
            <TextInput
              label="Business Price (SEK)"
              type="number"
              value={form.businessPrice}
              onChange={(e) =>
                setForm({ ...form, businessPrice: Number(e.target.value) })
              }
            />
            <TextInput
              label="Stock"
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) })
              }
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
              <div className="text-xs text-gray-500">Editing: {form.id}</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Read-only: your role cannot create or edit products.
          </div>
        )}
      </Card>
      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold">All Products</h3>
        <div className="divide-y rounded-2xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800">
          <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-600 dark:bg-neutral-900 dark:text-neutral-300">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Public</div>
            <div className="col-span-2">Business</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          {products.map((p) => (
            <div key={p.id} className="grid grid-cols-12 items-center gap-2 p-3">
              <div className="col-span-4">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-600">{p.description}</div>
                <div className="text-[10px] text-gray-400">{p.id}</div>
              </div>
              <div className="col-span-2">{money(p.publicPrice)}</div>
              <div className="col-span-2">{money(p.businessPrice)}</div>
              <div className="col-span-1">{p.stock}</div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                {canEdit && (
                  <Button variant="ghost" onClick={() => setForm(p)}>
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" onClick={() => onDelete(p.id)}>
                    Delete
                  </Button>
                )}
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
  onSetInvoicePaid,
  canManage,
}: {
  products: Product[];
  orders: Order[];
  onSetStatus: (id: string, s: FulfillmentStatus) => void;
  onSetInvoicePaid: (id: string, paid: boolean) => void;
  canManage: boolean;
}) {
  const nameFor = (id: string) => products.find((p) => p.id === id)?.name || id;
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold">Orders</h3>
      {orders.length === 0 ? (
        <div className="text-sm text-gray-500">No orders.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-gray-200 p-3 dark:border-neutral-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  Order #{o.id} • Business: {o.businessId} • By: {o.placedBy}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1 text-sm">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>
                        {nameFor(it.productId)}{" "}
                        <span className="text-gray-500">× {it.qty}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2 dark:bg-neutral-900">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold">{money(o.total)}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <select
                      className="rounded-xl border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      value={o.status}
                      onChange={(e) =>
                        onSetStatus(o.id, e.target.value as FulfillmentStatus)
                      }
                      disabled={!canManage}
                    >
                      <option value="placed">Placed</option>
                      <option value="accepted">Accepted</option>
                      <option value="processing">Processing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="ready_for_pickup">Ready for Pickup</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={o.invoice.paid}
                        onChange={(e) =>
                          onSetInvoicePaid(o.id, e.target.checked)
                        }
                        disabled={!canManage}
                      />
                      Paid
                    </label>
                  </div>
                  {o.pickupCode && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-2 text-sm dark:border-neutral-700">
                      Pickup code: <b>{o.pickupCode}</b>
                    </div>
                  )}
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
  onSetStatus,
  canReview,
}: {
  apps: Application[];
  onSetStatus: (id: string, s: Application["status"]) => void;
  canReview: boolean;
}) {
  const [status, setStatus] = useState<"all" | Application["status"]>("all");
  const [region, setRegion] = useState<"all" | Application["region"]>("all");
  const [hours, setHours] = useState<"all" | "yes" | "no">("all");
  const list = apps.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      (region === "all" || a.region === region) &&
      (hours === "all" ||
        (hours === "yes" ? a.moreThan5Hours : !a.moreThan5Hours))
  );
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Job Applications</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            className="rounded-xl border px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="rounded-xl border px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            value={region}
            onChange={(e) => setRegion(e.target.value as any)}
          >
            <option value="all">Any Region</option>
            <option value="AU">AU</option>
            <option value="EU">EU</option>
            <option value="NA">NA</option>
            <option value="Other">Other</option>
          </select>
          <select
            className="rounded-xl border px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            value={hours}
            onChange={(e) => setHours(e.target.value as any)}
          >
            <option value="all">Any Hours</option>
            <option value="yes">&gt; 5h/week</option>
            <option value="no">≤ 5h/week</option>
          </select>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="text-sm text-gray-500">
          No applications match the filters.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-gray-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{a.inGameFullName}</div>
                <div className="text-sm text-gray-600">
                  {new Date(a.date).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-neutral-200">
                Contact: {a.discordOrEmail} • State ID: {a.stateId || "—"} •
                Region: {a.region} • &gt;5h/wk:{" "}
                {a.moreThan5Hours ? "Yes" : "No"}
              </div>
              <div className="mt-2 whitespace-pre-wrap">{a.about}</div>
              <div className="mt-3 flex items-center justify-between">
                <Badge>Status: {a.status}</Badge>
                <select
                  className="rounded-xl border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  value={a.status}
                  onChange={(e) =>
                    onSetStatus(a.id, e.target.value as Application["status"])
                  }
                  disabled={!canReview}
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BusinessTab({
  businesses,
  users,
  onUpsertBusiness,
  onDeleteBusiness,
  onUpsertUser,
  onDeleteUser,
}: {
  businesses: Business[];
  users: BusinessUser[];
  onUpsertBusiness: (b: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onUpsertUser: (u: BusinessUser) => void;
  onDeleteUser: (u: string) => void;
}) {
  const emptyBiz: Business = { id: "", name: "", discountPct: 0 };
  const [bForm, setBForm] = useState<Business>(emptyBiz);
  const emptyUser: BusinessUser = {
    username: "",
    password: "",
    displayName: "",
    role: "employee",
    businessId: "",
    email: "",
  };
  const [uForm, setUForm] = useState<BusinessUser>(emptyUser);
  function saveBiz() {
    const id = bForm.id || nextId("biz");
    onUpsertBusiness({
      ...bForm,
      id,
      discountPct: Math.max(0, Math.min(100, Number(bForm.discountPct) || 0)),
    });
    setBForm(emptyBiz);
  }
  function saveUser() {
    if (!uForm.username || !uForm.password || !uForm.businessId) return;
    onUpsertUser(uForm);
    setUForm(emptyUser);
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-3 text-lg font-semibold">Businesses</h3>
        <div className="space-y-3">
          <TextInput
            label="Name"
            value={bForm.name}
            onChange={(e) => setBForm({ ...bForm, name: e.target.value })}
          />
          <TextInput
            label="Discount %"
            type="number"
            value={bForm.discountPct}
            onChange={(e) =>
              setBForm({ ...bForm, discountPct: Number(e.target.value) })
            }
          />
          <div className="flex items-center gap-2">
            <Button onClick={saveBiz}>{bForm.id ? "Update" : "Create"}</Button>
            {bForm.id && (
              <Button variant="ghost" onClick={() => setBForm(emptyBiz)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 divide-y rounded-2xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800">
          {businesses.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-sm text-gray-600">
                  Discount: {b.discountPct}%
                </div>
                <div className="text-[10px] text-gray-400">{b.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setBForm(b)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onDeleteBusiness(b.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 text-lg font-semibold">Business Users</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label="Username"
            value={uForm.username}
            onChange={(e) => setUForm({ ...uForm, username: e.target.value })}
          />
          <TextInput
            label="Password"
            type="password"
            value={uForm.password}
            onChange={(e) => setUForm({ ...uForm, password: e.target.value })}
          />
          <TextInput
            label="Display Name"
            value={uForm.displayName}
            onChange={(e) =>
              setUForm({ ...uForm, displayName: e.target.value })
            }
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Role</span>
            <select
              className="w-full rounded-xl border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              value={uForm.role}
              onChange={(e) =>
                setUForm({ ...uForm, role: e.target.value as BizRole })
              }
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Business</span>
            <select
              className="w-full rounded-xl border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              value={uForm.businessId}
              onChange={(e) =>
                setUForm({ ...uForm, businessId: e.target.value })
              }
            >
              <option value="">Select…</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 flex items-center gap-2">
            <Button onClick={saveUser}>
              {users.some((u) => u.username === uForm.username)
                ? "Update"
                : "Create"}
            </Button>
            {uForm.username && (
              <Button variant="ghost" onClick={() => setUForm(emptyUser)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 divide-y rounded-2xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800">
          <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-600 dark:bg-neutral-900 dark:text-neutral-300">
            <div className="col-span-3">Username</div>
            <div className="col-span-3">Display</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-3">Business</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {users.map((u) => (
            <div key={u.username} className="grid grid-cols-12 items-center gap-2 p-3">
              <div className="col-span-3">{u.username}</div>
              <div className="col-span-3">{u.displayName}</div>
              <div className="col-span-2">{u.role}</div>
              <div className="col-span-3">
                {businesses.find((b) => b.id === u.businessId)?.name ||
                  u.businessId}
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setUForm(u)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => onDeleteUser(u.username)}>
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
  bgUrl,
  onSetBgUrl,
}: {
  bgUrl?: string;
  onSetBgUrl: (u: string) => void;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold">Settings</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <TextInput
            label="Catalog Background Image URL"
            value={bgUrl || ""}
            onChange={(e) => onSetBgUrl(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button variant="ghost" onClick={() => onSetBgUrl("")}>
            Clear
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        This demo stores data in localStorage. Swap to a backend for production.
      </p>
    </Card>
  );
}

/* ================== Widgets ================== */
function AccountPanel({
  username,
  onUpdate,
}: {
  username: string;
  onUpdate: (p: { email?: string; password?: string }) => string | null;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Card>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-500">Logged in as</div>
          <div className="text-lg font-bold">{username}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <TextInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <TextInput
          label="New Password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <div className="flex items-end">
          <Button
            onClick={() => {
              const err = onUpdate({
                email: email || undefined,
                password: pw || undefined,
              });
              setMsg(err || "Saved!");
              setPw("");
            }}
          >
            Save
          </Button>
        </div>
      </div>
      {msg && (
        <div className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
          {msg}
        </div>
      )}
    </Card>
  );
}

function AddToCart({
  max,
  onAdd,
}: {
  max: number;
  onAdd: (q: number) => void;
}) {
  const [qty, setQty] = useState(1);
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        max={max}
        value={Math.min(qty, max)}
        onChange={(e) =>
          setQty(Math.max(1, Math.min(Number(e.target.value) || 1, max)))
        }
        className="w-20 rounded-xl border border-gray-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
      />
      <Button onClick={() => onAdd(qty)} disabled={max <= 0}>
        Add
      </Button>
    </div>
  );
}

function PlaceOrderBar({ onPlace }: { onPlace: (opt: DeliveryOption) => void }) {
  const [opt, setOpt] = useState<DeliveryOption>("pickup");
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <label className="inline-flex items-center gap-1 text-sm">
        <input
          type="radio"
          checked={opt === "pickup"}
          onChange={() => setOpt("pickup")}
        />{" "}
        Pickup
      </label>
      <label className="inline-flex items-center gap-1 text-sm">
        <input
          type="radio"
          checked={opt === "delivery"}
          onChange={() => setOpt("delivery")}
        />{" "}
        Delivery
      </label>
      <Button onClick={() => onPlace(opt)}>Place Order</Button>
    </div>
  );
}

function Hero({
  bgUrl,
  children,
}: {
  bgUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-800">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: bgUrl
            ? `url(${bgUrl})`
            : "linear-gradient(135deg,#111,#333)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.05)",
          animation: "panZoom 20s ease-in-out infinite alternate",
        }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 p-6 text-white">{children}</div>
      <style>{`@keyframes panZoom{0%{transform:scale(1)}100%{transform:scale(1.08)}}`}</style>
    </div>
  );
}

function prettyStatus(s: FulfillmentStatus) {
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

/* ================== Apply Page ================== */
function ApplyPage({
  onSubmit,
}: {
  onSubmit: (a: Omit<Application, "id" | "date" | "status">) => void;
}) {
  const [inGameFullName, setInGameFullName] = useState("");
  const [discordOrEmail, setDiscordOrEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stateId, setStateId] = useState("");
  const [region, setRegion] = useState<Application["region"]>("EU");
  const [moreThan5Hours, setMoreThan5Hours] = useState(false);
  const [about, setAbout] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    if (!inGameFullName || !discordOrEmail || !about) return;
    onSubmit({
      inGameFullName,
      discordOrEmail,
      phone: phone || undefined,
      stateId: stateId || undefined,
      region,
      about,
      moreThan5Hours,
    });
    setDone(true);
    setInGameFullName("");
    setDiscordOrEmail("");
    setPhone("");
    setStateId("");
    setRegion("EU");
    setMoreThan5Hours(false);
    setAbout("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Apply for Job</h1>
      {done && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          Application sent!
        </div>
      )}
      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            label="In-game Full Name"
            value={inGameFullName}
            onChange={(e) => setInGameFullName(e.target.value)}
          />
          <TextInput
            label="Discord or Email"
            value={discordOrEmail}
            onChange={(e) => setDiscordOrEmail(e.target.value)}
          />
          <TextInput
            label="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextInput
            label="State ID (optional)"
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
              Region
            </span>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              value={region}
              onChange={(e) =>
                setRegion(e.target.value as Application["region"])
              }
            >
              <option value="AU">AU</option>
              <option value="EU">EU</option>
              <option value="NA">NA</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="md:col-span-2 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={moreThan5Hours}
              onChange={(e) => setMoreThan5Hours(e.target.checked)}
            />
            Will you work more than 5 hours per week?
          </label>
          <div className="md:col-span-2">
            <TextArea
              label="Why should you work here? Tell us about you"
              rows={6}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-end">
            <Button onClick={submit}>Submit</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
