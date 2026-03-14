import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('xp', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        const usersList = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          rank: index + 1,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage: `url('/leaderboardbackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      {/* Google Fonts link */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 px-5 py-1 border border-rose-600/30 text-rose-700 hover:text-rose-900 hover:border-rose-600 transition rounded-sm text-base tracking-wide"
          style={fontStyle}
        >
          ← Back to Lair
        </button>

        <div className="bg-white/10 backdrop-blur-md border border-rose-200/60 p-8 shadow-lg">
          <h1 className="text-5xl font-bold text-rose-800 mb-8 drop-shadow-md" style={fontStyle}>
            Leaderboard
          </h1>

          {loading ? (
            <div className="text-center text-rose-600 text-xl animate-pulse" style={fontStyle}>
              Summoning champions...
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 bg-white/20 border border-rose-100"
                >
                  <span className="text-2xl font-bold text-rose-600 w-8">#{user.rank}</span>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-rose-900" style={fontStyle}>
                      {user.name}
                    </p>
                    <p className="text-base text-rose-600">Level {user.level || 1}</p>
                  </div>
                  <span className="text-lg font-bold text-rose-700">{user.xp || 0} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}