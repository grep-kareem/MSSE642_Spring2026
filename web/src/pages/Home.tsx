import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  dailyPrice: number;
  description: string;
  imageUrl?: string;
}

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, category, search, minPrice, maxPrice]);

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

  const applyFilters = () => {
    let filtered = products;

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (minPrice) {
      filtered = filtered.filter((p) => p.dailyPrice >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter((p) => p.dailyPrice <= parseFloat(maxPrice));
    }

    setFilteredProducts(filtered);
  };

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Brisk</h1>
        <p>Rent bikes and skis for your next adventure</p>
      </div>

      <div className="container">
        <div className="filters">
          <h2>Filters</h2>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              <option value="bike">Bikes</option>
              <option value="ski">Skis</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Min Price ($/day)</label>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
            />
          </div>

          <div className="filter-group">
            <label>Max Price ($/day)</label>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>

          <button onClick={applyFilters} className="btn btn-primary">
            Apply Filters
          </button>
        </div>

        <div className="products-section">
          <h2>Available Products ({filteredProducts.length})</h2>

          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p>No products found. Try adjusting your filters.</p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  className="product-card"
                >
                  <div className="product-image">
                    {product.category === "bike" ? "🚴" : "⛷️"}
                  </div>
                  <h3>{product.name}</h3>
                  <p className="category">{product.category.toUpperCase()}</p>
                  <p className="size">Size: {product.size}</p>
                  <p className="description">{product.description}</p>
                  <p className="price">${product.dailyPrice.toFixed(2)}/day</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
