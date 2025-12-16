import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI, resumeAPI, jobsAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    ended: 0,
    running: 0,
    pending: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [resumeStatus, setResumeStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTrackerRunning, setIsTrackerRunning] = useState(false);
  const [trackerTime, setTrackerTime] = useState(0);

  // Initialize user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch all dashboard data
    fetchDashboardData(parsedUser.email);
  }, [navigate]);

  // Fetch all dashboard data
  const fetchDashboardData = async (userEmail) => {
    setLoading(true);
    try {
      // Fetch stats
      await fetchStats(userEmail);
      
      // Fetch saved jobs
      await fetchSavedJobs(userEmail);
      
      // Fetch resume status
      await fetchResumeStatus(userEmail);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async (userEmail) => {
    try {
      const response = await statsAPI.getDashboardStats(userEmail);
      if (response.data && response.data.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Stats endpoint not available:', error);
      // Calculate from saved jobs
      try {
        const jobsResponse = await jobsAPI.getSavedJobs(userEmail);
        const jobs = jobsResponse.data.jobs || [];
        
        setStats({
          totalApplications: jobs.length,
          ended: jobs.filter(j => j.status === 'rejected' || j.status === 'accepted').length,
          running: jobs.filter(j => j.status === 'interviewing' || j.status === 'applied').length,
          pending: jobs.filter(j => j.status === 'pending' || !j.status).length
        });
      } catch (err) {
        console.error('Error calculating stats:', err);
      }
    }
  };

  // Fetch saved jobs
  const fetchSavedJobs = async (userEmail) => {
    try {
      const response = await jobsAPI.getSavedJobs(userEmail);
      if (response.data && response.data.jobs) {
        setSavedJobs(response.data.jobs.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  // Fetch resume status
  const fetchResumeStatus = async (userEmail) => {
    try {
      const response = await resumeAPI.getResume(userEmail);
      if (response.data && response.data.data) {
        setResumeStatus(response.data.data);
      }
    } catch (error) {
      console.error('Resume not found:', error);
      setResumeStatus(null);
    }
  };

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_email', user.email);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await resumeAPI.upload(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.status === 'success') {
        alert('Resume uploaded successfully!');
        await fetchResumeStatus(user.email);
        await fetchStats(user.email);
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isTrackerRunning) {
        setTrackerTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isTrackerRunning]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="loading">Redirecting...</div>;
  }

  const upcomingTasks = [
    { icon: '🎯', title: 'Update your resume', deadline: 'High Priority' },
    { icon: '📊', title: 'Complete profile', deadline: 'Medium Priority' },
    { icon: '💼', title: 'Apply to 5 jobs', deadline: 'This Week' },
    { icon: '⚡', title: 'Network with recruiters', deadline: 'Ongoing' },
    { icon: '🔍', title: 'Research companies', deadline: 'This Week' }
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-circle">💼</div>
            <span className="logo-name">JobFinder</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">MENU</span>
            <a href="#" className="nav-item active">
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </a>
            <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/applications'); }}>
              <span className="nav-icon">📝</span>
              <span className="nav-text">Applications</span>
              <span className="nav-badge">{stats.running}</span>
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">📅</span>
              <span className="nav-text">Calendar</span>
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">📈</span>
              <span className="nav-text">Analytics</span>
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">💾</span>
              <span className="nav-text">Saved Jobs</span>
              <span className="nav-badge">{savedJobs.length}</span>
            </a>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">GENERAL</span>
            <a href="#" className="nav-item">
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </a>
            <a href="#" className="nav-item">
              <span className="nav-icon">❓</span>
              <span className="nav-text">Help</span>
            </a>
            <a href="#" className="nav-item" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span className="nav-text">Logout</span>
            </a>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="app-download-card">
            <div className="app-icon">📱</div>
            <h4 className="app-title">Download our Mobile App</h4>
            <p className="app-subtitle">Get easy access on the go</p>
            <button className="download-btn">Download</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search jobs..." className="search-input" />
            <kbd className="search-shortcut">⌘ F</kbd>
          </div>

          <div className="header-actions">
            <button className="icon-btn">📧</button>
            <button className="icon-btn">🔔</button>
            <div className="user-menu">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="user-avatar-img"
                  onError={(e) => {
                    console.error('Failed to load profile picture:', user.picture);
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* Fallback Avatar */}
              <div 
                className="user-avatar-fallback"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: user.picture ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
              >
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
              
              <div className="user-details">
                <span className="user-name-text">{user.name}</span>
                <span className="user-email-text">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Title */}
        <div className="dashboard-title-section">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Plan, prioritize, and track your job applications with ease.</p>
          </div>
          <div className="title-actions">
            <button className="btn-primary-action" onClick={() => navigate('/jobs')}>
                + Search Jobs
            </button>
            
            {resumeStatus ? (
                <button className="btn-secondary-action" onClick={() => navigate('/manage-resume')}>
                ✏️ Manage Resume
                </button>
            ) : (
                <label className="btn-secondary-action" style={{ cursor: 'pointer' }}>
                📤 Upload Resume
                <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    style={{ display: 'none' }}
                />
                </label>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-notification">
            <span>Uploading resume... {uploadProgress}%</span>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card-main">
            <div className="stat-card-header">
              <span className="stat-label-white">Total Applications</span>
              <button className="stat-arrow-btn">↗</button>
            </div>
            <div className="stat-value-large">{stats.totalApplications}</div>
            <div className="stat-change-positive">
              <span className="change-icon">📈</span>
              <span>Track your progress</span>
            </div>
          </div>

          <div className="stat-card-light">
            <div className="stat-card-header">
              <span className="stat-label-dark">Completed</span>
              <button className="stat-arrow-btn-dark">↗</button>
            </div>
            <div className="stat-value-dark">{stats.ended}</div>
            <div className="stat-change-positive-dark">
              <span className="change-icon">✅</span>
              <span>Applications closed</span>
            </div>
          </div>

          <div className="stat-card-light">
            <div className="stat-card-header">
              <span className="stat-label-dark">In Progress</span>
              <button className="stat-arrow-btn-dark">↗</button>
            </div>
            <div className="stat-value-dark">{stats.running}</div>
            <div className="stat-change-positive-dark">
              <span className="change-icon">🔄</span>
              <span>Active applications</span>
            </div>
          </div>

          <div className="stat-card-light">
            <div className="stat-card-header">
              <span className="stat-label-dark">Pending</span>
              <button className="stat-arrow-btn-dark">↗</button>
            </div>
            <div className="stat-value-dark">{stats.pending}</div>
            <div className="stat-change-neutral">
              <span>Awaiting response</span>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="content-grid">
          {/* Left Column */}
          <div className="grid-left">
            {/* Analytics Chart */}
            <div className="card">
              <h3 className="card-title-main">Application Analytics</h3>
              <div className="chart-area">
                <div className="chart-bars">
                  <div className="chart-bar" style={{ height: '60%', background: 'repeating-linear-gradient(45deg, #E5E7EB, #E5E7EB 10px, transparent 10px, transparent 20px)' }}></div>
                  <div className="chart-bar active" style={{ height: '85%' }}></div>
                  <div className="chart-bar active" style={{ height: '70%' }}></div>
                  <div className="chart-bar active" style={{ height: '95%' }}></div>
                  <div className="chart-bar" style={{ height: '50%', background: 'repeating-linear-gradient(45deg, #E5E7EB, #E5E7EB 10px, transparent 10px, transparent 20px)' }}></div>
                  <div className="chart-bar" style={{ height: '65%', background: 'repeating-linear-gradient(45deg, #E5E7EB, #E5E7EB 10px, transparent 10px, transparent 20px)' }}></div>
                  <div className="chart-bar" style={{ height: '55%', background: 'repeating-linear-gradient(45deg, #E5E7EB, #E5E7EB 10px, transparent 10px, transparent 20px)' }}></div>
                </div>
                <div className="chart-labels">
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>
              </div>
            </div>

            {/* Saved Jobs */}
            <div className="card">
              <div className="card-header-with-action">
                <h3 className="card-title-main">Saved Jobs ({savedJobs.length})</h3>
                <button className="add-member-btn" onClick={() => alert('View all jobs feature coming soon!')}>
                  View All
                </button>
              </div>
              <div className="team-list">
                {savedJobs.length > 0 ? (
                  savedJobs.map((job, index) => (
                    <div key={index} className="team-member">
                      <div className="member-avatar" style={{ background: '#065f46' }}>
                        💼
                      </div>
                      <div className="member-info">
                        <div className="member-name">{job.title || 'Job Position'}</div>
                        <div className="member-task">{job.company || 'Company Name'}</div>
                      </div>
                      <span className="member-status" style={{ 
                        background: job.status === 'applied' ? '#10B981' : 
                                   job.status === 'interviewing' ? '#F59E0B' : 
                                   job.status === 'rejected' ? '#EF4444' : 
                                   job.status === 'accepted' ? '#059669' : '#6B7280' 
                      }}>
                        {job.status || 'Saved'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '16px' }}>
                      No saved jobs yet. Start searching!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="grid-middle">
            {/* Resume Status */}
            <div className="card">
              <h3 className="card-title-main">Resume Status</h3>
              <div className="reminder-box">
                {resumeStatus ? (
                  <>
                    <h4 className="reminder-title">✅ Resume Uploaded</h4>
                    <p className="reminder-time">
                      Name: {resumeStatus.name || 'N/A'}
                    </p>
                    <p className="reminder-time">
                      Skills: {resumeStatus.skills?.length || 0} detected
                    </p>
                    <button className="start-meeting-btn" onClick={() => alert('View resume feature coming soon!')}>
                      <span>📄</span>
                      View Resume
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="reminder-title">📄 No Resume Yet</h4>
                    <p className="reminder-time">Upload your resume to get started</p>
                    <label className="start-meeting-btn" style={{ cursor: 'pointer' }}>
                      <span>⬆️</span>
                      Upload Resume
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={handleResumeUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="card">
              <h3 className="card-title-main">Application Progress</h3>
              <div className="progress-container">
                <div className="progress-circle">
                  <svg viewBox="0 0 200 200" className="progress-svg">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#E5E7EB" strokeWidth="20"/>
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#065f46" 
                      strokeWidth="20" 
                      strokeDasharray="502" 
                      strokeDashoffset={502 - (502 * (stats.totalApplications > 0 ? (stats.ended / stats.totalApplications) : 0))}
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div className="progress-text">
                    <div className="progress-percentage">
                      {stats.totalApplications > 0 ? Math.round((stats.ended / stats.totalApplications) * 100) : 0}%
                    </div>
                    <div className="progress-label">Completed</div>
                  </div>
                </div>
              </div>
              <div className="progress-legend">
                <div className="legend-item">
                  <span className="legend-dot completed"></span>
                  <span>Completed ({stats.ended})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot in-progress"></span>
                  <span>In Progress ({stats.running})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot pending"></span>
                  <span>Pending ({stats.pending})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="grid-right">
            {/* Upcoming Tasks */}
            <div className="card">
              <div className="card-header-with-action">
                <h3 className="card-title-main">Tasks</h3>
                <button className="new-task-btn">+ New</button>
              </div>
              <div className="tasks-list">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="task-item">
                    <span className="task-icon">{task.icon}</span>
                    <div className="task-content">
                      <div className="task-name">{task.title}</div>
                      <div className="task-deadline">{task.deadline}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Tracker */}
            <div className="card time-tracker-card">
              <h3 className="card-title-white">Time Tracker</h3>
              <div className="tracker-time">{formatTime(trackerTime)}</div>
              <div className="tracker-controls">
                <button 
                  className="tracker-btn pause"
                  onClick={() => setIsTrackerRunning(!isTrackerRunning)}
                >
                  {isTrackerRunning ? '⏸' : '▶'}
                </button>
                <button 
                  className="tracker-btn stop"
                  onClick={() => {
                    setIsTrackerRunning(false);
                    setTrackerTime(0);
                  }}
                >
                  ⏹
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
