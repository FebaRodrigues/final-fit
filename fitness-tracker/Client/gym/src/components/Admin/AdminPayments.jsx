// src/components/Admin/AdminPayments.jsx
import React, { useEffect, useState } from 'react';
import API from '../../api';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await API.get('/payments');
        setPayments(response.data);
      } catch (error) {
        console.error('Error fetching payments:', error);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div>
      <h2>Payment Management</h2>
      {payments.length > 0 ? (
        <ul>
          {payments.map((payment) => (
            <li key={payment._id}>
              ${payment.amount} - {payment.type} - {payment.status} - User: {payment.userId}
              {payment.trainerId && ` - Trainer: ${payment.trainerId}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>No payments recorded.</p>
      )}
    </div>
  );
};

export default AdminPayments;