// components/UserDashboard/Appointments.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../api";
import { getAllTrainers, getUserAppointments, bookAppointment } from "../../api";
import "../../styles/Appointments.css";

const Appointments = () => {
  const { user, membership } = useContext(AuthContext);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [userTrainers, setUserTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("trainers");

  // Check if user has Elite membership
  const isEliteMember = membership?.status === 'Active' && membership.planType === 'Elite';

  // Fetch all trainers and user's appointments
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) return;
      
      setLoading(true);
      setError("");
      
      try {
        // Fetch all trainers
        const trainersResponse = await getAllTrainers();
        setTrainers(trainersResponse.data);
        
        // Fetch user's appointments
        const appointmentsResponse = await getUserAppointments(user.id);
        setAppointments(appointmentsResponse.data);
        
        // Get list of trainers the user already has appointments with
        const confirmedAppointments = appointmentsResponse.data.filter(
          appointment => appointment.status === 'confirmed'
        );
        
        // Extract unique trainer IDs
        const trainerIds = [...new Set(confirmedAppointments.map(appointment => 
          appointment.trainerId
        ))];
        
        setUserTrainers(trainerIds);
      } catch (err) {
        console.error("Error fetching data:", err);
        
        // More specific error messages based on the error type
        if (err.response && err.response.status === 403) {
          setError("You don't have permission to view trainer information. Please contact support.");
        } else if (err.code === 'ERR_NETWORK') {
          setError("Cannot connect to the server. Please check your internet connection and try again.");
        } else {
          setError("Failed to load appointment data. Please try again later.");
        }
        
        // Set empty arrays to prevent null reference errors
        setTrainers([]);
        setAppointments([]);
        setUserTrainers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle trainer selection and show confirmation
  const handleSelectTrainer = (trainer) => {
    setSelectedTrainer(trainer);
    setShowConfirmation(true);
  };

  // Cancel booking confirmation
  const handleCancelBooking = () => {
    setShowConfirmation(false);
    setSelectedTrainer(null);
  };

  // Confirm and book appointment
  const handleConfirmBooking = async () => {
    if (!user || !user.id || !selectedTrainer) {
      setError("Missing required information for booking");
      setShowConfirmation(false);
      return;
    }

    try {
      // Set appointment date to current date
      const currentDate = new Date();
      
      await bookAppointment({
        userId: user.id,
        trainerId: selectedTrainer._id,
        date: currentDate,
      });
      
      // Refresh appointments
      const updatedAppointments = await getUserAppointments(user.id);
      setAppointments(updatedAppointments.data);
      
      // Update user's trainers list
      const confirmedAppointments = updatedAppointments.data.filter(
        appointment => appointment.status === 'confirmed'
      );
      const trainerIds = [...new Set(confirmedAppointments.map(appointment => 
        appointment.trainerId
      ))];
      setUserTrainers(trainerIds);
      
      // Show success message
      setBookingSuccess(true);
      setShowConfirmation(false);
      
      // Reset form
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedTrainer(null);
        setActiveTab("appointments");
      }, 3000);
    } catch (err) {
      console.error("Error booking appointment:", err);
      setError("Failed to book appointment. Please try again.");
      setShowConfirmation(false);
    }
  };

  // Check if user has an appointment with this trainer
  const hasAppointmentWithTrainer = (trainerId) => {
    return userTrainers.includes(trainerId);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="appointments-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // Render membership check
  if (!isEliteMember) {
    return (
      <div className="appointments-container">
        <div className="membership-required">
          <h2>Elite Membership Required</h2>
          <p>You need an Elite membership to access personal trainer appointments.</p>
          <button onClick={() => window.location.href = "/user/payments"}>Upgrade Membership</button>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <h2>Personal Trainer Appointments</h2>
      
      {/* Tabs Navigation */}
      <div className="appointments-tabs">
        <button 
          className={activeTab === "trainers" ? "active" : ""}
          onClick={() => setActiveTab("trainers")}
        >
          Available Trainers
        </button>
        <button 
          className={activeTab === "appointments" ? "active" : ""}
          onClick={() => setActiveTab("appointments")}
        >
          Your Appointments
        </button>
      </div>
      
      {/* Trainers List */}
      {activeTab === "trainers" && (
        <div className="trainers-list">
          <h3>Select a Trainer</h3>
          {trainers.length > 0 ? (
            <div className="trainers-grid">
              {trainers.map((trainer) => (
                <div key={trainer._id} className="trainer-card">
                  <div className="trainer-image">
                    <img src={trainer.image || "https://via.placeholder.com/150"} alt={trainer.name} />
                  </div>
                  <div className="trainer-info">
                    <h4>{trainer.name}</h4>
                    <p className="specialties">
                      <strong>Specialties:</strong> {trainer.specialties?.join(", ") || "General Fitness"}
                    </p>
                    <p className="bio">{trainer.bio || "No bio available"}</p>
                    <button 
                      onClick={() => handleSelectTrainer(trainer)}
                      className={`select-trainer-btn ${hasAppointmentWithTrainer(trainer._id) ? "current-trainer" : ""}`}
                    >
                      {hasAppointmentWithTrainer(trainer._id) 
                        ? "Book Another Session" 
                        : "Select Trainer"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-trainers">No trainers available at the moment.</p>
          )}
        </div>
      )}
      
      {/* Appointments List */}
      {activeTab === "appointments" && (
        <div className="appointments-list">
          <h3>Your Appointments</h3>
          {appointments.length > 0 ? (
            <div className="appointments-table">
              <table>
                <thead>
                  <tr>
                    <th>Trainer</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className={`status-${appointment.status}`}>
                      <td>{appointment.trainerName || "Trainer"}</td>
                      <td>{new Date(appointment.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${appointment.status}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-appointments">You don't have any appointments yet.</p>
          )}
        </div>
      )}
      
      {/* Booking Confirmation Modal */}
      {showConfirmation && selectedTrainer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Booking</h3>
            <div className="trainer-preview">
              <img src={selectedTrainer.image || "https://via.placeholder.com/150"} alt={selectedTrainer.name} />
              <h4>{selectedTrainer.name}</h4>
              <p>{selectedTrainer.specialties?.join(", ") || "General Fitness"}</p>
            </div>
            <p>Are you sure you want to book a session with this trainer?</p>
            <div className="modal-actions">
              <button onClick={handleCancelBooking} className="cancel-btn">Cancel</button>
              <button onClick={handleConfirmBooking} className="confirm-btn">Confirm Booking</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {bookingSuccess && (
        <div className="success-message">
          <p>Appointment booked successfully! The trainer will contact you to schedule a specific time.</p>
        </div>
      )}
    </div>
  );
};

export default Appointments;