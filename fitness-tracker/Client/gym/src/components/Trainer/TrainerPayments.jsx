// src/components/Trainer/TrainerPayments.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';

const TrainerPayments = () => {
  const { trainer } = useAuth();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const trainerId = trainer.id || trainer._id;
        const response = await API.get(`/payments/trainer/${trainerId}`);
        setPayments(response.data);
      } catch (error) {
        console.error('Error fetching trainer payments:', error);
      }
    };
    fetchPayments();
  }, [trainer]);

  return (
    <div>
      <h2>Your Earnings</h2>
      {payments.length > 0 ? (
        <ul>
          {payments.map((payment) => (
            <li key={payment._id}>
              ${payment.amount} - {payment.status} - Paid by User {payment.userId}
            </li>
          ))}
        </ul>
      ) : (
        <p>No payments received yet.</p>
      )}
    </div>
  );
};

export default TrainerPayments;