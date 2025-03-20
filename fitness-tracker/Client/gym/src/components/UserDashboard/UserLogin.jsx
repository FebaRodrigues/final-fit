//src/componenets/UserDashboard/UserLogin.jsx

import React, { useContext, useState } from "react";
import { loginUser } from "../../api"; // Import login API
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../../styles/UserStyle.css";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const UserLogin = () => {
  const { login } = useContext(AuthContext); // Use Auth Context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Clear any existing tokens before login
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      
      const response = await loginUser(email, password);
      const { token, user } = response.data;

      if (!token) {
        setError("No token received from server");
        toast.error("Authentication failed: No token received");
        setLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("user", JSON.stringify(user));

      // Call login function from context
      login(user);

      // Show success message
      toast.success("Login successful!");

      // Check if there's a pending Stripe session
      const pendingSessionId = localStorage.getItem('pendingStripeSession');
      if (pendingSessionId) {
        toast.info("Processing your recent payment...");
      }

      // Navigate based on user role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "trainer") {
        navigate("/trainer/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      
      // Handle server connection errors
      if (error.code === 'ERR_NETWORK' || error.message.includes('Cannot connect to server')) {
        setError("Cannot connect to server. Please check if the server is running.");
        toast.error("Server connection failed. Please try again later.");
      }
      // Handle suspended user
      else if (error.response && error.response.data && error.response.data.isSuspended) {
        setError(error.response.data.message);
        toast.error(error.response.data.message, {
          autoClose: 10000 // Keep this message visible longer (10 seconds)
        });
      }
      // Handle specific error messages from the server
      else if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
        toast.error(error.response.data.message);
      } 
      // Handle authentication errors
      else if (error.response && error.response.status === 401) {
        setError("Invalid email or password. Please try again.");
        toast.error("Authentication failed. Please check your credentials.");
      }
      // Handle other errors
      else {
        setError("Login failed. Please check your credentials.");
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
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
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p>
          Don't have an account? <Link to="/users/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
