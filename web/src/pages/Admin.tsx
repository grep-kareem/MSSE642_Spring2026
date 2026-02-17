import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Admin.css";

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  dailyPrice: number;
  description: string;
}

interface Reservation {
  id: number;
  user: { id: number; name: string; email: string };
  product: { id: number; name: string };
  startDate: string;
  endDate: string;
  status: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count?: { reservations: number; reviews: number; notes: number };
}

interface Review {
  id: number;
  rating: number;
  body: string;
  user: { id: number; name: string; email: string };
  product: { id: number; name: string };
  createdAt: string;
}

interface SiteSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxReservationDays: number;
  defaultCurrency: string;
  contactEmail: string;
  motd: string;
  [key: string]: any;
}

interface Stats {
  users: number;
  products: number;
  reservations: { total: number; active: number };
  reviews: number;
}

type TabType = "products" | "reservations" | "users" | "reviews" | "settings";

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "bike",
    size: "",
    dailyPrice: "",
    description: "",
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, navigate, tab]);

  const fetchData = async () => {
    setLoading(true);
    if (tab === "products") {
      fetchProducts();
    } else if (tab === "reservations") {
      fetchReservations();
    } else if (tab === "users") {
      fetchUsers();
      fetchStats();
    } else if (tab === "reviews") {
      fetchReviews();
    } else if (tab === "settings") {
      fetchSettings();
      fetchStats();
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/admin/reservations", {
        credentials: "include",
      });
      const data = await res.json();
      setReservations(data.reservations);
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      const data = await res.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        credentials: "include",
      });
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      const data = await res.json();
      setStats(data.stats);
    } catch (_error) {
      console.error("Failed to fetch stats");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      dailyPrice: parseFloat(formData.dailyPrice),
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/products/${editingId}` : "/api/products";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (res.ok) {
        fetchProducts();
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      size: product.size,
      dailyPrice: product.dailyPrice.toString(),
      description: product.description,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const updateReservationStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/admin/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      fetchReservations();
    } catch (error) {
      console.error("Failed to update reservation:", error);
    }
  };

  const deleteReservation = async (id: number) => {
    if (!window.confirm("Delete this reservation?")) return;
    try {
      await fetch(`/api/admin/reservations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchReservations();
    } catch (error) {
      console.error("Failed to delete reservation:", error);
    }
  };

  const changeUserRole = async (id: number, role: string) => {
    try {
      await fetch(`/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to change role:", error);
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const resetUserPassword = async (id: number) => {
    const newPassword = window.prompt(
      "Enter new password (leave empty for default 'password123'):",
    );
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPassword || undefined }),
        credentials: "include",
      });
      const data = await res.json();
      alert(`Password reset to: ${data.newPassword}`);
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  const disableUser = async (id: number) => {
    try {
      await fetch(`/api/admin/users/${id}/disable`, {
        method: "PATCH",
        credentials: "include",
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to disable user:", error);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData),
        credentials: "include",
      });
      if (res.ok) {
        setShowUserForm(false);
        setUserFormData({
          name: "",
          email: "",
          password: "",
          role: "customer",
        });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const deleteReview = async (id: number) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchReviews();
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      const data = await res.json();
      setSettings(data.settings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const toggleMaintenance = async () => {
    try {
      const res = await fetch("/api/admin/settings/maintenance", {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (settings) {
        setSettings({ ...settings, maintenanceMode: data.maintenanceMode });
      }
    } catch (error) {
      console.error("Failed to toggle maintenance:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "bike",
      size: "",
      dailyPrice: "",
      description: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="admin">
      <div className="container">
        <h1>Admin Panel</h1>

        <div className="tabs">
          <button
            className={`tab ${tab === "products" ? "active" : ""}`}
            onClick={() => setTab("products")}
          >
            Products
          </button>
          <button
            className={`tab ${tab === "reservations" ? "active" : ""}`}
            onClick={() => setTab("reservations")}
          >
            Reservations
          </button>
          <button
            className={`tab ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            className={`tab ${tab === "reviews" ? "active" : ""}`}
            onClick={() => setTab("reviews")}
          >
            Reviews
          </button>
          <button
            className={`tab ${tab === "settings" ? "active" : ""}`}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
        </div>

        {tab === "products" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Products ({products.length})</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                className="btn btn-primary"
              >
                {showForm ? "Cancel" : "+ Add Product"}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="product-form">
                <h3>{editingId ? "Edit Product" : "Create Product"}</h3>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="bike">Bike</option>
                    <option value="ski">Ski</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Daily Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dailyPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyPrice: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  {editingId ? "Update" : "Create"}
                </button>
              </form>
            )}

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Size</th>
                      <th>Price/day</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.size}</td>
                        <td>${product.dailyPrice.toFixed(2)}</td>
                        <td>{product.description}</td>
                        <td className="actions">
                          <button
                            onClick={() => handleEdit(product)}
                            className="btn-small btn-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="btn-small btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "reservations" && (
          <div className="tab-content">
            <h2>Reservations ({reservations.length})</h2>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="reservations-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Customer</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => (
                      <tr key={res.id}>
                        <td>{res.product.name}</td>
                        <td>
                          <div>
                            <strong>{res.user.name}</strong>
                            <br />
                            <small>{res.user.email}</small>
                          </div>
                        </td>
                        <td>{new Date(res.startDate).toLocaleDateString()}</td>
                        <td>{new Date(res.endDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status ${res.status}`}>
                            {res.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="actions">
                          {res.status === "active" && (
                            <>
                              <button
                                onClick={() =>
                                  updateReservationStatus(res.id, "completed")
                                }
                                className="btn-small btn-complete"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() =>
                                  updateReservationStatus(res.id, "cancelled")
                                }
                                className="btn-small btn-delete"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteReservation(res.id)}
                            className="btn-small btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Users ({users.length})</h2>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="btn btn-primary"
              >
                {showUserForm ? "Cancel" : "+ Create User"}
              </button>
            </div>

            {stats && (
              <div className="stats-bar">
                <span>Total: {stats.users}</span>
                <span>Active Reservations: {stats.reservations.active}</span>
                <span>Reviews: {stats.reviews}</span>
              </div>
            )}

            {showUserForm && (
              <form onSubmit={createUser} className="product-form">
                <h3>Create User</h3>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={userFormData.name}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="text"
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, role: e.target.value })
                    }
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </form>
            )}

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Reservations</th>
                      <th>Reviews</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) =>
                              changeUserRole(u.id, e.target.value)
                            }
                            className="role-select"
                          >
                            <option value="customer">customer</option>
                            <option value="staff">staff</option>
                            <option value="admin">admin</option>
                            <option value="disabled">disabled</option>
                          </select>
                        </td>
                        <td>{u._count?.reservations ?? 0}</td>
                        <td>{u._count?.reviews ?? 0}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            onClick={() => resetUserPassword(u.id)}
                            className="btn-small btn-edit"
                          >
                            Reset PW
                          </button>
                          <button
                            onClick={() => disableUser(u.id)}
                            className="btn-small btn-complete"
                          >
                            Disable
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="btn-small btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {tab === "reviews" && (
          <div className="tab-content">
            <h2>Reviews ({reviews.length})</h2>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>User</th>
                      <th>Rating</th>
                      <th>Body</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.product.name}</td>
                        <td>
                          <div>
                            <strong>{r.user.name}</strong>
                            <br />
                            <small>{r.user.email}</small>
                          </div>
                        </td>
                        <td>
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)}
                        </td>
                        <td className="review-body-cell">
                          {r.body.substring(0, 80)}
                          {r.body.length > 80 ? "…" : ""}
                        </td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            onClick={() => deleteReview(r.id)}
                            className="btn-small btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div className="tab-content">
            <h2>Site Settings</h2>

            {stats && (
              <div className="stats-cards">
                <div className="stat-card">
                  <h3>{stats.users}</h3>
                  <p>Users</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.products}</h3>
                  <p>Products</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.reservations.total}</h3>
                  <p>Reservations</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.reservations.active}</h3>
                  <p>Active</p>
                </div>
                <div className="stat-card">
                  <h3>{stats.reviews}</h3>
                  <p>Reviews</p>
                </div>
              </div>
            )}

            {loading ? (
              <p>Loading...</p>
            ) : settings ? (
              <div className="settings-form">
                <div className="form-group">
                  <label>Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                    onBlur={() =>
                      updateSettings({ siteName: settings.siteName })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, contactEmail: e.target.value })
                    }
                    onBlur={() =>
                      updateSettings({ contactEmail: settings.contactEmail })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Message of the Day</label>
                  <textarea
                    value={settings.motd}
                    onChange={(e) =>
                      setSettings({ ...settings, motd: e.target.value })
                    }
                    onBlur={() => updateSettings({ motd: settings.motd })}
                  />
                </div>
                <div className="form-group">
                  <label>Default Currency</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings({ ...settings, defaultCurrency: val });
                      updateSettings({ defaultCurrency: val });
                    }}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Reservation Days</label>
                  <input
                    type="number"
                    value={settings.maxReservationDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxReservationDays: parseInt(e.target.value),
                      })
                    }
                    onBlur={() =>
                      updateSettings({
                        maxReservationDays: settings.maxReservationDays,
                      })
                    }
                  />
                </div>
                <div className="settings-toggles">
                  <div className="toggle-row">
                    <span>Maintenance Mode</span>
                    <button
                      onClick={toggleMaintenance}
                      className={`toggle-btn ${settings.maintenanceMode ? "on" : "off"}`}
                    >
                      {settings.maintenanceMode ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="toggle-row">
                    <span>Registration Enabled</span>
                    <button
                      onClick={() => {
                        const val = !settings.registrationEnabled;
                        setSettings({ ...settings, registrationEnabled: val });
                        updateSettings({ registrationEnabled: val });
                      }}
                      className={`toggle-btn ${settings.registrationEnabled ? "on" : "off"}`}
                    >
                      {settings.registrationEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p>Failed to load settings.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
