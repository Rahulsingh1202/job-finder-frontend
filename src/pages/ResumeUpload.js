import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI } from '../services/api';
import './ResumeUpload.css';

function ResumeUpload() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumeData, setResumeData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseStatus, setParseStatus] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch existing resume
    fetchResume(parsedUser.email);
  }, [navigate]);

  const fetchResume = async (userEmail) => {
    setLoading(true);
    try {
      const response = await resumeAPI.getResume(userEmail);
      if (response.data && response.data.data) {
        setResumeData(response.data.data);
      }
    } catch (error) {
      console.log('No resume found yet');
      setResumeData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setParseStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_email', user.email);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      setParseStatus('Parsing resume...');
      const response = await resumeAPI.upload(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.status === 'success') {
        setParseStatus('Resume uploaded successfully!');
        
        // Show parsed data
        if (response.data.data) {
          setResumeData(response.data.data);
        }
        
        setTimeout(() => {
          setSelectedFile(null);
          setUploadProgress(0);
          setParseStatus('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setParseStatus('Upload failed. Please try again.');
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setParseStatus('');
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your resume? This action cannot be undone.')) {
      return;
    }

    try {
      // You'll need to add this endpoint to your backend
      // await resumeAPI.deleteResume(user.email);
      setResumeData(null);
      alert('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume');
    }
  };

  if (loading) {
    return (
      <div className="resume-loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="resume-upload-container">
      {/* Header */}
      <div className="resume-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="header-title">
            <h1>Resume Management</h1>
            <p>Upload and manage your resume</p>
          </div>
        </div>
      </div>

      <div className="resume-content">
        {/* Upload Section */}
        <div className="upload-section">
          <div className="upload-card">
            <h2 className="section-title">📄 Upload Resume</h2>
            
            {!selectedFile ? (
              <div 
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="drop-icon">📤</div>
                <h3>Drag and drop your resume here</h3>
                <p>or</p>
                <label className="file-select-btn">
                  Choose File
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className="file-hint">PDF format only • Max 5MB</span>
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <h4 className="file-name">{selectedFile.name}</h4>
                    <p className="file-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!uploading && (
                    <button className="remove-btn" onClick={handleRemoveFile}>
                      ✕
                    </button>
                  )}
                </div>

                {uploading && (
                  <>
                    <div className="upload-progress-bar">
                      <div 
                        className="upload-progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="parse-status">{parseStatus}</p>
                  </>
                )}

                {!uploading && uploadProgress === 0 && (
                  <button className="upload-btn" onClick={handleUpload}>
                    Upload Resume
                  </button>
                )}

                {uploadProgress === 100 && (
                  <div className="success-message">
                    ✅ {parseStatus}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resume Tips */}
          <div className="tips-card">
            <h3 className="tips-title">💡 Resume Tips</h3>
            <ul className="tips-list">
              <li>Use a clear, professional format</li>
              <li>Include relevant skills and technologies</li>
              <li>List your work experience in reverse chronological order</li>
              <li>Quantify achievements with numbers when possible</li>
              <li>Keep it concise (1-2 pages recommended)</li>
              <li>Proofread for spelling and grammar errors</li>
            </ul>
          </div>
        </div>

        {/* Resume Data Section */}
        {resumeData && (
          <div className="resume-data-section">
            <div className="data-header">
              <h2 className="section-title">📋 Current Resume</h2>
              <button className="delete-btn" onClick={handleDeleteResume}>
                🗑️ Delete Resume
              </button>
            </div>

            <div className="data-cards">
              {/* Personal Info */}
              <div className="data-card">
                <h3 className="card-title">Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{resumeData.name || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{resumeData.email || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{resumeData.phone || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Uploaded:</span>
                    <span className="info-value">
                      {resumeData.uploaded_at 
                        ? new Date(resumeData.uploaded_at).toLocaleDateString() 
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="data-card">
                <h3 className="card-title">
                  Extracted Skills ({resumeData.skills?.length || 0})
                </h3>
                {resumeData.skills && resumeData.skills.length > 0 ? (
                  <div className="skills-grid">
                    {resumeData.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No skills detected</p>
                )}
              </div>

              {/* Education */}
              {resumeData.education && (
                <div className="data-card">
                  <h3 className="card-title">Education</h3>
                  <div className="info-text">
                    {resumeData.education || 'Not provided'}
                  </div>
                </div>
              )}

              {/* Experience */}
              {resumeData.experience && (
                <div className="data-card">
                  <h3 className="card-title">Experience</h3>
                  <div className="info-text">
                    {resumeData.experience || 'Not provided'}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {resumeData.contact && (
                <div className="data-card">
                  <h3 className="card-title">Contact Information</h3>
                  <div className="contact-info">
                    {Object.entries(resumeData.contact).map(([key, value]) => (
                      <div key={key} className="contact-item">
                        <span className="contact-label">{key}:</span>
                        <span className="contact-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => navigate('/jobs')}>
                🔍 Search Jobs with These Skills
              </button>
              <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* No Resume State */}
        {!resumeData && !selectedFile && (
          <div className="no-resume-state">
            <div className="empty-icon">📭</div>
            <h3>No resume uploaded yet</h3>
            <p>Upload your resume to get started with job matching</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeUpload;
