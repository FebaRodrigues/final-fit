//src/componenets/UserDashboard/UserRegister.jsx

import React, { useState } from "react";
import { registerUser } from "../../api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../../styles/UserStyle.css";

const UserRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (image) {
      formData.append("image", image);
    }

    try {
      await registerUser(formData);
      alert("User registration successful! You can now log in.");
      navigate("/users/login");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
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
          <button type="submit">Register</button>
        </form>
        <p className="login-text">
          Already have an account? <Link to="/users/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default UserRegister;
