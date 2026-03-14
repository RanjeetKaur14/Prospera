import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import DragonIcon from "../components/DragonIcon";

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
    // ✅ Navigate to dashboard after successful login
    navigate('/dashboard');
  } catch (error) {
    console.error("Firebase Error Code:", error.code);
    alert(error.message); 
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/50 backdrop-blur-lg p-8 rounded-2xl border border-red-500/30 shadow-2xl shadow-red-900/50">
        <div className="text-center mb-8">
          <DragonIcon className="w-24 h-24 mx-auto text-red-500" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mt-4">
            Prospera
          </h1>
          <p className="text-gray-400">Enter your lair to begin your quest</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/60 border border-red-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/60 border border-red-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-bold text-lg shadow-lg shadow-red-600/30 transition transform hover:scale-[1.02]"
          >
            Enter the Lair
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          New adventurer?{" "}
          <Link to="/signup" className="text-red-400 hover:text-red-300 underline">
            Forge your dragon
          </Link>
        </p>
      </div>
    </div>
  );
}