import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import './LoginPage.css';


function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentCard, setCurrentCard] = useState(0);


  // Feature showcase cards with image URLs
  const featureCards = [
    {
      id: 1,
      subtitle: 'Real-Time Insights',
      title: 'Jobs that suits you',
      image: '/JOBSBG.jpg', // Add your image path
      stats: {
        label: 'Jobs Found',
        value: '2100',
        change: '+30.4%'
      }
    },
    {
      id: 2,
      subtitle: 'Personalized Analytics',
      title: 'Direct HR Emails',
      image: '/Hremails.jpg', // Add your image path
      stats: {
        label: 'Jobs Matched',
        value: '1,247',
        change: '+12.4%'
      }
    },
    {
      id: 3,
      subtitle: 'Smart Matching',
      title: 'AI-Powered Job Search',
      image: '/Aiddd.jpg', // Add your image path
      stats: {
        label: 'Success Rate',
        value: '94.5%',
        change: '+8.2%'
      }
    },
    {
      id: 4,
      subtitle: 'Career Growth',
      title: 'Track Your Applications',
      image: '/Application.jpg', // Add your image path
      stats: {
        label: 'Applications',
        value: '342',
        change: '+15.3%'
      }
    }
  ];


  // Auto-rotate cards every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % featureCards.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featureCards.length]);


  const handleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyGoogleToken(
        credentialResponse.credential
      );

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleLoginError = () => {
    setError('Google login failed. Please try again.');
  };


  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      {/* Outer Background */}
      <div className="login-page-background">
        
        {/* White Container Card */}
        <div className="login-container-card">
          
          {/* Left Side - Login Form */}
          <div className="login-left-section">
            {/* Grid Background Pattern */}
            <div className="grid-pattern"></div>

            <div className="login-content">
              {/* Logo Icon */}
              <div className="brand-logo">
                <div className="logo-box">
                  <span className="logo-circle"></span>
                  <span className="logo-point"></span>
                </div>
              </div>

              {/* Welcome Text */}
              <h1 className="heading-text">Welcome back</h1>
              <p className="subheading-text">Welcome back! Please enter your details.</p>

              {/* Error Message */}
              {error && (
                <div className="error-alert">
                  ⚠️ {error}
                </div>
              )}

              {/* Google Sign In Button */}
              <div className="signin-area">
                {loading ? (
                  <div className="loader-box">
                    <div className="loader-spin"></div>
                    <p className="loader-message">Signing you in...</p>
                  </div>
                ) : (
                  <div className="google-btn-wrapper">
                    <GoogleLogin
                      onSuccess={handleLoginSuccess}
                      onError={handleLoginError}
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      width="360"
                    />
                  </div>
                )}
              </div>

              {/* Sign Up Link */}
              <div className="signup-section">
                <p className="signup-prompt">
                  Don't have an account? <a href="#" className="signup-action">Sign up</a>
                </p>
              </div>
            </div>
          </div>


          {/* Right Side - Purple Card */}
          <div className="login-right-section">
            <div className="purple-inner-card">
              {/* Decorative waves */}
              <div className="wave-decoration wave-1"></div>
              <div className="wave-decoration wave-2"></div>
              <div className="wave-decoration wave-3"></div>

              {/* User Avatars */}
              <div className="user-avatars-row">
                <div className="user-avatar">👨‍💼</div>
                <div className="user-avatar">👩‍💻</div>
                <div className="user-avatar">👨‍🎓</div>
                <div className="user-avatar">👩‍🔬</div>
              </div>

              {/* Website URL */}
              <div className="website-badge">jobfinder.com</div>

              {/* Card Carousel */}
              <div className="cards-carousel">
                {/* Progress Indicators */}
                <div className="card-indicators">
                  {featureCards.map((_, index) => (
                    <div
                      key={index}
                      className={`indicator-dot ${currentCard === index ? 'active' : ''}`}
                      onClick={() => setCurrentCard(index)}
                    />
                  ))}
                </div>

                {/* Animated Feature Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCard}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ 
                      duration: 0.6, 
                      ease: [0.4, 0, 0.2, 1],
                      type: "spring",
                      stiffness: 100
                    }}
                    className="feature-showcase-card"
                  >
                    {/* INNER DIV 1 - Image Section */}
                    <div className="card-image-section">
                      <img 
                        src={featureCards[currentCard].image} 
                        alt={featureCards[currentCard].title}
                        className="card-feature-image"
                      />
                      <div className="image-overlay">
                        <span className="card-subtitle-badge">
                          {featureCards[currentCard].subtitle}
                        </span>
                      </div>
                    </div>

                    {/* INNER DIV 2 - Text/Stats Section */}
                    <div className="card-content-section">
                      <h2 className="card-title-text">
                        {featureCards[currentCard].title}
                      </h2>

                      <div className="stats-row">
                        <div className="stat-item">
                          <div className="stat-label">
                            {featureCards[currentCard].stats.label}
                          </div>
                          <div className="stat-value">
                            {featureCards[currentCard].stats.value}
                          </div>
                        </div>
                        <div className="stat-change">
                          {featureCards[currentCard].stats.change}
                        </div>
                      </div>

                      {/* Bottom Info */}
                      <div className="card-footer">
                        <div className="card-bottom-avatars">
                          <div className="mini-avatar">👤</div>
                          <div className="mini-avatar">👤</div>
                          <div className="mini-avatar">👤</div>
                        </div>
                        <div className="card-footer-text">jobfinder.com</div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </div>
    </GoogleOAuthProvider>
  );
}


export default LoginPage;
