import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const FixMembership = () => {
  const { user, fetchMembership } = useContext(AuthContext);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.id) {
      setError('User not authenticated');
      return;
    }
    
    const fetchMemberships = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/memberships/user/${user.id}`);
        console.log('Fetched memberships:', response.data);
        setMemberships(response.data);
      } catch (error) {
        console.error('Error fetching memberships:', error);
        setError('Failed to fetch memberships');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMemberships();
  }, [user]);

  const handleFixMembership = async (membershipId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log(`Fixing membership ${membershipId} for user ${user.id}`);
      const response = await API.post(`/memberships/fix/${user.id}/${membershipId}`);
      console.log('Fix membership response:', response.data);
      
      setSuccess('Membership fixed successfully!');
      toast.success('Membership fixed successfully!');
      
      // Refresh membership in AuthContext
      if (fetchMembership) {
        await fetchMembership(user.id);
      }
    } catch (error) {
      console.error('Error fixing membership:', error);
      setError('Failed to fix membership: ' + error.message);
      toast.error('Failed to fix membership');
    } finally {
      setLoading(false);
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

  if (success) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
          <button 
            onClick={() => navigate('/user/dashboard')}
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h3 className="text-2xl font-bold mb-4">Fix Membership</h3>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h4 className="text-xl font-semibold mb-4">Your Memberships</h4>
        
        {memberships.length === 0 ? (
          <p className="text-gray-600">No memberships found.</p>
        ) : (
          <div className="space-y-4">
            {memberships.map((membership) => (
              <div key={membership._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{membership.planType} Plan</p>
                    <p className="text-sm text-gray-600">Status: {membership.status}</p>
                    <p className="text-sm text-gray-600">
                      {membership.startDate ? `Start: ${new Date(membership.startDate).toLocaleDateString()}` : 'Not started'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {membership.endDate ? `End: ${new Date(membership.endDate).toLocaleDateString()}` : 'No end date'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFixMembership(membership._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Fix Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FixMembership; 