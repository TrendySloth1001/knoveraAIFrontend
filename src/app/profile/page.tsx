'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Briefcase, BookOpen, Calendar, MapPin, Award, Edit2, ArrowLeft } from 'lucide-react';
import './profile.css';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="profile-error">
        <p>No profile data available</p>
      </div>
    );
  }

  const isTeacher = user.role === 'TEACHER';

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-banner"></div>
        <div className="profile-info-header">
          <div className="profile-avatar-section">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="profile-avatar-large"
              />
            ) : (
              <div className="profile-avatar-large profile-avatar-placeholder">
                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
              </div>
            )}
            <button className="edit-avatar-btn" title="Edit Avatar">
              <Edit2 size={16} />
            </button>
          </div>
          <div className="profile-header-info">
            <h1 className="profile-name">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="profile-role-badge">{user.role}</p>
            <div className="profile-meta">
              <span className="profile-meta-item">
                <Mail size={14} />
                {user.email}
              </span>
              <span className="profile-meta-item">
                <Calendar size={14} />
                Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <div className="section-header">
            <h2>About</h2>
            <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 size={16} />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="section-content">
            <p className="profile-bio">
              {profile.bio || 'No bio available yet.'}
            </p>
          </div>
        </div>

        {isTeacher ? (
          <>
            <div className="profile-section">
              <h2>Professional Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">
                    <BookOpen size={20} />
                  </div>
                  <div className="info-details">
                    <label>Specialization</label>
                    <p>{profile.specialization || 'Not specified'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <Award size={20} />
                  </div>
                  <div className="info-details">
                    <label>Qualification</label>
                    <p>{profile.qualification || 'Not specified'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <Briefcase size={20} />
                  </div>
                  <div className="info-details">
                    <label>Experience</label>
                    <p>{profile.experience ? `${profile.experience} years` : 'Not specified'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">
                    <User size={20} />
                  </div>
                  <div className="info-details">
                    <label>Profile Visibility</label>
                    <p>{profile.profileVisibility || 'PUBLIC'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>Teaching Preferences</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-details">
                    <label>Default Content Mode</label>
                    <p>{profile.defaultContentMode || 'Standard'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-details">
                    <label>Allow Followers</label>
                    <p>{profile.allowFollowers ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="profile-section">
            <h2>Academic Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">
                  <BookOpen size={20} />
                </div>
                <div className="info-details">
                  <label>Grade</label>
                  <p>{profile.grade || 'Not specified'}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <MapPin size={20} />
                </div>
                <div className="info-details">
                  <label>Institution</label>
                  <p>{profile.institution || 'Not specified'}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <Award size={20} />
                </div>
                <div className="info-details">
                  <label>Interests</label>
                  <p>{profile.interests || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="profile-section">
          <h2>Account Details</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-details">
                <label>User ID</label>
                <p className="monospace">{user.id}</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-details">
                <label>Account Status</label>
                <p>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-details">
                <label>Last Login</label>
                <p>
                  {user.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'
                  }
                </p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-details">
                <label>Display Name</label>
                <p>{user.displayName || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
