/**
 * Authentication API Service
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authService = {
  /**
   * Initiate Google OAuth login
   */
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // Return success even if API call fails since we'll clear local token anyway
      return { success: true };
    }
  },

  /**
   * Complete teacher signup
   */
  signupTeacher: async (tempToken: string, data: {
    firstName: string;
    lastName: string;
    bio?: string;
    specialization?: string;
    qualification?: string;
    experience?: number;
    profileVisibility?: string;
    defaultContentMode?: string;
    allowFollowers?: boolean;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signup/teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Teacher signup failed');
      }

      return result;
    } catch (error) {
      console.error('Teacher signup error:', error);
      throw error;
    }
  },

  /**
   * Complete student signup
   */
  signupStudent: async (tempToken: string, data: {
    firstName: string;
    lastName: string;
    grade?: string;
    institution?: string;
    interests?: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signup/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Student signup failed');
      }

      return result;
    } catch (error) {
      console.error('Student signup error:', error);
      throw error;
    }
  },
};
