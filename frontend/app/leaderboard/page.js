'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:8000/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaders(data);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Champions...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}>Global Leaderboard</h1>
        <p style={{ color: '#a5a5a5' }}>Top Prosperians earning real-life opportunities.</p>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '20px' }}>Rank</th>
              <th style={{ padding: '20px' }}>User</th>
              <th style={{ padding: '20px' }}>Level</th>
              <th style={{ padding: '20px', textAlign: 'right' }}>XP</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader, index) => (
              <tr key={leader.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: index === 0 ? 'rgba(0, 243, 255, 0.05)' : 'transparent' }}>
                <td style={{ padding: '20px', fontWeight: 'bold' }}>
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: '600' }}>{leader.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#a5a5a5' }}>{leader.age_bracket}</div>
                </td>
                <td style={{ padding: '20px' }}>{leader.level}</td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{leader.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ color: '#a5a5a5', fontSize: '0.9rem' }}>Top 3 players this month get guaranteed interview calls with top Fintechs! 💼</p>
      </div>
    </div>
  );
}
