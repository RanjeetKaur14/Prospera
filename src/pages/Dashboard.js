import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

import DragonIcon from "../components/DragonIcon";
import { FireIcon, CurrencyDollarIcon, TrophyIcon } from "@heroicons/react/24/solid";
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextModule, setNextModule] = useState(null);
  const navigate = useNavigate();
  const [courseProgress, setCourseProgress] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
  const user = auth.currentUser;
  if (user) {
    const docRef = doc(db, "users", user.uid);
    let docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
    } else {
      console.log("No such document! Creating one...");
      const defaultData = {
        name: user.displayName || "Dragon Rider",
        email: user.email,
        level: 1,
        xp: 0,
        coins: 0,
        completedModules: [],
      };
      await setDoc(docRef, defaultData);
      setUserData(defaultData);
    }
  }
  setLoading(false);
};
    fetchUserData();
  }, []);
  const calculateProgress = async () => {
  if (!userData || !userData.completedModules) return;
  const courses = ['beginner', 'intermediate', 'advanced'];
  const progress = {};
  for (const courseId of courses) {
    try {
      const modulesCol = collection(db, 'courses', courseId, 'modules');
      const modulesSnap = await getDocs(modulesCol);
      const totalModules = modulesSnap.size;
      const completed = userData.completedModules.filter(id => id.startsWith(courseId)).length;
      progress[courseId] = totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;
    } catch (error) {
      console.error(`Error fetching modules for ${courseId}:`, error);
      progress[courseId] = 0;
    }
  }
  setCourseProgress(progress);
};

useEffect(() => {
  if (userData) calculateProgress();
}, [userData]);
  // Find the next incomplete module (recommendation)
  useEffect(() => {
    async function findNextModule() {
      if (!userData || !userData.completedModules) return;

      try {
        // For simplicity, we check the 'beginner' course first.
        // In a real app, you might want to check all courses or store last active course.
        const courseId = 'beginner'; // or determine from userData.lastCourse
        const modulesCol = collection(db, 'courses', courseId, 'modules');
        const modulesQuery = query(modulesCol, orderBy('order'));
        const modulesSnap = await getDocs(modulesQuery);
        const modules = modulesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const completed = userData.completedModules || [];
        const next = modules.find(m => !completed.includes(`${courseId}_${m.id}`));
        if (next) {
          setNextModule({ courseId, module: next });
        } else {
          // All modules in beginner completed – maybe recommend intermediate?
          // For now, set null.
          setNextModule(null);
        }
      } catch (error) {
        console.error('Error finding next module:', error);
      }
    }
    findNextModule();
  }, [userData]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-red-950 to-black">
        <div className="text-red-400 text-xl animate-pulse">Summoning your dragon...</div>
      </div>
    );
  }

  // Calculate XP progress to next level (example: 100 XP per level)
  const xpForNextLevel = (userData?.level || 1) * 100;
  const currentXP = userData?.xp || 0;
  const progressPercent = Math.min((currentXP / xpForNextLevel) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black p-6">
      {/* Header with logout */}
      <div className="flex justify-between items-center max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
          Dragon's Lair
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-900/50 hover:bg-red-800 rounded-lg border border-red-600 transition"
        >
          Leave Lair
        </button>
      </div>

      {/* Main dashboard grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dragon Profile Card */}
        <div className="md:col-span-1 bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-6 flex flex-col items-center">
          <DragonIcon className="w-40 h-40 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">{userData?.name || "Dragon Rider"}</h2>
          <p className="text-red-400 mb-4">Level {userData?.level || 1}</p>
          <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
            <div
              className="bg-gradient-to-r from-red-500 to-orange-400 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400">
            {currentXP} / {xpForNextLevel} XP
          </p>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1">
              <FireIcon className="w-5 h-5 text-red-500" />
              <span>{userData?.coins || 0} Coins</span>
            </div>
            <div className="flex items-center gap-1">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              <span>0 Badges</span>
            </div>
          </div>
        </div>

        {/* Quests & Progress */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                Financial Health
              </h3>
              <p className="text-3xl font-bold text-green-400">78%</p>
              <p className="text-sm text-gray-400">+5% from last week</p>
            </div>
            <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-orange-400" />
                Streak
              </h3>
              <p className="text-3xl font-bold text-orange-400">7 days</p>
              <p className="text-sm text-gray-400">Keep it burning!</p>
            </div>
          </div>

          {/* Next Recommended Module (if any) */}
          {nextModule && (
            <div className="bg-red-900/20 border border-red-600 rounded-2xl p-4">
              <p className="text-red-300 text-sm mb-1">Continue your journey:</p>
              <button
                onClick={() => navigate(`/course/${nextModule.courseId}/module/${nextModule.module.id}`)}
                className="text-red-400 hover:text-red-300 font-semibold text-lg flex items-center gap-2"
              >
                {nextModule.module.title}
                <span className="text-xs bg-red-600 px-2 py-1 rounded-full">+{nextModule.module.xp || 50} XP</span>
              </button>
            </div>
          )}

          {/* Daily Quests */}
          <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-6">
            <h3 className="text-xl font-bold mb-4">🔥 Daily Quests</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-3 bg-black/40 rounded-lg">
                <input type="checkbox" className="w-5 h-5 accent-red-500" />
                <span>Track today's expenses</span>
                <span className="ml-auto text-sm text-orange-400">+50 XP</span>
              </li>
              <li className="flex items-center gap-3 p-3 bg-black/40 rounded-lg">
                <input type="checkbox" className="w-5 h-5 accent-red-500" />
                <span>Complete one lesson</span>
                <span className="ml-auto text-sm text-orange-400">+30 XP</span>
              </li>
              <li className="flex items-center gap-3 p-3 bg-black/40 rounded-lg">
                <input type="checkbox" className="w-5 h-5 accent-red-500" />
                <span>Save ₹100 today</span>
                <span className="ml-auto text-sm text-orange-400">+100 XP</span>
              </li>
            </ul>
          </div>

          {/* Start Quest Button */}
          <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-6 text-center">
            <button
              onClick={() => navigate('/courses')}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-bold text-xl shadow-lg shadow-red-800/50 hover:scale-105 transition transform"
            >
              🔥 Start Your Financial Quest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}