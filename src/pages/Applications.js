import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import './Applications.css';

function Applications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchApplications(parsedUser.email);
  }, [navigate]);

  const fetchApplications = async (userEmail) => {
    setLoading(true);
    try {
      const response = await jobsAPI.getSavedJobs(userEmail);
      if (response.data && response.data.jobs) {
        setApplications(response.data.jobs);
        setFilteredApplications(response.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search
  useEffect(() => {
    let filtered = [...applications];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'company':
        filtered.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        break;
      case 'title':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        break;
    }

    setFilteredApplications(filtered);
  }, [searchQuery, statusFilter, sortBy, applications]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      // Update in backend (you'll need to add this endpoint)
      // await jobsAPI.updateJobStatus(jobId, newStatus);
      
      // Update locally
      const updated = applications.map(app => 
        app.id === jobId ? { ...app, status: newStatus } : app
      );
      setApplications(updated);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDeleteApplication = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await jobsAPI.deleteJob(jobId);
      const updated = applications.filter(app => app.id !== jobId);
      setApplications(updated);
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return '#3B82F6';
      case 'interviewing': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied': return '📝';
      case 'interviewing': return '💼';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '📋';
    }
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    pending: applications.filter(a => a.status === 'pending' || !a.status).length,
  };

  if (loading) {
    return (
      <div className="applications-loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="applications-container">
      {/* Header */}
      <div className="applications-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="header-title">
            <h1>My Applications</h1>
            <p>{filteredApplications.length} of {applications.length} applications</p>
          </div>
        </div>

        <div className="header-right">
          <button className="btn-primary" onClick={() => alert('Search jobs feature coming soon!')}>
            + New Application
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Applied</div>
          <div className="stat-value" style={{ color: '#3B82F6' }}>{stats.applied}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Interviewing</div>
          <div className="stat-value" style={{ color: '#F59E0B' }}>{stats.interviewing}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Accepted</div>
          <div className="stat-value" style={{ color: '#10B981' }}>{stats.accepted}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Rejected</div>
          <div className="stat-value" style={{ color: '#EF4444' }}>{stats.rejected}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: '#6B7280' }}>{stats.pending}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by company, title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        <select 
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="company">Company (A-Z)</option>
          <option value="title">Job Title (A-Z)</option>
        </select>

        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ⊞
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No applications found</h3>
          <p>
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Start applying to jobs to see them here'}
          </p>
          <button className="btn-primary" onClick={() => alert('Search jobs feature coming soon!')}>
            Search Jobs
          </button>
        </div>
      ) : (
        <div className={`applications-grid ${viewMode}`}>
          {filteredApplications.map((app) => (
            <div key={app.id} className="application-card">
              <div className="card-header">
                <div className="company-logo">
                  {app.company?.charAt(0) || '🏢'}
                </div>
                <div className="card-actions">
                  <button className="action-btn" title="Edit">✏️</button>
                  <button 
                    className="action-btn" 
                    title="Delete"
                    onClick={() => handleDeleteApplication(app.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="card-body">
                <h3 className="job-title">{app.title || 'Job Position'}</h3>
                <p className="company-name">{app.company || 'Company Name'}</p>
                <p className="job-location">📍 {app.location || 'Location not specified'}</p>

                {app.description && (
                  <p className="job-description">
                    {app.description.length > 100 
                      ? app.description.substring(0, 100) + '...' 
                      : app.description}
                  </p>
                )}

                <div className="card-meta">
                  <span className="applied-date">
                    🗓️ {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <select 
                  className="status-select"
                  value={app.status || 'pending'}
                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                  style={{ borderColor: getStatusColor(app.status) }}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="applied">📝 Applied</option>
                  <option value="interviewing">💼 Interviewing</option>
                  <option value="accepted">✅ Accepted</option>
                  <option value="rejected">❌ Rejected</option>
                </select>

                {app.url && (
                  <a 
                    href={app.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-job-btn"
                  >
                    View Job →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Applications;
