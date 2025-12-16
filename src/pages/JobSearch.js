import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, resumeAPI } from '../services/api';
import './JobSearch.css';

function JobSearch() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  
  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [jobType, setJobType] = useState('all');
  const [sortBy, setSortBy] = useState('relevant');

  // Resume data
  const [resumeSkills, setResumeSkills] = useState([]);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch resume to get skills
    fetchResumeSkills(parsedUser.email);
    
    // Fetch saved jobs to mark them
    fetchSavedJobs(parsedUser.email);
  }, [navigate]);

  const fetchResumeSkills = async (userEmail) => {
    try {
      const response = await resumeAPI.getResume(userEmail);
      if (response.data && response.data.data) {
        const skillsList = response.data.data.skills || [];
        setResumeSkills(skillsList);
        setSkills(skillsList.slice(0, 5).join(', ')); // Pre-fill with top 5 skills
        setHasResume(true);
      }
    } catch (error) {
      console.error('No resume found:', error);
      setHasResume(false);
    }
  };

  const fetchSavedJobs = async (userEmail) => {
    try {
      const response = await jobsAPI.getSavedJobs(userEmail);
      if (response.data && response.data.jobs) {
        const ids = response.data.jobs.map(job => job.title + job.company);
        setSavedJobIds(ids);
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleSearch = async () => {
    if (!skills.trim()) {
      alert('Please enter at least one skill to search');
      return;
    }

    setSearching(true);
    setJobs([]);
    
    try {
      const searchData = {
        skills: skills, // Pass as string, api.js will convert it
        location: location || 'India',
        experience_years: experienceYears ? parseInt(experienceYears) : 0,
        max_jobs: 50
      };

      const response = await jobsAPI.searchJobs(searchData);
      
      if (response.data) {
        const allJobs = [
          ...(response.data.data?.jobs_with_email || []),
          ...(response.data.data?.jobs_without_email || []),
          ...(response.data.data?.direct_contact_jobs || []),
          ...(response.data.data?.standard_jobs || [])
        ];
        
        // Remove duplicates
        const uniqueJobs = allJobs.filter((job, index, self) =>
          index === self.findIndex((j) => 
            j.title === job.title && j.company === job.company
          )
        );
        
        setJobs(uniqueJobs);
        setFilteredJobs(uniqueJobs);
        
        if (uniqueJobs.length === 0) {
          alert('No jobs found. Try adjusting your search criteria.');
        }
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      alert('Failed to search jobs. Please try again.');
    } finally {
      setSearching(false);
    }
  };


  const handleSaveJob = async (job) => {
    try {
      const jobId = job.title + job.company;
      
      if (savedJobIds.includes(jobId)) {
        alert('Job already saved!');
        return;
      }

      const response = await jobsAPI.saveJob({
        user_email: user.email,
        title: job.title,
        company: job.company,
        location: job.location || 'Not specified',
        url: job.link || '',
        description: job.description || '',
        status: 'pending'
      });

      if (response.data.status === 'success') {
        setSavedJobIds([...savedJobIds, jobId]);
        alert('Job saved successfully!');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Failed to save job. Please try again.');
    }
  };

  const isJobSaved = (job) => {
    const jobId = job.title + job.company;
    return savedJobIds.includes(jobId);
  };

  // Filter jobs based on local filters
  useEffect(() => {
    let filtered = [...jobs];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Job type filter
    if (jobType !== 'all') {
      filtered = filtered.filter(job => {
        const title = job.title?.toLowerCase() || '';
        switch (jobType) {
          case 'remote':
            return title.includes('remote') || job.location?.toLowerCase().includes('remote');
          case 'hybrid':
            return title.includes('hybrid') || job.location?.toLowerCase().includes('hybrid');
          case 'onsite':
            return !title.includes('remote') && !title.includes('hybrid');
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        // Most recent first (already in order from API)
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

    setFilteredJobs(filtered);
  }, [searchQuery, jobType, sortBy, jobs]);

  const handleUseResumeSkills = () => {
    if (resumeSkills.length > 0) {
      setSkills(resumeSkills.join(', '));
    } else {
      alert('No skills found in your resume. Please upload a resume first.');
    }
  };

  return (
    <div className="job-search-container">
      {/* Header */}
      <div className="job-search-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="header-title">
            <h1>Search Jobs</h1>
            <p>Find your next opportunity</p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="search-form-card">
        <h2 className="form-title">🔍 Job Search Filters</h2>
        
        <div className="form-grid">
          {/* Skills Input */}
          <div className="form-group full-width">
            <label className="form-label">
              Skills (Required) *
              {hasResume && (
                <button 
                  className="use-resume-btn"
                  onClick={handleUseResumeSkills}
                  type="button"
                >
                  📄 Use Resume Skills
                </button>
              )}
            </label>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g., Python, React, Machine Learning"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <span className="form-hint">Separate multiple skills with commas</span>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location (Optional)</label>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g., New York, Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Experience Years */}
          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input 
              type="number"
              className="form-input"
              placeholder="e.g., 2"
              min="0"
              max="50"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
          </div>

          {/* Experience Level */}
          <div className="form-group">
            <label className="form-label">Experience Level</label>
            <select 
              className="form-select"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="">Any Level</option>
              <option value="Fresher">Fresher / Intern</option>
              <option value="Entry">Entry Level (0-2 years)</option>
              <option value="Mid">Mid Level (3-5 years)</option>
              <option value="Senior">Senior (6+ years)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="form-group full-width">
            <button 
              className="search-btn"
              onClick={handleSearch}
              disabled={searching || !skills.trim()}
            >
              {searching ? '🔄 Searching...' : '🔍 Search Jobs'}
            </button>
          </div>
        </div>

        {!hasResume && (
          <div className="resume-warning">
            ⚠️ No resume detected. 
            <button 
              className="upload-resume-link"
              onClick={() => navigate('/dashboard')}
            >
              Upload your resume
            </button> 
            to auto-fill skills and get better matches.
          </div>
        )}
      </div>

      {/* Results Section */}
      {jobs.length > 0 && (
        <>
          {/* Filters Bar */}
          <div className="results-header">
            <div className="results-info">
              <h3>Found {filteredJobs.length} Jobs</h3>
              <p>{filteredJobs.length} of {jobs.length} jobs matching your criteria</p>
            </div>

            <div className="results-filters">
              <div className="filter-group">
                <input 
                  type="text"
                  className="filter-input"
                  placeholder="Filter results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                className="filter-select"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>

              <select 
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevant">Most Relevant</option>
                <option value="recent">Most Recent</option>
                <option value="company">Company (A-Z)</option>
                <option value="title">Job Title (A-Z)</option>
              </select>
            </div>
          </div>


          <div className="disclaimer-banner">
            <div className="disclaimer-icon">ℹ️</div>
            <div className="disclaimer-content">
              <strong>Note:</strong> Some job links may contain <code>**</code> symbols in the URL. 
                These are still legitimate LinkedIn job postings and are safe to click. 
                The <code>**</code> is part of LinkedIn's URL formatting.
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="jobs-grid">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <div key={index} className="job-card">
                  <div className="job-card-header">
                    <div className="company-logo">
                      {job.company?.charAt(0) || '🏢'}
                    </div>
                    <button 
                      className={`save-btn ${isJobSaved(job) ? 'saved' : ''}`}
                      onClick={() => handleSaveJob(job)}
                      disabled={isJobSaved(job)}
                    >
                      {isJobSaved(job) ? '✓ Saved' : '💾 Save'}
                    </button>
                  </div>

                  <div className="job-card-body">
                    <h3 className="job-title">{job.title || 'Job Position'}</h3>
                    <p className="company-name">{job.company || 'Company Name'}</p>
                    <p className="job-location">📍 {job.location || 'Location not specified'}</p>

                    {job.description && (
                      <p className="job-description">
                        {job.description.length > 150 
                          ? job.description.substring(0, 150) + '...' 
                          : job.description}
                      </p>
                    )}

                    <div className="job-tags">
                      {job.hr_email && (
                        <span className="job-tag email">✉️ Direct Contact</span>
                      )}
                      {job.location?.toLowerCase().includes('remote') && (
                        <span className="job-tag remote">🏠 Remote</span>
                      )}
                      {job.experience_required && (
                        <span className="job-tag exp">
                          💼 {job.experience_required}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="job-card-footer">
                    {job.link && (
                      <a 
                        href={job.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="apply-btn"
                      >
                        Apply Now →
                      </a>
                    )}
                    {job.hr_email && (
                      <a 
                        href={`mailto:${job.hr_email}`}
                        className="contact-btn"
                      >
                        ✉️ Contact HR
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No jobs match your filters</h3>
                <p>Try adjusting your filter criteria</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {jobs.length === 0 && !searching && (
        <div className="empty-search-state">
          <div className="empty-icon">🎯</div>
          <h3>Ready to find your dream job?</h3>
          <p>Enter your skills and preferences above to start searching</p>
          <div className="quick-tips">
            <h4>Quick Tips:</h4>
            <ul>
              <li>✓ Use specific skills for better matches</li>
              <li>✓ Upload your resume to auto-fill skills</li>
              <li>✓ Specify experience level for relevant results</li>
              <li>✓ Try different locations or "Remote"</li>
            </ul>
          </div>
        </div>
      )}

      {/* Loading State */}
      {searching && (
        <div className="searching-overlay">
          <div className="searching-spinner">🔄</div>
          <h3>Searching for jobs...</h3>
          <p>This may take a few seconds</p>
        </div>
      )}
    </div>
  );
}

export default JobSearch;
