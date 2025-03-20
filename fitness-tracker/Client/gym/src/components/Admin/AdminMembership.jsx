// src/components/Admin/AdminMembership.jsx
import React, { useEffect, useState } from 'react';
import API from '../../api';

const AdminMembership = () => {
  const [memberships, setMemberships] = useState([]);
  const [newPlan, setNewPlan] = useState({
    planType: 'Basic',
    duration: 'Monthly',
    price: '',
  });

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const response = await API.get('/memberships'); // Assuming an endpoint to fetch all memberships
        setMemberships(response.data);
      } catch (error) {
        console.error('Error fetching memberships:', error);
      }
    };
    fetchMemberships();
  }, []);

  const handlePlanChange = (e) => {
    const { name, value } = e.target;
    setNewPlan({ ...newPlan, [name]: value });
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      // For simplicity, we'll create a membership without a specific user here
      const response = await API.post('/memberships', newPlan);
      setMemberships([...memberships, response.data.membership]);
      setNewPlan({ planType: 'Basic', duration: 'Monthly', price: '' });
      alert('Membership plan created successfully!');
    } catch (error) {
      console.error('Error creating membership plan:', error);
    }
  };

  return (
    <div>
      <h2>Membership Management</h2>
      <h3>All Memberships</h3>
      {memberships.length > 0 ? (
        <ul>
          {memberships.map((membership) => (
            <li key={membership._id}>
              {membership.planType} - {membership.duration} - ₹{membership.price} - 
              User: {membership.userId} - Status: {membership.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>No memberships found.</p>
      )}

      <h3>Create New Membership Plan</h3>
      <form onSubmit={handleCreatePlan}>
        <select name="planType" value={newPlan.planType} onChange={handlePlanChange}>
          <option value="Basic">Basic</option>
          <option value="Premium">Premium</option>
          <option value="Elite">Elite</option>
        </select>
        <select name="duration" value={newPlan.duration} onChange={handlePlanChange}>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Yearly">Yearly</option>
        </select>
        <input
          type="number"
          name="price"
          value={newPlan.price}
          onChange={handlePlanChange}
          placeholder="Price"
          required
        />
        <button type="submit">Create Plan</button>
      </form>
    </div>
  );
};

export default AdminMembership;