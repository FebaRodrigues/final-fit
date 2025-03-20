// src/components/Trainer/TrainerLogin.jsx
import React, { useState } from "react";
import { loginTrainer } from "../../api";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/TrainerStyle.css";
import { useAuth } from "../../context/AuthContext";

const TrainerLogin = () => {
  const { setTrainerData } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    console.log("Attempting trainer login with:", { email });
    
    try {
      console.log("Making API request to /trainers/login");
      const response = await loginTrainer(email, password);
      console.log("Trainer login response:", response.data);
      
      // Store token in localStorage
      localStorage.setItem("token", response.data.token);
      console.log("Token stored in localStorage");
      
      // Store role in localStorage
      localStorage.setItem("role", response.data.role || "trainer");
      console.log("Role stored in localStorage:", response.data.role || "trainer");
      
      // Use setTrainerData from AuthContext to properly set the trainer
      setTrainerData(response.data.trainer);
      console.log("Trainer data set in AuthContext:", response.data.trainer);
      
      // Navigate to trainer dashboard
      console.log("Navigating to trainer dashboard");
      navigate("/trainer/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", err.response ? err.response.data : "No response data");
      setError("Invalid credentials or server error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="trainer-login-container">
      <div className="trainer-login-box">
        <h2>Trainer Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <p>
          Don't have an account? <Link to="/trainers/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default TrainerLogin;