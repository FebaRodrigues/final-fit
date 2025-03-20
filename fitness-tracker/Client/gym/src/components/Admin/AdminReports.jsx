// src/components/Admin/AdminReports.jsx
import React, { useEffect, useState } from 'react';
import API from '../../api';

const AdminReports = () => {
    const [revenue, setRevenue] = useState({});
    const [activity, setActivity] = useState({});

    useEffect(() => {
        const fetchReports = async () => {
            const revenueRes = await API.get('/reports/revenue');
            const activityRes = await API.get('/reports/user-activity');
            setRevenue(revenueRes.data);
            setActivity(activityRes.data);
        };
        fetchReports();
    }, []);

    return (
        <div>
            <h2>Reports & Analytics</h2>
            <h3>Revenue</h3>
            <p>Total Revenue: ${revenue.totalRevenue || 0}</p>
            <p>Payment Count: {revenue.paymentCount || 0}</p>
            <h3>User Activity</h3>
            <p>Active Users (Last 30 Days): {activity.activeUserCount || 0}</p>
            <p>Total Users: {activity.totalUsers || 0}</p>
        </div>
    );
};
export default AdminReports;