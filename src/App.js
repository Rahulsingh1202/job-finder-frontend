import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import JobSearch from './pages/JobSearch'; 
import ResumeUpload from './pages/ResumeUpload';
import ManageResume from './pages/ManageResume';


import './App.css';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/applications" 
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobSearch />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/resume" 
            element={
              <ProtectedRoute>
                <ResumeUpload />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/manage-resume" 
            element={
              <ProtectedRoute>
                <ManageResume />
              </ProtectedRoute>
            } 
          />

          

          <Route 
            path="/" 
            element={
              isAuthenticated() ? 
                <Navigate to="/dashboard" /> : 
                <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
