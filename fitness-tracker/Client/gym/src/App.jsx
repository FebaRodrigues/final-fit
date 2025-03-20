// src/App.jsx
import React, { useEffect, useState } from "react";
import { 
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
  Route,
  Outlet,
  useNavigate
} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css'; // Import global CSS
import './styles/UserGoalForm.css'; // Import Goals CSS
import './styles/GoalCard.css'; // Import GoalCard CSS
import './styles/GoalStats.css'; // Import GoalStats CSS
import './styles/GoalsDashboard.css'; // Import GoalsDashboard CSS
import './styles/GoalForm.css'; // Import GoalForm CSS
import './styles/FeatureAccessCheck.css'; // Import FeatureAccessCheck CSS
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import detectServerPort, { resetPortDetection } from "./utils/serverPortDetector";
import ConnectionStatus from "./components/common/ConnectionStatus";
import Footer from "./components/Footer";
import FeatureAccessCheck from "./components/common/FeatureAccessCheck";
import axios from "axios";

// Import layouts
import UserLayout from "./components/User/UserLayout";

// Import components directly
import Home from "./pages/Home";
import About from "./pages/About";
import UserLogin from "./components/UserDashboard/UserLogin";
import UserRegister from "./components/UserDashboard/UserRegister";
import UserDashboard from "./components/UserDashboard/UserDashboard";
import EditProfile from "./components/UserDashboard/EditProfile";
import Membership from "./components/UserDashboard/Membership";
import Payments from "./components/UserDashboard/Payments";
import PaymentSuccess from "./components/UserDashboard/PaymentSuccess";
import WorkoutLog from "./components/UserDashboard/WorkoutLog";
import GoalsDashboard from "./components/Goals/GoalsDashboard";
import GoalForm from "./components/Goals/GoalForm";
import GoalProgressForm from "./components/Goals/GoalProgressForm";
import Appointments from "./components/UserDashboard/Appointments";
import SpaServices from "./components/UserDashboard/SpaServices";
import Notifications from "./components/UserDashboard/Notifications";
import TrainerLogin from "./components/Trainer/TrainerLogin";
import TrainerRegister from "./components/Trainer/TrainerRegister";
import TrainerPayments from "./components/Trainer/TrainerPayments";
import TrainerManagement from "./components/Admin/TrainerManagement";
import TrainerDashboard from "./components/Trainer/TrainerDashboard";
import AdminDashboard from "./components/Admin/AdminDashboard";
import TrainerNavbar from "./components/Navbar/TrainerNav";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminRegister from "./components/Admin/AdminRegister";
import Announcements from './components/Announcements';
// Import additional trainer components
import ClientManagement from "./components/Trainer/ClientManagement";
import WorkoutPlans from "./components/Trainer/WorkoutPlans";
import TrainerGoalManagement from "./components/Trainer/TrainerGoalManagement";
import TrainerGoalForm from "./components/Trainer/TrainerGoalForm";
import PerformanceAnalytics from "./components/Trainer/PerformanceAnalytics";
import ProgressReports from "./components/Trainer/ProgressReports";
import TrainerNotifications from "./components/Trainer/TrainerNotifications";
import TrainerProfile from "./components/Trainer/TrainerProfile";
import SubscriptionManagement from "./components/Admin/SubscriptionManagement";
import AdminAnnouncements from './components/Admin/AdminAnnouncements';
// Import the new AdminLayout component
import AdminLayout from "./components/Admin/AdminLayout";
import AdminSettings from "./components/Admin/AdminSettings";
import UserManagement from "./components/Admin/UserManagement";
import ContentManagement from "./components/Admin/ContentManagement";
import SpaManagement from "./components/Admin/SpaManagement";
import AnalyticsReporting from "./components/Admin/AnalyticsReporting";
import TrainerLayout from "./components/Trainer/TrainerLayout";
import TrainerAppointments from "./components/Trainer/TrainerAppointments";

