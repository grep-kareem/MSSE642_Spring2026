import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ProductDetail.css";

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  dailyPrice: number;
  description: string;
  imageUrl?: string;
}

interface Review {
  id: number;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reserving, setReserving] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      setProduct(data.product);
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews/product/${id}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(id!),
          rating: reviewRating,
          title: reviewTitle,
          body: reviewBody,
        }),
        credentials: "include",
      });

      if (res.ok) {
        setReviewTitle("");
        setReviewBody("");
        setReviewRating(5);
        fetchReviews();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (!startDate || !endDate) {
      setMessage("Please select both start and end dates");
      return;
    }

    setReserving(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(id!),
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create reservation");
        return;
      }

      setMessage("✓ Reservation created successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      setMessage("Failed to create reservation");
    } finally {
      setReserving(false);
    }
  };

  if (loading)
    return (
      <div className="product-detail">
        <p>Loading...</p>
      </div>
    );
  if (!product)
    return (
      <div className="product-detail">
        <p>Product not found</p>
      </div>
    );

  const icon = product.category === "bike" ? "🚴" : "⛷️";

  return (
    <div className="product-detail">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>

        <div className="product-content">
          <div className="product-image-large">
            <div className="image-emoji">{icon}</div>
          </div>

          <div className="product-info">
            <h1>{product.name}</h1>
            <p className="category-badge">{product.category.toUpperCase()}</p>

            <div className="specs">
              <div className="spec">
                <span>Size:</span>
                <strong>{product.size}</strong>
              </div>
              <div className="spec">
                <span>Daily Price:</span>
                <strong className="price">
                  ${product.dailyPrice.toFixed(2)}
                </strong>
              </div>
            </div>

            <p className="description">{product.description}</p>

            <div className="reservation-form">
              <h2>Make a Reservation</h2>

              {!user && (
                <p className="login-hint">
                  Please <a href="/login">login</a> to make a reservation
                </p>
              )}

              <form onSubmit={handleReserve}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!user}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!user}
                    required
                  />
                </div>

                {startDate && endDate && startDate < endDate && (
                  <div className="cost-estimate">
                    <p>
                      Estimated cost:{" "}
                      <strong>
                        $
                        {(
                          (product.dailyPrice *
                            (new Date(endDate).getTime() -
                              new Date(startDate).getTime())) /
                          (1000 * 60 * 60 * 24)
                        ).toFixed(2)}
                      </strong>
                    </p>
                  </div>
                )}

                {message && (
                  <div
                    className={`message ${message.includes("✓") ? "success" : "error"}`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!user || reserving}
                >
                  {reserving ? "Creating..." : "Reserve Now"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2>Customer Reviews ({reviews.length})</h2>

          {user && (
            <form onSubmit={handleSubmitReview} className="review-form">
              <h3>Write a Review</h3>
              <div className="form-group">
                <label>Rating</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {"★".repeat(r)}
                      {"☆".repeat(5 - r)} ({r})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Review title..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Review (HTML supported)</label>
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Write your review... HTML tags are supported for formatting!"
                  required
                  rows={4}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}

          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p>No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="review-stars">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                    <strong>{review.title}</strong>
                    <span className="review-author">
                      by {review.user.name} ({review.user.email})
                    </span>
                  </div>
                  {/* VULN: Stored XSS - renders raw HTML from user input */}
                  <div
                    className="review-body"
                    dangerouslySetInnerHTML={{ __html: review.body }}
                  />
                  <small className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
