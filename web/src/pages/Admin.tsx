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

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"products" | "reservations">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, navigate, tab]);

  const fetchData = async () => {
    if (tab === "products") {
      fetchProducts();
    } else {
      fetchReservations();
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
      await fetch(`/api/reservations/${id}`, {
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
