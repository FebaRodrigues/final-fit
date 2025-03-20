// src/components/UserDashboard/Payments.jsx
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import API from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import useMembershipAccess from '../../hooks/useMembershipAccess';
import '../../styles/Payments.css';
import axios from 'axios';

// Initialize Stripe outside component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Payments = () => {
  const { user, fetchMembership, membership } = useContext(AuthContext);
  const { isNewUser } = useMembershipAccess();
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([
    { type: "Basic", price: 1199, duration: "Monthly", features: ["Access to gym equipment", "Basic workout plans"] },
    { type: "Premium", price: 1999, duration: "Monthly", features: ["All Basic features", "Personal training session", "Goal tracking"] },
    { type: "Elite", price: 2999, duration: "Monthly", features: ["All Premium features", "Unlimited training sessions", "Priority booking", "Spa access"] }
  ]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newMembershipId, setNewMembershipId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showChangeMembership, setShowChangeMembership] = useState(false);
  const [pendingMembership, setPendingMembership] = useState(null);

  const fetchPayments = async () => {
    if (!user || !user.id) return;
    
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log('Fetching payment history for user:', user.id);
      
      // Try to fetch payments with retry logic
      let response;
      try {
        response = await API.get(`/payments/user/${user.id}`);
      } catch (initialError) {
        console.warn('Initial payment fetch failed, retrying...', initialError);
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Try again with a different API endpoint format
        response = await API.get(`/payments/user/${user.id}`);
      }
      
      console.log('Payment history response:', response.data);
      
      // Check if the response has a payments property
      if (response.data && response.data.payments) {
        setPayments(response.data.payments);
      } else if (Array.isArray(response.data)) {
        // If the response is an array, use it directly
        setPayments(response.data);
      } else {
        // If neither, set empty array
        console.log('No payment data found, setting empty array');
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Don't show error message to user, just log it
      console.log('Setting empty payments array due to error');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle SPA service payment - memoized with useCallback
  const handleSpaPayment = useCallback(async (serviceId, serviceName, price) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate the booking ID
      if (!serviceId) {
        throw new Error('Missing booking ID for SPA service payment');
      }
      
      console.log('Processing SPA payment for booking ID:', serviceId);
      
      // Store the pending payment data
      const paymentData = {
        amount: price || 50, // Default to 50 if price is not provided
        type: 'SpaService',
        bookingId: serviceId,
        userId: user.id,
        description: `Booking for ${serviceName || 'SPA Service'}`,
        serviceName: serviceName || 'SPA Service'
      };
      
      console.log('Preparing SPA payment data:', paymentData);
      setPendingPaymentData(paymentData);
      
      // Request OTP
      const otpResponse = await API.post('/payments/send-otp', {
        userId: user.id,
        email: user.email
      });
      
      console.log('OTP request response:', otpResponse.data);
      
      if (otpResponse.data.message === 'OTP sent successfully') {
        setShowOTPInput(true);
        setOtpExpiry(otpResponse.data.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString());
        toast.success('OTP sent to your email. Please verify to proceed with payment.');
        
        // Set OTP expiry time if provided
        if (otpResponse.data.expiresAt) {
          const expiryTime = new Date(otpResponse.data.expiresAt);
          const now = new Date();
          const minutesRemaining = Math.round((expiryTime - now) / 60000);
          
          if (minutesRemaining > 0) {
            toast.info(`OTP will expire in ${minutesRemaining} minutes`);
          }
        }
      } else {
        throw new Error(otpResponse.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error in handleSpaPayment:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Unknown error';
      setError('Error: ' + errorMessage);
      toast.error('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, setPendingPaymentData, setShowOTPInput, setOtpExpiry]);

  useEffect(() => {
    if (!user || !user.id) {
      setError('User not authenticated');
      return;
    }
    
    // Check for payment success from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    
    if (sessionId && success === 'true') {
      const verifySession = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Verify the payment session with the server
          const response = await API.get(`/payments/verify-session?session_id=${sessionId}`);
          
          // Check if payment was successful
          if (response.data.payment && response.data.payment.status === 'Completed') {
            // Show success message
            setSuccessMessage('Payment successful! Your membership has been activated.');
            toast.success('Payment successful! Your membership has been activated.');
            
            // Refresh membership in AuthContext
            await fetchMembership(user.id);
            
            // Fetch updated payment history
            await fetchPayments();
            
            // Reset UI state
            setShowOTPInput(false);
            setPendingPaymentData(null);
            setOtp('');
            setShowChangeMembership(false);
            
            // If membership was activated, show additional details
            if (response.data.membership) {
              setSuccessMessage(
                `Payment successful! Your ${response.data.membership.planType} membership has been activated and will expire on ${new Date(response.data.membership.endDate).toLocaleDateString()}.`
              );
            }
          } else if (response.data.alreadyProcessed) {
            // Payment was already processed before
            setSuccessMessage('This payment was already processed. Your membership is active.');
            toast.info('This payment was already processed. Your membership is active.');
            
            // Refresh data anyway
            await fetchMembership(user.id);
            await fetchPayments();
          } else {
            // Payment verification failed
            setError('Payment verification failed: ' + response.data.message);
            toast.error('Payment verification failed: ' + response.data.message);
          }
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error verifying session:', error);
          setError('Failed to verify payment: ' + (error.response?.data?.message || error.message));
          toast.error('Failed to verify payment: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      };
      
      verifySession();
    } else {
      // Check for pending payment in session storage
      const pendingPaymentString = sessionStorage.getItem('pendingPayment');
      if (pendingPaymentString) {
        try {
          const pendingPayment = JSON.parse(pendingPaymentString);
          console.log('Found pending payment in session storage:', pendingPayment);
          
          if (pendingPayment.type === 'SpaService') {
            // Handle SPA service payment
            handleSpaPayment(pendingPayment.bookingId, pendingPayment.serviceName, pendingPayment.amount);
          }
          
          // Clear the pending payment from session storage
          sessionStorage.removeItem('pendingPayment');
        } catch (error) {
          console.error('Error parsing pending payment:', error);
        }
      }
      
      // Check if there's a pending payment in the location state
      if (location.state?.pendingPayment) {
        const pendingPayment = location.state.pendingPayment;
        console.log('Received pending payment from navigation:', pendingPayment);
        
        // Handle different payment types
        if (pendingPayment.type === 'SpaService') {
          // Handle SPA service payment
          handleSpaPayment(pendingPayment.bookingId, pendingPayment.serviceName, pendingPayment.amount);
        }
        
        // Clear the location state to prevent reprocessing on refresh
        window.history.replaceState({}, document.title);
      }
      
      // Fetch payment history on component mount
      fetchPayments();
    }
  }, [user, fetchMembership, location, handleSpaPayment]);

  useEffect(() => {
    const checkPendingMembership = async () => {
      if (!user || !user.id) return;
      
      try {
        const response = await API.get(`/memberships/user/${user.id}`);
        const pending = response.data.find(m => m.status === 'Pending');
        if (pending) {
          console.log('Found pending membership:', pending);
          setPendingMembership(pending);
        }
      } catch (error) {
        console.error('Error checking pending membership:', error);
      }
    };
    
    checkPendingMembership();
  }, [user]);

  const handlePlanSelect = async (plan) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      console.log('Creating new membership for plan:', plan);
      
      if (!user || !user.id) {
        throw new Error('User information is missing');
      }
      
      // Create a new pending membership
      const response = await API.post('/memberships', {
        userId: user.id,
        planType: plan.type,
        duration: plan.duration,
        price: plan.price,
        status: 'Pending'
      });

      if (!response.data || !response.data.membership || !response.data.membership._id) {
        throw new Error('Failed to create membership: Invalid server response');
      }

      console.log('New membership created:', response.data);
      
      // Store the new membership ID and selected plan
      const newMembershipId = response.data.membership._id;
      setNewMembershipId(newMembershipId);
      setSelectedPlan(plan);

      // Set pending payment data
      const paymentData = {
        membershipId: newMembershipId,
        amount: plan.price,
        planType: plan.type
      };
      setPendingPaymentData(paymentData);
      console.log('Set pending payment data:', paymentData);

      // Request OTP
      console.log('Requesting OTP for user:', user.id, 'with email:', user.email);
      const otpResponse = await API.post('/payments/send-otp', {
        userId: user.id,
        email: user.email
      });

      console.log('OTP response:', otpResponse.data);

      if (otpResponse.data.message === 'OTP sent successfully') {
        setShowOTPInput(true);
        toast.info('Please check your email for OTP verification');
        
        // Set OTP expiry time if provided
        if (otpResponse.data.expiresAt) {
          const expiryTime = new Date(otpResponse.data.expiresAt);
          const now = new Date();
          const minutesRemaining = Math.round((expiryTime - now) / 60000);
          
          if (minutesRemaining > 0) {
            toast.info(`OTP will expire in ${minutesRemaining} minutes`);
          }
        }
      } else {
        throw new Error('Failed to send OTP: ' + (otpResponse.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Error selecting plan: ' + (err.response?.data?.message || err.message));
      toast.error('Failed to select plan: ' + (err.response?.data?.message || err.message));
      
      // Reset state on error
      setNewMembershipId(null);
      setSelectedPlan(null);
      setPendingPaymentData(null);
      setShowOTPInput(false);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPAndPay = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate OTP
      if (!otp || otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        toast.error('Please enter a valid 6-digit OTP');
        setLoading(false);
        return;
      }

      // Verify OTP
      console.log('Verifying OTP with userId:', user.id, 'and OTP:', otp);
      const verifyResponse = await API.post('/payments/verify-otp', {
        userId: user.id,
        otp: otp.toString() // Ensure OTP is sent as a string
      });

      console.log('OTP verification response:', verifyResponse.data);

      if (verifyResponse.data.message === 'OTP verified successfully') {
        toast.success('OTP verified successfully');
        
        // Check if we have pending payment data
        if (!pendingPaymentData) {
          // If we don't have pending payment data but we have a pending membership from the response
          if (verifyResponse.data.pendingMembership) {
            const pendingMembership = verifyResponse.data.pendingMembership;
            setPendingPaymentData({
              membershipId: pendingMembership._id,
              amount: pendingMembership.price,
              planType: pendingMembership.planType,
              type: 'Membership'
            });
          } else {
            setError('No pending payment information found');
            toast.error('No pending payment information found');
            setLoading(false);
            return;
          }
        }
        
        try {
          // Initialize Stripe
          const stripe = await stripePromise;
          if (!stripe) {
            throw new Error('Stripe failed to initialize');
          }

          // Determine payment type and prepare data
          let paymentData;
          
          if (pendingPaymentData.type === 'SpaService') {
            // SPA service payment
            const bookingId = pendingPaymentData.bookingId;
            console.log('SPA payment with booking ID:', bookingId);
            
            // Check if booking ID is valid MongoDB ObjectId format
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);
            if (!isValidObjectId) {
              throw new Error('Invalid booking ID format');
            }
            
            // First create a pending payment record
            const spaPaymentData = {
              amount: Number(pendingPaymentData.amount) || 50, // Default to 50 if amount is not provided or is 0
              type: 'SpaService',
              bookingId: bookingId,
              userId: user.id,
              description: pendingPaymentData.description || `Booking for ${pendingPaymentData.serviceName || 'SPA Service'}`
            };
            
            // Log the amount to debug
            console.log('SPA payment amount:', pendingPaymentData.amount, 'converted to:', Number(pendingPaymentData.amount) || 50);
            
            console.log('Creating pending payment with data:', spaPaymentData);
            
            try {
              const createPendingPaymentResponse = await API.post('/payments/create-pending', spaPaymentData);
              console.log('Created pending payment:', createPendingPaymentResponse.data);
              
              if (!createPendingPaymentResponse.data || !createPendingPaymentResponse.data._id) {
                throw new Error('Failed to create pending payment record');
              }
              
              // Now use the handleCompletePendingPayment function to process the payment
              await handleCompletePendingPayment(createPendingPaymentResponse.data);
              return;
            } catch (pendingPaymentError) {
              console.error('Error creating pending payment:', pendingPaymentError);
              throw pendingPaymentError;
            }
          } else {
            // Membership payment
            const { membershipId, amount, planType } = pendingPaymentData || {
              membershipId: verifyResponse.data.pendingMembership?._id,
              amount: verifyResponse.data.pendingMembership?.price,
              planType: verifyResponse.data.pendingMembership?.planType
            };
            
            if (!membershipId || !amount || !planType) {
              throw new Error('Missing required payment information');
            }
            
            paymentData = {
              amount: Number(amount),
              type: 'Membership',
              membershipId,
              userId: user.id,
              planType
            };
            console.log('Sending membership payment data to server:', paymentData);
          }
          
          // Create payment on server
          console.log('Attempting to create payment with data:', paymentData);
          
          // Try using fetch directly
          const token = localStorage.getItem('token');
          
          // Try fetch API directly
          const fetchResponse = await fetch('http://localhost:5050/api/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(paymentData)
          });
          
          if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json();
            console.error('Fetch error status:', fetchResponse.status);
            console.error('Fetch error data:', errorData);
            throw new Error(`Server returned ${fetchResponse.status}: ${errorData.message || 'Unknown error'}`);
          }
          
          const responseData = await fetchResponse.json();
          console.log('Fetch payment response:', responseData);
          
          if (!responseData.sessionId) {
            throw new Error('No session ID returned from server');
          }
          
          // Set success message before redirecting
          setSuccessMessage('OTP verified successfully. Redirecting to payment...');
          toast.success('Redirecting to Stripe checkout...');
          
          // Small delay to show the success message
          setTimeout(async () => {
            try {
              console.log('Redirecting to Stripe checkout with sessionId:', responseData.sessionId);
              const { error } = await stripe.redirectToCheckout({ 
                sessionId: responseData.sessionId 
              });
              
              if (error) {
                console.error('Stripe redirect error:', error);
                throw new Error(error.message);
              }
            } catch (redirectError) {
              console.error('Redirect error:', redirectError);
              setError('Failed to redirect to payment page: ' + redirectError.message);
              toast.error('Failed to redirect to payment page');
              setLoading(false);
            }
          }, 1500);
        } catch (paymentError) {
          console.error('Payment creation error:', paymentError);
          
          const errorMessage = paymentError.message || 'Unknown payment error';
          setError('Payment error: ' + errorMessage);
          toast.error('Payment failed: ' + errorMessage);
          setLoading(false);
        }
      } else {
        setError('OTP verification failed');
        toast.error('OTP verification failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in verifyOTPAndPay:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Unknown error';
      setError('Error: ' + errorMessage);
      toast.error('Error: ' + errorMessage);
      setLoading(false);
    }
  };

  const cancelPayment = () => {
    setShowOTPInput(false);
    setPendingPaymentData(null);
    setOtp('');
    setSelectedPlan(null);
  };

  // Function to manually fix membership if needed
  const handleFixMembership = async () => {
    if (!pendingMembership || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.post(`/memberships/fix/${user.id}/${pendingMembership._id}`);
      console.log('Fix membership response:', response.data);
      
      if (response.data.membership) {
        toast.success('Membership activated successfully!');
        await fetchMembership(user.id);
        setPendingMembership(null);
      }
    } catch (error) {
      console.error('Error fixing membership:', error);
      setError('Failed to fix membership. Please try again.');
      toast.error('Failed to fix membership');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle membership change request
  const handleChangeMembership = () => {
    setShowChangeMembership(true);
    setSelectedPlan(null);
    setShowOTPInput(false);
    setOtp('');
    setPendingPaymentData(null);
    setError(null);
    setSuccessMessage('');
  };

  // Function to cancel membership change
  const cancelChangeMembership = () => {
    setShowChangeMembership(false);
    setSelectedPlan(null);
    setShowOTPInput(false);
    setOtp('');
    setPendingPaymentData(null);
  };

  const handleCompletePendingPayment = async (payment) => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }
      
      // If the payment already has a valid Stripe session ID (not a temporary one), use it
      if (payment.stripeSessionId && !payment.stripeSessionId.startsWith('pending-')) {
        console.log('Using existing Stripe session:', payment.stripeSessionId);
        
        const { error } = await stripe.redirectToCheckout({ 
          sessionId: payment.stripeSessionId 
        });
        
        if (error) {
          throw new Error(error.message);
        }
        return;
      }
      
      // Otherwise, create a new payment session
      console.log('Creating new payment session for pending payment:', payment._id);
      
      const paymentData = {
        amount: payment.amount,
        type: payment.type || 'Membership',
        userId: user.id,
        paymentId: payment._id // Pass the existing payment ID
      };
      
      // Add type-specific data
      if (payment.type === 'Membership') {
        paymentData.membershipId = payment.membershipId;
        paymentData.planType = payment.planType;
      } else if (payment.type === 'SpaService') {
        paymentData.bookingId = payment.bookingId;
        paymentData.description = payment.description || 'SPA Service';
      }
      
      console.log('Sending payment data to retry endpoint:', paymentData);
      
      const response = await API.post('/payments/retry', paymentData);
      
      if (!response.data.sessionId) {
        throw new Error('No session ID returned from server');
      }
      
      console.log('Created new Stripe session:', response.data.sessionId);
      
      // Set success message before redirecting
      setSuccessMessage('Redirecting to payment...');
      toast.success('Redirecting to Stripe checkout...');
      
      // Small delay to show the success message
      setTimeout(async () => {
        try {
          // Redirect to Stripe checkout
          const { error } = await stripe.redirectToCheckout({ 
            sessionId: response.data.sessionId 
          });
          
          if (error) {
            throw new Error(error.message);
          }
        } catch (redirectError) {
          console.error('Redirect error:', redirectError);
          setError('Failed to redirect to payment page: ' + redirectError.message);
          toast.error('Failed to redirect to payment page');
          setLoading(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error completing pending payment:', error);
      setError('Failed to complete payment: ' + (error.response?.data?.message || error.message));
      toast.error('Failed to complete payment');
      setLoading(false);
    }
  };

  // If loading, show loading spinner
  if (loading) {
    return (
      <div className="payments-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="payments-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/user/dashboard')} className="otp-button">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const renderPendingMembershipNotice = () => {
    if (!pendingMembership) return null;
    
    return (
      <div className="alert alert-warning">
        <h4>Pending Membership Found</h4>
        <p>You have a pending {pendingMembership.planType} membership.</p>
        <button 
          className="btn btn-primary"
          onClick={handleFixMembership}
          disabled={loading}
        >
          {loading ? 'Fixing...' : 'Fix Membership'}
        </button>
      </div>
    );
  };

  return (
    <div className="payments-container">
      <h2 className="payments-title">Payments</h2>
      
      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      {/* New User Welcome Message */}
      {isNewUser && (
        <div className="membership-status">
          <h3>Welcome to TrackFit!</h3>
          <p>Choose a membership plan to get started with your fitness journey.</p>
        </div>
      )}

      {/* Current Membership Status */}
      {membership && !showChangeMembership && (
        <div className="membership-status">
          <h3>Current Membership</h3>
          <p>
            <strong>Plan:</strong> {membership.planType}
          </p>
          <p>
            <strong>Status:</strong> <span className={`status-${membership.status.toLowerCase()}`}>{membership.status}</span>
          </p>
          <p>
            <strong>Start Date:</strong> {new Date(membership.startDate).toLocaleDateString()}
          </p>
          <p>
            <strong>End Date:</strong> {new Date(membership.endDate).toLocaleDateString()}
          </p>
          <button 
            onClick={handleChangeMembership} 
            className="otp-button mt-4"
          >
            Change Membership
          </button>
        </div>
      )}

      {/* Available Plans */}
      {(showChangeMembership || !membership || selectedPlan) && (
        <div>
          {showChangeMembership && (
            <div className="change-membership-header">
              <h3>Change Your Membership Plan</h3>
              <p>Select a new plan below. Your current plan will be replaced once payment is completed.</p>
              <button onClick={cancelChangeMembership} className="cancel-button">
                Cancel
              </button>
            </div>
          )}
          
          <h3 className="text-xl font-semibold mt-8 mb-4">Available Plans</h3>
          <div className="plan-cards">
            {availablePlans.map((plan) => (
              <div key={plan.type} className={`plan-card ${membership && membership.planType === plan.type ? 'current-plan' : ''}`}>
                <h3>{plan.type}</h3>
                <div className="price">₹{plan.price}</div>
                <div className="duration">{plan.duration}</div>
                {membership && membership.planType === plan.type && !showChangeMembership && (
                  <div className="current-plan-badge">Current Plan</div>
                )}
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <button 
                  onClick={() => handlePlanSelect(plan)}
                  disabled={membership && membership.planType === plan.type && !showChangeMembership}
                  className={membership && membership.planType === plan.type && !showChangeMembership ? 'disabled-button' : ''}
                >
                  {membership && membership.planType === plan.type ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OTP Input */}
      {showOTPInput && (
        <div className="otp-verification-container">
          <h3>Verify Payment</h3>
          <p>Please enter the OTP sent to your email to complete the payment.</p>
          
          {otpExpiry && (
            <p className="otp-expiry">
              OTP expires at {new Date(otpExpiry).toLocaleTimeString()}
            </p>
          )}
          
          <div className="otp-input-container">
            <input
              type="text"
              className="otp-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
            />
            <button 
              className="verify-otp-btn"
              onClick={verifyOTPAndPay}
              disabled={loading || !otp}
            >
              Verify & Pay
            </button>
          </div>
          
          <button 
            className="cancel-btn"
            onClick={cancelPayment}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="payment-history">
          <h3>Payment History</h3>
          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'Pending'}</td>
                  <td>₹{payment.amount}</td>
                  <td>{payment.type}</td>
                  <td>
                    {payment.type === 'Membership' ? payment.planType : 
                     payment.type === 'SpaService' ? 'SPA Service' : 
                     'Other'}
                  </td>
                  <td className={`status-${payment.status.toLowerCase()}`}>
                    {payment.status}
                    {payment.status === 'Pending' && (
                      <>
                        {/* Only show Complete Payment button for payments less than 1 day old */}
                        {payment.createdAt && (new Date() - new Date(payment.createdAt) < 24 * 60 * 60 * 1000) ? (
                          <button 
                            onClick={() => handleCompletePendingPayment(payment)} 
                            className="complete-payment-btn"
                          >
                            Complete Payment
                          </button>
                        ) : null}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renderPendingMembershipNotice()}
    </div>
  );
};

export default Payments;