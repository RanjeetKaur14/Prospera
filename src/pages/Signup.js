import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        level: 1,
        xp: 0,
        coins: 100,
        completedModules: [],
        completedDailyQuests: [],
        completedMonthlyMissions: [],
        lastDailyReset: new Date().toISOString().split('T')[0],
        lastMonthlyReset: new Date().toISOString().slice(0, 7),
        streak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
        badges: [],
        createdAt: new Date().toISOString(),
      }); 

      navigate("/onboarding");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/signup.png')`, // same as login; change if needed
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="max-w-md w-full bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-rose-800 drop-shadow-md" style={fontStyle}>
            Hatch Your Dragon
          </h1>
          <p className="text-rose-600 text-lg mt-2">Begin your financial journey</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-rose-700 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 placeholder-rose-400"
              placeholder="Dragon Rider"
              required
            />
          </div>
          <div>
            <label className="block text-base font-medium text-rose-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 placeholder-rose-400"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-base font-medium text-rose-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 placeholder-rose-400"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-rose-500 text-base">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-rose-600 text-white font-semibold text-lg shadow hover:bg-rose-700 transition transform hover:scale-[1.02]"
            style={fontStyle}
          >
            Hatch Dragon
          </button>
        </form>

        <p className="text-center mt-6 text-rose-600 text-lg">
          Already have a dragon?{" "}
          <Link to="/login" className="text-rose-700 hover:text-rose-800 underline font-semibold">
            Enter the lair
          </Link>
        </p>
      </div>
    </div>
  );
}