// Main Layout component with toast container and connection status
const MainLayout = () => {
  return (
    <div className="app-container">
      <Outlet />
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <ConnectionStatus />
    </div>
  );
};

// Main App component
const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);

  // Add a useEffect to fetch admin profile if user is logged in as admin
  useEffect(() => {
    const fetchAdminProfile = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      
      if (token && role === 'admin') {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAdminProfile(response.data.admin);
        } catch (error) {
          console.error('Error fetching admin profile:', error);
        }
      }
    };
    
    fetchAdminProfile();
  }, []);

  // Create router with future flags - MOVED INSIDE THE COMPONENT
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<MainLayout />}>
        {/* Public Routes with UserLayout */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/users/login" element={<UserLogin />} />
          <Route path="/users/register" element={<UserRegister />} />
          <Route path="/trainers/login" element={<TrainerLogin />} />
          <Route path="/trainers/register" element={<TrainerRegister />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Route>
        
        {/* Protected User Routes */}
        <Route path="/user" element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="profile" element={<EditProfile />} />
            <Route path="membership" element={<Membership />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/success" element={<PaymentSuccess />} />
            <Route path="workout-log" element={<WorkoutLog />} />
            
            {/* Wrap goals routes with FeatureAccessCheck */}
            <Route path="goals" element={
              <FeatureAccessCheck feature="goals">
                <GoalsDashboard />
              </FeatureAccessCheck>
            } />
            <Route path="goals/new" element={
              <FeatureAccessCheck feature="goals">
                <GoalForm />
              </FeatureAccessCheck>
            } />
            <Route path="goals/progress/:goalId" element={
              <FeatureAccessCheck feature="goals">
                <GoalProgressForm />
              </FeatureAccessCheck>
            } />
            
            <Route path="notifications" element={<Notifications />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="spa" element={<SpaServices />} />
          </Route>
        </Route>
        
        {/* Protected Trainer Routes */}
        <Route path="/trainer" element={<ProtectedRoute isTrainerRoute={true} />}>
          <Route element={<TrainerLayout />}>
            <Route path="dashboard" element={<TrainerDashboard />} />
            <Route path="clients" element={<ClientManagement />} />
            <Route path="workout-plans" element={<WorkoutPlans />} />
            <Route path="appointments" element={<TrainerAppointments />} />
            <Route path="goals" element={<TrainerGoalManagement />} />
            <Route path="goals/new" element={<TrainerGoalForm />} />
            <Route path="goals/edit/:goalId" element={<TrainerGoalForm />} />
            <Route path="analytics" element={<PerformanceAnalytics />} />
            <Route path="progress-reports" element={<ProgressReports />} />
            <Route path="payments" element={<TrainerPayments />} />
            <Route path="notifications" element={<TrainerNotifications />} />
            <Route path="profile" element={<TrainerProfile />} />
          </Route>
        </Route>
        
        <Route path="/trainers/profile/:trainerId" element={<ProtectedRoute isTrainerRoute={true} />}>
          <Route element={<TrainerLayout />}>
            <Route index element={<TrainerProfile />} />
          </Route>
        </Route>
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute isAdminRoute={true} />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="trainers" element={<TrainerManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="spa" element={<SpaManagement />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="membership" element={<SubscriptionManagement />} />
            <Route path="payments" element={<SubscriptionManagement />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="analytics" element={<AnalyticsReporting />} />
            <Route path="settings" element={<AdminSettings adminProfile={adminProfile} setAdminProfile={setAdminProfile} />} />
          </Route>
        </Route>

        <Route path="/announcements" element={<Announcements />} />
      </Route>
    ),
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    }
  );

  // Show loading indicator while detecting port
  if (isLoading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '50%',
          borderTop: '5px solid #3498db',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2>Connecting to server...</h2>
        <p>Please wait while we establish a connection</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <RouterProvider router={router} />
  );
};

export default App;