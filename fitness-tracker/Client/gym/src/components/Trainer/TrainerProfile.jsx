//src/components/Trainer/TrainerProfile.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getTrainerById, updateTrainerProfile } from "../../api";
import "../../styles/TrainerStyle.css";
import "../../styles/TrainerProfile.css";
import axios from "axios";

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fitness_app_preset';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'daacjyk3d';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const TrainerProfile = () => {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const { trainer: loggedInTrainer, setTrainerData } = useContext(AuthContext);

  // Log user info for debugging
  useEffect(() => {
    console.log("Logged in trainer from context:", loggedInTrainer);
    console.log("Trainer ID from params:", trainerId);
    console.log("User has permission to edit:", trainerId ? 
      (loggedInTrainer && (loggedInTrainer.id === trainerId || loggedInTrainer._id === trainerId)) : true);
  }, [loggedInTrainer, trainerId]);

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialties: "",
    phone: "",
    bio: "",
    image: null,
    imageUrl: null,
    availability: [{ day: "", startTime: "", endTime: "" }],
    certifications: [{ name: "", issuer: "", year: "" }],
    experience: [{ position: "", organization: "", startYear: "", endYear: "", description: "" }]
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      setLoading(true);
      try {
        // Use trainerId from URL params if available, otherwise use logged-in trainer's ID
        const idToFetch = trainerId || (loggedInTrainer && (loggedInTrainer.id || loggedInTrainer._id));
        
        if (!idToFetch) {
          throw new Error("No trainer ID available");
        }
        
        const response = await getTrainerById(idToFetch);
        console.log("Initial fetch or refetch:", response.data);
        setTrainer(response.data);
        setFormData({
          name: response.data.name,
          email: response.data.email,
          specialties: response.data.specialties.join(", "),
          phone: response.data.phone || "",
          bio: response.data.bio || "",
          image: null,
          imageUrl: null,
          availability: response.data.availability || [{ day: "", startTime: "", endTime: "" }],
          certifications: response.data.certifications || [{ name: "", issuer: "", year: "" }],
          experience: response.data.experience || [{ position: "", organization: "", startYear: "", endYear: "", description: "" }]
        });
        setPreviewImage(response.data.image);
      } catch (err) {
        console.error("Error fetching trainer profile:", err);
        setError("Failed to fetch trainer profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerProfile();
  }, [trainerId, loggedInTrainer]);

  // Add an effect to log when isEditing changes
  useEffect(() => {
    console.log("IsEditing state changed:", isEditing);
    
    // When we enter edit mode, log the current form data for debugging
    if (isEditing) {
      console.log("Form data when entering edit mode:", formData);
    }
  }, [isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field "${name}" changed to "${value}"`);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Function to handle image changes
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's a valid image file
      if (!file.type.match('image/(jpeg|png|gif|jpg|webp)')) {
        setError("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
        return;
      }
      
      // Check file size - limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB. Please choose a smaller image.");
        return;
      }
      
      console.log(`Selected file: ${file.name} (${file.size} bytes)`);
      setError(null);
      
      // Clean up previous preview if it exists
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      
      try {
        setIsUploading(true);
        
        // Create a preview immediately for better UX
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
        
        // Use server-side upload through form submission
        // Store the file in form data for later submission
        setFormData((prev) => ({ ...prev, image: file, imageUrl: null }));
        setSuccess("Image ready for upload with profile update");
      } catch (err) {
        console.error("Error in image processing:", err);
        setError("Failed to process image.");
        
        // Reset the image state
        setFormData((prev) => ({ ...prev, image: null, imageUrl: null }));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAvailabilityChange = (index, field, value) => {
    const newAvailability = [...formData.availability];
    newAvailability[index][field] = value;
    setFormData({ ...formData, availability: newAvailability });
  };

  const addAvailabilitySlot = () => {
    setFormData({
      ...formData,
      availability: [...formData.availability, { day: "", startTime: "", endTime: "" }],
    });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { name: "", issuer: "", year: "" }]
    });
  };

  const handleCertificationChange = (index, field, value) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index][field] = value;
    setFormData({ ...formData, certifications: newCertifications });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { position: "", organization: "", startYear: "", endYear: "", description: "" }]
    });
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...formData.experience];
    newExperience[index][field] = value;
    setFormData({ ...formData, experience: newExperience });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    console.log("Form submitted - current form data state:", formData);
    
    try {
      // First, check if any changes were actually made
      let hasChanges = false;
      let hasImageChange = false;
      
      // Store the ID to use for updates in a higher scope variable
      const idToUpdate = trainerId || (loggedInTrainer && (loggedInTrainer.id || loggedInTrainer._id));
      
      if (!idToUpdate) {
        throw new Error("No trainer ID available for update");
      }
      
      // Compare basic fields
      if (trainer.name !== formData.name) {
        console.log("Name changed from", trainer.name, "to", formData.name);
        hasChanges = true;
      }
      if (trainer.email !== formData.email) {
        console.log("Email changed from", trainer.email, "to", formData.email);
        hasChanges = true;
      }
      if (trainer.phone !== formData.phone) {
        console.log("Phone changed from", trainer.phone, "to", formData.phone);
        hasChanges = true;
      }
      if (trainer.bio !== formData.bio) {
        console.log("Bio changed from", trainer.bio, "to", formData.bio);
        hasChanges = true;
      }
      
      // Compare specialties (accounting for different formats)
      const currentSpecialties = trainer.specialties.join(", ");
      if (currentSpecialties !== formData.specialties) {
        console.log("Specialties changed from", currentSpecialties, "to", formData.specialties);
        hasChanges = true;
      }
      
      // Check if image was changed - either via Cloudinary or direct upload
      if (formData.image && formData.image instanceof File) {
        console.log("Image changed to new file:", formData.image.name);
        hasChanges = true;
        hasImageChange = true;
      }
      
      if (formData.imageUrl && formData.imageUrl !== trainer.image) {
        console.log("Image changed to Cloudinary URL");
        hasChanges = true;
        hasImageChange = true;
      }
      
      // For complex objects, stringify for comparison
      const trainerAvailabilityStr = JSON.stringify(trainer.availability || []);
      const formDataAvailabilityStr = JSON.stringify(formData.availability || []);
      if (trainerAvailabilityStr !== formDataAvailabilityStr) {
        console.log("Availability changed");
        hasChanges = true;
      }
      
      const trainerCertificationsStr = JSON.stringify(trainer.certifications || []);
      const formDataCertificationsStr = JSON.stringify(formData.certifications || []);
      if (trainerCertificationsStr !== formDataCertificationsStr) {
        console.log("Certifications changed");
        hasChanges = true;
      }
      
      const trainerExperienceStr = JSON.stringify(trainer.experience || []);
      const formDataExperienceStr = JSON.stringify(formData.experience || []);
      if (trainerExperienceStr !== formDataExperienceStr) {
        console.log("Experience changed");
        hasChanges = true;
      }
      
      // If no changes were made, show message and return early
      if (!hasChanges) {
        alert("No changes detected. Profile remains the same.");
        setIsEditing(false);
        return;
      }
      
      let response;
      
      // If we have a Cloudinary URL, use it directly in a JSON request
      if (formData.imageUrl) {
        const jsonData = {
          name: formData.name,
          email: formData.email,
          specialties: formData.specialties.split(",").map(s => s.trim()),
          phone: formData.phone,
          bio: formData.bio,
          image: formData.imageUrl,
          availability: formData.availability,
          certifications: formData.certifications,
          experience: formData.experience
        };
        
        console.log("Using JSON request with Cloudinary image URL:", jsonData.image);
        response = await axios.put(`${import.meta.env.VITE_API_URL}/trainers/${idToUpdate}`, jsonData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        // Always use FormData for submission - it's the most reliable approach
        const updatedData = new FormData();
        
        // Add basic fields
        updatedData.append("name", formData.name);
        updatedData.append("email", formData.email);
        
        // Handle specialties as array
        const specialtiesArray = formData.specialties.split(",").map((s) => s.trim());
        specialtiesArray.forEach((specialty) => updatedData.append("specialties[]", specialty));
        
        updatedData.append("phone", formData.phone);
        updatedData.append("bio", formData.bio);
        
        // Include image if it was changed
        if (hasImageChange && formData.image instanceof File) {
          console.log(`Adding image to FormData: ${formData.image.name}`);
          updatedData.append("image", formData.image);
        }
        
        // Convert complex objects to JSON strings
        updatedData.append("availability", JSON.stringify(formData.availability));
        updatedData.append("certifications", JSON.stringify(formData.certifications));
        updatedData.append("experience", JSON.stringify(formData.experience));
        
        console.log("Submitting profile update with FormData...");
        
        response = await updateTrainerProfile(idToUpdate, updatedData);
      }
      
      console.log("Profile update response:", response.data);

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setPreviewImage(null); // Reset preview after successful update
      setFormData(prev => ({...prev, image: null, imageUrl: null})); // Clear the image field

      // Use the stored idToUpdate variable
      const updatedProfileResponse = await getTrainerById(idToUpdate);
      console.log("Fetched updated profile:", updatedProfileResponse.data);
      
      // Update the trainer state in this component
      setTrainer(updatedProfileResponse.data);
      
      // Update the trainer data in localStorage and AuthContext
      if (updatedProfileResponse.data) {
        // Add a timestamp to the image URL to force cache refresh
        const timestamp = Date.now();
        const updatedData = {
          ...updatedProfileResponse.data,
          image: updatedProfileResponse.data.image ? 
            `${updatedProfileResponse.data.image}?t=${timestamp}` : 
            updatedProfileResponse.data.image
        };
        
        // Update localStorage directly
        localStorage.setItem('trainer', JSON.stringify(updatedData));
        
        // Update AuthContext if available
        if (setTrainerData) {
          setTrainerData(updatedData);
        }
        
        // Force a refresh of the sidebar by dispatching a custom event
        window.dispatchEvent(new CustomEvent('trainerProfileUpdated', { 
          detail: { 
            timestamp: timestamp,
            imageUrl: updatedData.image,
            trainerId: updatedData._id
          } 
        }));
        
        console.log("Trainer profile updated and event dispatched with image:", updatedData.image);
      }
      
      setFormData({
        name: updatedProfileResponse.data.name,
        email: updatedProfileResponse.data.email,
        specialties: updatedProfileResponse.data.specialties.join(", "),
        phone: updatedProfileResponse.data.phone || "",
        bio: updatedProfileResponse.data.bio || "",
        image: null,
        imageUrl: null,
        availability: updatedProfileResponse.data.availability || [{ day: "", startTime: "", endTime: "" }],
        certifications: updatedProfileResponse.data.certifications || [{ name: "", issuer: "", year: "" }],
        experience: updatedProfileResponse.data.experience || [{ position: "", organization: "", startYear: "", endYear: "", description: "" }]
      });
      setPreviewImage(updatedProfileResponse.data.image);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="trainer-profile-container trainer-page-container">
      <h2 className="trainer-page-title">{isEditing ? "Edit Profile" : `${trainer.name}'s Profile`}</h2>
      <div className="image-container">
        <img
          src={`${previewImage || trainer.image}?t=${Date.now()}`}
          alt={`${trainer.name}'s profile`}
          className="trainer-profile-image"
        />
      </div>
      
      {/* Move Edit button outside the form to prevent auto-submission */}
      {!isEditing && (
        <div className="form-actions top-actions">
          <button 
            type="button" 
            onClick={() => {
              console.log("Entering edit mode");
              setIsEditing(true);
            }} 
            className="trainer-btn trainer-btn-primary"
          >
            Edit Profile
          </button>
        </div>
      )}
      
      <form onSubmit={isEditing ? handleUpdateProfile : (e) => e.preventDefault()} className="trainer-form">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={!isEditing}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={!isEditing}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Specialties</label>
          <input
            type="text"
            name="specialties"
            value={formData.specialties}
            onChange={handleInputChange}
            required
            disabled={!isEditing}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="form-textarea"
          />
        </div>
        {/* Show Profile Image field only in edit mode */}
        {isEditing && (
          <div className="form-group">
            <label className="form-label">Profile Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" />
          </div>
        )}

        {/* Display Availability in Both View and Edit Modes */}
        <div className="form-group">
          <label className="form-label">Availability</label>
          {formData.availability && formData.availability.length > 0 ? (
            formData.availability.map((slot, index) =>
              isEditing ? (
                <div key={index} className="availability-slot">
                  <select
                    value={slot.day}
                    onChange={(e) => handleAvailabilityChange(index, "day", e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Day</option>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                      (day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      )
                    )}
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleAvailabilityChange(index, "startTime", e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleAvailabilityChange(index, "endTime", e.target.value)}
                    className="form-input"
                  />
                </div>
              ) : (
                <div key={index} className="availability-slot">
                  <p>
                    {slot.day}: {slot.startTime} - {slot.endTime}
                  </p>
                </div>
              )
            )
          ) : (
            <p>No availability set</p>
          )}
          {isEditing && (
            <button type="button" onClick={addAvailabilitySlot} className="trainer-btn trainer-btn-secondary">
              Add Slot
            </button>
          )}
        </div>

        {/* Display Certifications */}
        <div className="form-group">
          <label className="form-label">Certifications</label>
          {formData.certifications && formData.certifications.length > 0 ? (
            isEditing ? (
              formData.certifications.map((cert, index) => (
                <div key={index} className="certification-slot">
                  <input
                    type="text"
                    placeholder="Certification Name"
                    value={cert.name}
                    onChange={(e) => handleCertificationChange(index, "name", e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Issuing Organization"
                    value={cert.issuer}
                    onChange={(e) => handleCertificationChange(index, "issuer", e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={cert.year}
                    onChange={(e) => handleCertificationChange(index, "year", e.target.value)}
                    className="form-input"
                  />
                </div>
              ))
            ) : (
              <div className="certifications-list">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="certification-item">
                    <p><strong>{cert.name}</strong> - {cert.issuer} ({cert.year})</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p>No certifications added yet</p>
          )}
          {isEditing && (
            <button type="button" onClick={addCertification} className="trainer-btn trainer-btn-secondary">
              Add Certification
            </button>
          )}
        </div>

        {/* Display Experience */}
        <div className="form-group">
          <label className="form-label">Experience</label>
          {formData.experience && formData.experience.length > 0 ? (
            isEditing ? (
              formData.experience.map((exp, index) => (
                <div key={index} className="experience-slot">
                  <input
                    type="text"
                    placeholder="Position"
                    value={exp.position}
                    onChange={(e) => handleExperienceChange(index, "position", e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Organization"
                    value={exp.organization}
                    onChange={(e) => handleExperienceChange(index, "organization", e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Start Year"
                    value={exp.startYear}
                    onChange={(e) => handleExperienceChange(index, "startYear", e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="End Year"
                    value={exp.endYear}
                    onChange={(e) => handleExperienceChange(index, "endYear", e.target.value)}
                    className="form-input"
                  />
                  <textarea
                    placeholder="Description"
                    value={exp.description}
                    onChange={(e) => handleExperienceChange(index, "description", e.target.value)}
                    className="form-textarea"
                  />
                </div>
              ))
            ) : (
              <div className="experience-list">
                {formData.experience.map((exp, index) => (
                  <div key={index} className="experience-item">
                    <h4>{exp.position} at {exp.organization}</h4>
                    <p>{exp.startYear} - {exp.endYear || 'Present'}</p>
                    <p>{exp.description}</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p>No experience added yet</p>
          )}
          {isEditing && (
            <button type="button" onClick={addExperience} className="trainer-btn trainer-btn-secondary">
              Add Experience
            </button>
          )}
        </div>

        {/* Only show form action buttons when in edit mode */}
        {isEditing && (
          <div className="form-actions">
            <button type="submit" className="trainer-btn trainer-btn-primary">Save Changes</button>
            <button 
              type="button" 
              onClick={() => {
                console.log("Exiting edit mode");
                setIsEditing(false);
              }} 
              className="trainer-btn trainer-btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
      <button type="button" onClick={() => navigate(-1)} className="trainer-btn trainer-btn-secondary">
        Back
      </button>
    </div>
  );
};

export default TrainerProfile;
