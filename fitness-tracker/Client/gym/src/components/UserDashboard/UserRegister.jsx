//src/componenets/UserDashboard/UserRegister.jsx

import React, { useState } from "react";
import { registerUser } from "../../api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../../styles/UserStyle.css";
import { toast } from "react-toastify";

const UserRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (image) {
      formData.append("image", image);
    }

    try {
      await registerUser(formData);
      toast.success("Registration successful! You can now log in.");
      navigate("/users/login");
    } catch (error) {
      console.error("Registration failed:", error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        setError("Registration timed out. The server might be temporarily unavailable.");
        toast.error("Server connection timed out. Please try again later.", {
          autoClose: 8000
        });
      } 
      else if (error.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Please check your internet connection.");
        toast.error("Server connection failed. Please try again later.");
      }
      else if (error.response && error.response.data && error.response.data.message) {
        // Handle server error messages
        setError(error.response.data.message);
        toast.error(error.response.data.message);
      }
      else {
        setError("Registration failed. Please try again.");
        toast.error("Registration failed. Please try a different email address or try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="input-group">
          <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
          <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
          <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* Profile Image Upload */}
          <div className="input-group">
            <label>Profile Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="login-text">
          Already have an account? <Link to="/users/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default UserRegister;
