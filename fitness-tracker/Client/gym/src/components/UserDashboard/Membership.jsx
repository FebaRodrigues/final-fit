// src/components/UserDashboard/Membership.jsx
import React, { useContext, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import API from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Membership = () => {
  const { user } = useContext(AuthContext);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = [
    { 
      type: 'Basic', 
      price: 1199, 
      duration: 'Monthly',
      features: ['Access to gym equipment', 'Basic workout tracking', 'Community forum access']
    },
    { 
      type: 'Premium', 
      price: 1999, 
      duration: 'Monthly',
      features: ['All Basic features', 'Personal trainer consultation', 'Group classes']
    },
    { 
      type: 'Elite', 
      price: 2999, 
      duration: 'Monthly',
      features: ['All Premium features', 'Unlimited trainer sessions', 'Priority booking', 'Progress analytics']
    },
  ];

  useEffect(() => {
    fetchMemberships();
  }, [user]);

  const fetchMemberships = async () => {
    try {
      const response = await API.get(`/memberships/user/${user.id}`);
      setMemberships(response.data);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast.error('Failed to fetch memberships');
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setLoading(true);
      setError(null);

      // Create membership first
      const membershipResponse = await API.post('/memberships', {
        userId: user.id,
        planType: plan.type,
        duration: plan.duration,
        price: plan.price,
      });

      // Request OTP
      const otpResponse = await API.post('/payments/send-otp', {
        userId: user.id,
        email: user.email
      });

      if (otpResponse.data.message === 'OTP sent successfully') {
        // Redirect to payments page with membership data
        window.location.href = `/user/payments?membershipId=${membershipResponse.data._id}&amount=${plan.price}&planType=${plan.type}`;
        toast.info('Please check your email for OTP verification');
      }
    } catch (error) {
      console.error('Error initiating subscription:', error);
      setError('Failed to initiate subscription. Please try again.');
      toast.error('Subscription failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Membership Plans</h2>

        {/* Current Memberships */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Active Memberships</h3>
          {memberships.length > 0 ? (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              {memberships.map((membership) => (
                <div key={membership._id} className="p-6 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-medium">{membership.planType} Plan</h4>
                      <p className="text-gray-600">{membership.duration} - ₹{membership.price}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(membership.status)}`}>
                      {membership.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No active memberships</p>
          )}
        </div>

        {/* Available Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.type} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-4">{plan.type}</h3>
                <div className="text-4xl font-bold mb-6">
                  ₹{plan.price}
                  <span className="text-lg text-gray-600">/{plan.duration.toLowerCase()}</span>
                </div>
                <ul className="mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Membership;