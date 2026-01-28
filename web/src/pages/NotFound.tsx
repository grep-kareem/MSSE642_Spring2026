import React from "react";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <div className="not-found-container">
        <h1>404</h1>
        <p className="message">Page Not Found</p>
        <p className="description">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Go Home
        </button>
      </div>
    </div>
  );
};
