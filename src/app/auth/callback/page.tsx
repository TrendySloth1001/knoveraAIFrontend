'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setTempToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const tempTokenParam = searchParams.get('tempToken');
      const email = searchParams.get('email');
      const name = searchParams.get('name');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      // Check for temp token (user needs to complete signup)
      if (tempTokenParam) {
        try {
          setTempToken(tempTokenParam, email || undefined, name || undefined);
          // Redirect to role selection
          router.push('/signup/role');
        } catch (err) {
          console.error('Temp token error:', err);
          setError('Failed to process signup. Please try again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
        return;
      }

      // Handle full authentication token
      if (token) {
        try {
          await login(token);
          // Redirect to home page after successful login
          router.push('/');
        } catch (err) {
          console.error('Login error:', err);
          setError('Failed to complete login. Please try again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        setError('No authentication token received.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, login, setTempToken, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      color: '#ffffff',
      padding: '2rem',
      textAlign: 'center'
    }}>
      {error ? (
        <>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>❌</div>
          <h1 style={{ marginBottom: '1rem' }}>Authentication Failed</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{error}</p>
        </>
      ) : (
        <>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '1.5rem'
          }}></div>
          <h1 style={{ marginBottom: '0.5rem' }}>Processing Sign In...</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Please wait while we log you in
          </p>
        </>
      )}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
