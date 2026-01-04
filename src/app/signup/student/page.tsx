'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import '../teacher/signup.css';

export default function StudentSignupPage() {
  const router = useRouter();
  const { tempToken, login, clearTempToken, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    grade: '',
    institution: '',
    interests: '',
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
      
      const response = await fetch(`${API_BASE_URL}/api/signup/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify(formData),
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
          <h1 className="signup-title">Student Profile</h1>
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
            <label htmlFor="grade">Grade/Level</label>
            <input
              type="text"
              id="grade"
              placeholder="e.g., 10th Grade, Freshman, Graduate"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="institution">School/Institution</label>
            <input
              type="text"
              id="institution"
              placeholder="Your school or university name"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="interests">Interests</label>
            <textarea
              id="interests"
              rows={4}
              placeholder="What subjects are you interested in? What are your learning goals?"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              disabled={isSubmitting}
            />
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
