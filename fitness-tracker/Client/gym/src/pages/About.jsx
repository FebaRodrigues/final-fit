import React, { useState } from "react";
import "../styles/About.css"; // Import the CSS file
import { FaDumbbell, FaChartLine, FaUsers, FaCalendarAlt, FaSpa, FaTrophy, FaMobileAlt, FaLock } from "react-icons/fa";

const About = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Here you would typically send the data to your backend
    setFormSubmitted(true);
    // Reset form after submission
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
    
    // Reset form submission status after 5 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };

  const programs = [
    {
      title: "Basic Fitness",
      description:
         "Basic Fitness is a simple routine of exercise and consistency for overall health and well-being.",
    },
    {
      title: "New Gym Training",
      description:
        "If you wish to support TemplateMo website via PayPal, please feel free to contact us. We appreciate it a lot.",
    },
    {
      title: "Advanced Muscle Course",
      description:
        "You may want to browse through Digital Marketing or Corporate HTML CSS templates on our website.",
    },
    {
      title: "Yoga Training",
      description:
        "This template is built on Bootstrap v4.3.1 framework. It is easy to adapt the columns and sections.",
    },
    {
      title: "Basic Muscle Course",
      description:
        "Credit goes to Pexels website for images and video background used in this HTML template.",
    },
    {
      title: "Body Building Course",
      description:
        "Suspendisse fringilla et nisi et mattis. Curabitur sed finibus nisi. Integer nibh sapien, vehicula et auctor.",
    },
  ];

  const features = [
    {
      icon: <FaDumbbell />,
      title: "Personalized Workouts",
      description: "Our platform offers customized workout plans tailored to your fitness level, goals, and preferences. Track your progress and see real results."
    },
    {
      icon: <FaChartLine />,
      title: "Progress Tracking",
      description: "Monitor your fitness journey with detailed analytics and progress reports. Set goals, track achievements, and stay motivated."
    },
    {
      icon: <FaUsers />,
      title: "Expert Trainers",
      description: "Connect with certified fitness professionals who provide guidance, feedback, and motivation throughout your fitness journey."
    },
    {
      icon: <FaCalendarAlt />,
      title: "Appointment Scheduling",
      description: "Easily book sessions with trainers, reserve equipment, or sign up for classes with our intuitive scheduling system."
    },
    {
      icon: <FaSpa />,
      title: "Spa Services",
      description: "Relax and recover with our premium spa services, including massage therapy, sauna sessions, and wellness treatments."
    },
    {
      icon: <FaTrophy />,
      title: "Goal Setting",
      description: "Set SMART fitness goals, track your progress, and celebrate achievements with our comprehensive goal management system."
    },
    {
      icon: <FaMobileAlt />,
      title: "Mobile Access",
      description: "Access your fitness data, workout plans, and schedules anytime, anywhere with our responsive web application."
    },
    {
      icon: <FaLock />,
      title: "Secure Platform",
      description: "Your data is protected with industry-standard security measures, ensuring your personal information remains private."
    }
  ];

  return (
    <div className="about-container">
      <div className="about-hero">
        <div className="about-hero-content">
          <h1>About <span className="trackfit-text"><span className="track-part">Track</span><span className="fit-part">Fit</span></span></h1>
          <p>Your Complete Fitness Management Solution</p>
        </div>
      </div>
      
      <div className="about-section">
        <div className="about-content">
          <h2>Our Mission</h2>
          <p>
            At <span className="trackfit-text"><span className="track-part">Track</span><span className="fit-part">Fit</span></span>, we're dedicated to transforming the way people approach fitness and wellness. 
            Our mission is to provide a comprehensive platform that empowers individuals to take control 
            of their fitness journey, connect with expert trainers, and achieve their health goals.
          </p>
          <p>
            We believe that fitness should be accessible, personalized, and enjoyable for everyone. 
            That's why we've created a platform that combines cutting-edge technology with expert 
            guidance to deliver a seamless fitness management experience.
          </p>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Our Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="membership-section">
        <h2>Membership Plans</h2>
        <div className="membership-grid">
          <div className="membership-card">
            <h3>Basic</h3>
            <p className="price">₹1199<span>/month</span></p>
            <ul>
              <li>Access to workout tracking</li>
              <li>Basic progress reports</li>
              <li>Community support</li>
              <li>Mobile access</li>
            </ul>
          </div>
          
          <div className="membership-card featured">
            <div className="popular-tag">Most Popular</div>
            <h3>Premium</h3>
            <p className="price">₹1999<span>/month</span></p>
            <ul>
              <li>Everything in Basic</li>
              <li>Personalized workout plans</li>
              <li>Goal setting and tracking</li>
              <li>Nutrition guidance</li>
              <li>Priority support</li>
            </ul>
          </div>
          
          <div className="membership-card">
            <h3>Elite</h3>
            <p className="price">₹2999<span>/month</span></p>
            <ul>
              <li>Everything in Premium</li>
              <li>1-on-1 trainer sessions</li>
              <li>Advanced analytics</li>
              <li>Spa service discounts</li>
              <li>Exclusive content</li>
              <li>24/7 support</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="contact-section" id="contact">
        <h2>Contact Us</h2>
        <div className="contact-container">
          <div className="contact-info">
            <h3>Get In Touch</h3>
            <p>Have questions about our platform or services? We're here to help!</p>
            <div className="info-item">
              <strong>Email:</strong> info@trackfit.com
            </div>
            <div className="info-item">
              <strong>Phone:</strong> (123) 456-7890
            </div>
            <div className="info-item">
              <strong>Address:</strong> 123 Fitness Street, Wellness City, FC 12345
            </div>
            <div className="info-item">
              <strong>Hours:</strong> Monday-Friday: 9am-6pm
            </div>
          </div>
          
          <div className="contact-form">
            <h3>Send Us a Message</h3>
            {formSubmitted ? (
              <div className="success-message">
                Thank you for your message! We'll get back to you soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input 
                    type="text" 
                    id="subject" 
                    name="subject" 
                    value={formData.subject}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="5" 
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
