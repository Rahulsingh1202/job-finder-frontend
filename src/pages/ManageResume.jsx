import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css'; // Use your existing CSS

const ManageResume = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/resumes`);
      setResumes(response.data.resumes);
      setError('');
    } catch (err) {
      setError('Failed to load resumes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId, filename) => {
    if (!window.confirm(`Are you sure you want to delete resume for "${filename}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/resumes/${resumeId}`);
      setResumes(resumes.filter(r => r.id !== resumeId));
      setSelectedResume(null);
      alert('Resume deleted successfully!');
    } catch (err) {
      alert('Failed to delete resume');
      console.error(err);
    }
  };

  const handleView = async (resumeId) => {
    try {
      const response = await axios.get(`${API_URL}/api/resumes/${resumeId}`);
      setSelectedResume(response.data);
    } catch (err) {
      alert('Failed to load resume details');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '20px'
      }}>
        Loading resumes...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5', 
      padding: '30px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '30px' }}>
          Manage Resumes
        </h1>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c00',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {resumes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>
              No resumes uploaded yet
            </p>
            <p style={{ color: '#999' }}>Upload your resume to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Resume List */}
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                Your Resumes ({resumes.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    style={{
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '10px',
                      padding: '20px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      transition: 'box-shadow 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)'}
                  >
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
                      {resume.filename}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      Uploaded: {formatDate(resume.uploaded_at)}
                    </p>
                    {resume.skills && resume.skills.length > 0 && (
                      <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
                        Skills: {resume.skills.slice(0, 3).join(', ')}
                        {resume.skills.length > 3 && '...'}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleView(resume.id)}
                        style={{
                          flex: 1,
                          background: '#007bff',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#0056b3'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#007bff'}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id, resume.filename)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume Details */}
            <div>
              {selectedResume ? (
                <div style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '10px',
                  padding: '25px',
                  position: 'sticky',
                  top: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Resume Details</h2>
                    <button
                      onClick={() => setSelectedResume(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        color: '#999',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '5px' }}>
                        Name
                      </h3>
                      <p style={{ color: '#666' }}>{selectedResume.filename}</p>
                    </div>

                    {selectedResume.skills && selectedResume.skills.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                          Skills
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {selectedResume.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#e7f3ff',
                                color: '#0066cc',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '13px'
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResume.education && (
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '5px' }}>
                          Education
                        </h3>
                        <p style={{ color: '#666' }}>{selectedResume.education}</p>
                      </div>
                    )}

                    {selectedResume.contact && Object.keys(selectedResume.contact).some(key => selectedResume.contact[key]) && (
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                          Contact
                        </h3>
                        <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedResume.contact.phone && (
                            <p style={{ color: '#666' }}>📱 {selectedResume.contact.phone}</p>
                          )}
                          {selectedResume.contact.linkedin && (
                            <p style={{ color: '#666' }}>💼 {selectedResume.contact.linkedin}</p>
                          )}
                          {selectedResume.contact.github && (
                            <p style={{ color: '#666' }}>🔗 {selectedResume.contact.github}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#fafafa',
                  border: '2px dashed #ddd',
                  borderRadius: '10px',
                  padding: '60px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#999', fontSize: '16px' }}>
                    Select a resume to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageResume;
