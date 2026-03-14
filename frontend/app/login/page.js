'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        
        try {
          const userRes = await fetch('http://localhost:8000/users/me', {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (!userData.age) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          } else {
            router.push('/dashboard');
          }
        } catch(e) {
          router.push('/dashboard');
        }
      } else {
        const data = await res.json();
        alert(data.detail || 'Login failed');
      }
    } catch (err) {
      alert('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Welcome Back</h1>
        <p style={{ textAlign: 'center', color: '#a5a5a5', marginBottom: '30px' }}>Continue your journey to prosperity</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.9rem' }}>Password</label>
              <a href="#" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Forgot?</a>
            </div>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <p style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem' }}>
          Don&apos;t have an account? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: '600' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
