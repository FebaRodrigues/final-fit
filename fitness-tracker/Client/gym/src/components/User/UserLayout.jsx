import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import Navbar from '../Navbar';
import Footer from '../Footer';
import './UserLayout.css';

const UserLayout = () => {
  const location = useLocation();
  
  // Check if we're on a public page (home, about, login, etc.)
  const isPublicPage = [
    '/', 
    '/about', 
    '/services', 
    '/trainers', 
    '/pricing', 
    '/contact',
    '/announcements',
    '/users/login', 
    '/users/register', 
    '/trainers/login', 
    '/trainers/register',
    '/admin/login',
    '/admin/register'
  ].includes(location.pathname);

  // Check if we're on the home page specifically
  const isHomePage = location.pathname === '/';
  
  // Check if we're on the home or about page
  const isHomeOrAboutPage = ['/', '/about'].includes(location.pathname);

  return (
    <div className={`user-layout ${isHomePage ? 'home-layout' : ''}`}>
      {/* Only show Navbar on home and about pages */}
      {isHomeOrAboutPage && <Navbar />}
      
      {!isPublicPage && <UserSidebar />}
      
      <div className={`content-container ${isPublicPage ? 'full-width' : ''}`}>
        {!isPublicPage ? (
          <div className="content-wrapper">
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </div>
      
      {/* Show footer on all pages except home page which has its own footer */}
      {!isHomePage && <Footer />}
    </div>
  );
};

export default UserLayout; 