// src/components/Trainer/TrainerRegister.jsx
import React, { useState } from "react";
import { registerTrainer } from "../../api"; // Adjust the import path as necessary
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import "../../styles/TrainerStyle.css"; // Adjust the import path as necessary

const TrainerRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [password, setPassword] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate expected salary
    if (!expectedSalary || isNaN(expectedSalary) || Number(expectedSalary) <= 0) {
      setError("Please enter a valid expected salary amount");
      return;
    }
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("specialties", specialties.split(",").map(s => s.trim())); // Convert specialties to an array
    formData.append("expectedSalary", expectedSalary);
    formData.append("phone", phone);
    formData.append("bio", bio);
    
    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await registerTrainer(formData);
      alert("Trainer registration successful! Your account is pending approval by an administrator.");
      navigate("/trainers/login");
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="trainer-register-container">
      <div className="trainer-register-box">
        <h2>Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleRegister}>
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Specialties (comma separated)</label>
          <input
            type="text"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            required
          />

          <label>Expected Monthly Salary ($)</label>
          <input
            type="number"
            value={expectedSalary}
            onChange={(e) => setExpectedSalary(e.target.value)}
            required
            placeholder="Enter your expected monthly salary"
          />

          <label>Phone Number (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your contact number"
          />

          <label>Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself and your experience"
            rows="3"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          <button type="submit">Register</button>
        </form>
        <p className="auth-switch-text">
          Already have an account? <Link to="/trainers/login">Login here</Link>
        </p>
        <p className="approval-notice">
          Note: Your account will need to be approved by an administrator before you can log in.
        </p>
      </div>
    </div>
  );
};

export default TrainerRegister;