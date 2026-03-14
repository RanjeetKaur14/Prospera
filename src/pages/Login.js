import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Success!", userCredential.user);
      navigate('/dashboard');
    } catch (error) {
      console.error("Firebase Error Code:", error.code);
      alert(error.message);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/dragon.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Optional overlay for better contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-0"></div>

      {/* Google Fonts link */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Login Card */}
      <div className="relative z-10 max-w-md w-full bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-rose-800 drop-shadow-md" style={fontStyle}>
            Prospera
          </h1>
          <p className="text-rose-600 text-lg mt-2">Enter your lair to begin your quest</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-rose-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 placeholder-rose-300"
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
              className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 placeholder-rose-300"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-rose-500 text-base">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-rose-600 text-white font-semibold text-lg shadow hover:bg-rose-700 transition transform hover:scale-[1.02]"
            style={fontStyle}
          >
            Enter the Lair
          </button>
        </form>

        <p className="text-center mt-6 text-rose-600 text-lg">
          New adventurer?{" "}
          <Link to="/signup" className="text-rose-700 hover:text-rose-800 underline font-semibold">
            Forge your dragon
          </Link>
        </p>
      </div>
    </div>
  );
}