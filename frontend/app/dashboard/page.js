'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await fetch('http://localhost:8000/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (!data.age) router.push('/onboarding');
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your prosperity...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Hello, {user?.full_name?.split(' ')[0]}</h1>
          <p style={{ color: '#a5a5a5' }}>Bracket: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{user?.age_bracket || 'Unassigned'}</span></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Level {user?.level}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{user?.xp} XP</div>
        </div>
      </div>

      {!user?.placement_completed && (
        <div className="glass-card" style={{ padding: '30px', marginBottom: '30px', border: '1px solid var(--primary)', background: 'rgba(0, 243, 255, 0.05)' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Unlock Your Level </h2>
          <p style={{ marginBottom: '20px' }}>Take a quick placement test to skip beginner modules and jump straight to advanced content!</p>
          <button onClick={() => router.push('/courses')} className="btn-primary">Take Placement Test</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '15px' }}>Prosperity Score</h2>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>{user?.prosperity_score}</div>
          <p style={{ fontSize: '0.9rem', color: '#a5a5a5', marginTop: '10px' }}>Analyze your spending to improve this!</p>
        </div>

        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '15px' }}>Daily Mission</h2>
          <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ fontWeight: '600' }}>Review your savings for 5 mins</div>
            <div style={{ fontSize: '0.8rem', color: '#a5a5a5', marginTop: '5px' }}>Reward: +10 XP</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '15px' }}>Continue Learning</h2>
          <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontWeight: '600' }}>Course Navigator</div>
            <button onClick={() => router.push('/courses')} className="btn-primary" style={{ marginTop: '15px', padding: '8px 16px', fontSize: '0.9rem' }}>Go to Courses</button>
          </div>
        </div>
      </div>
    </div>
  );
}
