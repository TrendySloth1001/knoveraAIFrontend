'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, BookOpen } from 'lucide-react';
import './role.css';

export default function RoleSelectionPage() {
  const router = useRouter();
  const { tempToken, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // If already authenticated, go to home
      if (isAuthenticated) {
        router.push('/');
        return;
      }
      // If no temp token, go to login
      if (!tempToken) {
        router.push('/login');
      }
    }
  }, [tempToken, isAuthenticated, isLoading, router]);

  if (isLoading || !tempToken) {
    return (
      <div className="role-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const email = localStorage.getItem('tempEmail') || 'your email';
  const name = localStorage.getItem('tempName') || 'there';

  return (
    <div className="role-container">
      <div className="role-card">
        <div className="role-header">
          <h1 className="role-title">Welcome, {name}!</h1>
          <p className="role-subtitle">Choose how you'll be using Knovera AI</p>
          <p className="role-email">{email}</p>
        </div>

        <div className="role-options">
          <button
            onClick={() => router.push('/signup/teacher')}
            className="role-option"
          >
            <div className="role-icon">
              <GraduationCap size={48} />
            </div>
            <h2 className="role-option-title">I'm a Teacher</h2>
            <p className="role-option-description">
              Create courses, manage students, and deliver educational content
            </p>
          </button>

          <button
            onClick={() => router.push('/signup/student')}
            className="role-option"
          >
            <div className="role-icon">
              <BookOpen size={48} />
            </div>
            <h2 className="role-option-title">I'm a Student</h2>
            <p className="role-option-description">
              Learn from courses, track progress, and engage with content
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
