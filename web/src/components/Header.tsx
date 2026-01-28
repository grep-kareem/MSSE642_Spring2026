import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>🚴 Brisk</h1>
          </Link>

          <nav className="nav">
            <Link to="/">Home</Link>
            {user?.role === "admin" && <Link to="/admin">Admin</Link>}
            {user && <Link to="/dashboard">Dashboard</Link>}
          </nav>

          <div className="auth-buttons">
            {user ? (
              <div className="user-menu">
                <span className="user-name">{user.name}</span>
                <span className="user-role">({user.role})</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
