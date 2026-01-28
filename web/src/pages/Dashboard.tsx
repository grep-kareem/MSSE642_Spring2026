import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

interface Reservation {
  id: number;
  product: {
    name: string;
    category: string;
    dailyPrice: number;
  };
  startDate: string;
  endDate: string;
  status: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchReservations();
  }, [user, navigate]);

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations", {
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

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this reservation?")) return;

    try {
      await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
        credentials: "include",
      });

      fetchReservations();
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
    }
  };

  const upcoming = reservations.filter(
    (r) => new Date(r.startDate) > new Date() && r.status === "active",
  );

  const past = reservations.filter(
    (r) => new Date(r.endDate) <= new Date() || r.status === "cancelled",
  );

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>My Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>

        <div className="user-info">
          <div className="info-card">
            <label>Name</label>
            <p>{user?.name}</p>
          </div>
          <div className="info-card">
            <label>Email</label>
            <p>{user?.email}</p>
          </div>
          <div className="info-card">
            <label>Role</label>
            <p>{user?.role.toUpperCase()}</p>
          </div>
        </div>

        {loading ? (
          <p>Loading reservations...</p>
        ) : (
          <>
            <section className="reservations-section">
              <h2>Upcoming Reservations ({upcoming.length})</h2>
              {upcoming.length === 0 ? (
                <p className="empty">No upcoming reservations</p>
              ) : (
                <div className="reservations-list">
                  {upcoming.map((reservation) => (
                    <div key={reservation.id} className="reservation-card">
                      <div className="reservation-info">
                        <h3>{reservation.product.name}</h3>
                        <p className="category">
                          {reservation.product.category.toUpperCase()}
                        </p>
                        <p className="dates">
                          {new Date(reservation.startDate).toLocaleDateString()}{" "}
                          - {new Date(reservation.endDate).toLocaleDateString()}
                        </p>
                        <p className="price">
                          ${reservation.product.dailyPrice.toFixed(2)}/day
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        className="btn btn-danger"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="reservations-section">
              <h2>Past Reservations ({past.length})</h2>
              {past.length === 0 ? (
                <p className="empty">No past reservations</p>
              ) : (
                <div className="reservations-list">
                  {past.map((reservation) => (
                    <div key={reservation.id} className="reservation-card past">
                      <div className="reservation-info">
                        <h3>{reservation.product.name}</h3>
                        <p className="category">
                          {reservation.product.category.toUpperCase()}
                        </p>
                        <p className="dates">
                          {new Date(reservation.startDate).toLocaleDateString()}{" "}
                          - {new Date(reservation.endDate).toLocaleDateString()}
                        </p>
                        <p className={`status ${reservation.status}`}>
                          {reservation.status.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};
