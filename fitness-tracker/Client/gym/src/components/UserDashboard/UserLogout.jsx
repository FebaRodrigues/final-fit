//src/components/UserDashboard/UserLogout.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const UserLogout = () => {
  const { logout } = useContext(AuthContext); // Assuming logout is provided by AuthContext
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    if (logout) logout(); // Call context logout if available
    navigate("/"); // Redirect to homepage
  };

  return (
    <div>
      <h2>Logout</h2>
      <p>Are you sure you want to log out?</p>
      <button onClick={handleLogout}>Yes, Log Out</button>
    </div>
  );
};

export default UserLogout;