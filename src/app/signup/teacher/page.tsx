'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import './signup.css';

export default function TeacherSignupPage() {
  const router = useRouter();
  const { tempToken, login, clearTempToken, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    specialization: '',
    qualification: '',
    experience: '',
    profileVisibility: 'PUBLIC',
    defaultContentMode: 'PUBLIC',
    allowFollowers: true,
  });

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/');
        return;
      }
      if (!tempToken) {
        router.push('/login');
      }
    }
  }, [tempToken, isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/api/signup/teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({
          ...formData,
          experience: formData.experience ? parseInt(formData.experience) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearTempToken();
        await login(data.data.token);
        router.push('/');
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred during signup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !tempToken) {
    return (
      <div className="signup-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <button
          onClick={() => router.push('/signup/role')}
          className="back-button"
          type="button"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="signup-header">
          <h1 className="signup-title">Teacher Profile</h1>
          <p className="signup-subtitle">Tell us about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Specialization</label>
            <input
              type="text"
              id="specialization"
              placeholder="e.g., Mathematics, Physics, Computer Science"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="qualification">Qualification</label>
            <input
              type="text"
              id="qualification"
              placeholder="e.g., PhD in Computer Science, M.Ed"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="experience">Years of Experience</label>
            <input
              type="number"
              id="experience"
              min="0"
              placeholder="Years"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Tell students about your teaching philosophy and experience..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profileVisibility">Profile Visibility</label>
            <select
              id="profileVisibility"
              value={formData.profileVisibility}
              onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="FOLLOWERS">Followers Only</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.allowFollowers}
                onChange={(e) => setFormData({ ...formData, allowFollowers: e.target.checked })}
                disabled={isSubmitting}
              />
              <span>Allow students to follow me</span>
            </label>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Signup'}
          </button>
        </form>
      </div>
    </div>
  );
}
