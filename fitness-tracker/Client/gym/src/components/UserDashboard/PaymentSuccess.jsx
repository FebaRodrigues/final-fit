import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import { toast } from 'react-toastify';
import '../../styles/PaymentSuccess.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchMembership } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session_id');

      if (!sessionId) {
        setError('Invalid payment session');
        return;
      }

      try {
        setVerifying(true);
        setVerificationStatus('Verifying payment with server...');

        // First, verify the payment
        const response = await API.get(`/payments/verify-session?session_id=${sessionId}`);
        console.log('Payment verification response:', response.data);

        if (response.data.payment && response.data.payment.status === 'Completed') {
          setVerificationStatus('Payment verified successfully!');
          toast.success('Payment processed successfully!');

          // Refresh membership data if this was a membership payment
          if (response.data.payment.type === 'Membership' && user && user.id) {
            console.log('Refreshing membership data...');
            try {
              await fetchMembership(user.id);
              console.log('Membership data refreshed successfully');
            } catch (membershipError) {
              console.error('Error refreshing membership:', membershipError);
            }
          }

          // Store success in localStorage to show on dashboard
          localStorage.setItem('paymentSuccess', 'true');
          localStorage.setItem('paymentType', response.data.payment.type);

          // Redirect to dashboard
          console.log('Redirecting to dashboard...');
          navigate('/user/dashboard', { 
            replace: true,
            state: { 
              paymentSuccess: true,
              paymentType: response.data.payment.type
            }
          });
        } else {
          throw new Error(response.data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error.message || 'Failed to verify payment');
        toast.error('Payment verification failed. Please contact support if your payment was deducted.');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [location, navigate, user, fetchMembership]);

  if (error) {
    return (
      <div className="payment-result error">
        <h2>Payment Error</h2>
        <p>{error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/user/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="payment-result success">
      <h2>Payment Processing</h2>
      {verifying ? (
        <>
          <div className="loading-spinner"></div>
          <p>{verificationStatus}</p>
        </>
      ) : (
        <>
          <h3>Payment Successful!</h3>
          <p>Redirecting to dashboard...</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/user/dashboard')}
          >
            Return to Dashboard Now
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess; 