import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  FireIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

const fontStyle = {
  fontFamily: "'Playfair Display', serif", // or 'Lora', 'Crimson Text', etc.
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextModule, setNextModule] = useState(null);
  const [courseProgress, setCourseProgress] = useState({});
  const [dailyQuests, setDailyQuests] = useState([
    { id: 'track', label: 'Track today’s expenses', xp: 50 },
    { id: 'lesson', label: 'Complete one lesson', xp: 30 },
    { id: 'save', label: 'Save ₹100 today', xp: 100 },
  ]);
  const [monthlyMissions, setMonthlyMissions] = useState([
    { id: 'budget', label: 'Create a monthly budget', xp: 200 },
    { id: 'invest', label: 'Research one investment option', xp: 150 },
    { id: 'emergency', label: 'Start an emergency fund', xp: 300 },
  ]);
  const [streak, setStreak] = useState(0);
  const [financialHealth, setFinancialHealth] = useState(78);
  const [badges, setBadges] = useState([]);
  const navigate = useNavigate();

  const petalsRef = useRef([]);
  if (!petalsRef.current.length) {
    petalsRef.current = [...Array(8)].map((_, i) => ({
      left: `${(i * 47 + 3) % 100}%`,
      dur: `${11 + (i * 2.3) % 9}s`,
      del: `${(i * 1.9) % 10}s`,
      sz: `${9 + (i * 5) % 12}px`,
    }));
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          await updateStreak(data, docRef);
          setBadges(data.badges || []);
        } else {
          console.log("No such document! Creating one...");
          const defaultData = {
            name: user.displayName || "Dragon Rider",
            email: user.email,
            level: 1,
            xp: 0,
            coins: 0,
            completedModules: [],
            completedDailyQuests: [],
            completedMonthlyMissions: [],
            lastDailyReset: new Date().toISOString().split('T')[0],
            lastMonthlyReset: new Date().toISOString().slice(0, 7),
            streak: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
            badges: [],
          };
          await setDoc(docRef, defaultData);
          setUserData(defaultData);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const updateStreak = async (data, docRef) => {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = data.lastActiveDate || today;
    let newStreak = data.streak || 0;
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      await updateDoc(docRef, {
        streak: newStreak,
        lastActiveDate: today
      });
      setUserData(prev => ({ ...prev, streak: newStreak, lastActiveDate: today }));
    }
    setStreak(newStreak);
  };

  useEffect(() => {
    async function calculateProgress() {
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
    }
    if (userData) calculateProgress();
  }, [userData]);

  useEffect(() => {
    async function findNextModule() {
      if (!userData || !userData.completedModules) return;
      try {
        const courseId = 'beginner';
        const modulesCol = collection(db, 'courses', courseId, 'modules');
        const modulesQuery = query(modulesCol, orderBy('order'));
        const modulesSnap = await getDocs(modulesQuery);
        const modules = modulesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const completed = userData.completedModules || [];
        const next = modules.find(m => !completed.includes(`${courseId}_${m.id}`));
        if (next) setNextModule({ courseId, module: next });
        else setNextModule(null);
      } catch (error) {
        console.error('Error finding next module:', error);
      }
    }
    if (userData) findNextModule();
  }, [userData]);

  const handleDailyQuestComplete = async (questId) => {
    if (!userData) return;
    const today = new Date().toISOString().split('T')[0];
    if (userData.lastDailyReset !== today) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        completedDailyQuests: [],
        lastDailyReset: today
      });
      setUserData(prev => ({ ...prev, completedDailyQuests: [], lastDailyReset: today }));
    }
    if (userData.completedDailyQuests?.includes(questId)) return;
    const quest = dailyQuests.find(q => q.id === questId);
    if (!quest) return;
    const newXP = (userData.xp || 0) + quest.xp;
    const newLevel = Math.floor(newXP / 100) + 1;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      xp: newXP,
      level: newLevel,
      completedDailyQuests: arrayUnion(questId)
    });
    setUserData(prev => ({
      ...prev,
      xp: newXP,
      level: newLevel,
      completedDailyQuests: [...(prev.completedDailyQuests || []), questId]
    }));
  };

  const handleMonthlyMissionComplete = async (missionId) => {
    if (!userData) return;
    const thisMonth = new Date().toISOString().slice(0, 7);
    if (userData.lastMonthlyReset !== thisMonth) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        completedMonthlyMissions: [],
        lastMonthlyReset: thisMonth
      });
      setUserData(prev => ({ ...prev, completedMonthlyMissions: [], lastMonthlyReset: thisMonth }));
    }
    if (userData.completedMonthlyMissions?.includes(missionId)) return;
    const mission = monthlyMissions.find(m => m.id === missionId);
    if (!mission) return;
    const newXP = (userData.xp || 0) + mission.xp;
    const newLevel = Math.floor(newXP / 100) + 1;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      xp: newXP,
      level: newLevel,
      completedMonthlyMissions: arrayUnion(missionId)
    });
    setUserData(prev => ({
      ...prev,
      xp: newXP,
      level: newLevel,
      completedMonthlyMissions: [...(prev.completedMonthlyMissions || []), missionId]
    }));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50/90">
        <div className="text-rose-800 text-2xl animate-pulse" style={fontStyle}>Summoning your dragon...</div>
      </div>
    );
  }

  const xpForNextLevel = (userData?.level || 1) * 100;
  const currentXP = userData?.xp || 0;
  const progressPercent = Math.min((currentXP / xpForNextLevel) * 100, 100);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url('/dashboardbackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Cormorant Garamond', serif",
        color: '#2c1810',
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      {petalsRef.current.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: '-20px',
            left: p.left,
            width: p.sz,
            height: p.sz,
            background: 'radial-gradient(circle at 40% 30%, #fde1d3, #f8c8b0)',
            borderRadius: '60% 0 60% 0',
            zIndex: 998,
            pointerEvents: 'none',
            animation: `petal ${p.dur} ${p.del} linear infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes petal { 0%{transform:translateY(-20px) rotate(0deg);opacity:.8} 100%{transform:translateY(110vh) rotate(680deg);opacity:0} }
        ::-webkit-scrollbar{ width:4px; height:4px; }
        ::-webkit-scrollbar-track{ background:transparent; }
        ::-webkit-scrollbar-thumb{ background:#b28b5e; border-radius:2px; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center max-w-7xl mx-auto pt-6 px-6 pb-2">
        <h1 className="text-5xl font-bold text-rose-800 drop-shadow-md" style={fontStyle}>
          Prospera Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="px-5 py-1 border border-rose-600/30 text-rose-700 hover:text-rose-900 hover:border-rose-600 transition rounded-sm text-base tracking-wide"
          style={fontStyle}
        >
          Leave
        </button>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Profile card */}
          <div className="bg-white/30 backdrop-blur-md border border-rose-200/60 p-5 shadow-sm">
            <div className="flex flex-col">
              <h2 className="text-3xl font-semibold text-rose-900" style={fontStyle}>{userData?.name || "Dragon Rider"}</h2>
              <p className="text-rose-700 text-base mb-3">Level {userData?.level || 1}</p>
              <div className="w-full bg-rose-100 h-2 mb-1">
                <div
                  className="bg-rose-600 h-2 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-rose-600 mb-3">
                {currentXP} / {xpForNextLevel} XP
              </p>
              <div className="flex justify-between text-rose-800 text-base">
                <span className="flex items-center gap-1"><FireIcon className="w-5 h-5 text-rose-600" />{userData?.coins || 0}</span>
                <span className="flex items-center gap-1"><TrophyIcon className="w-5 h-5 text-rose-600" />{badges.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/30 backdrop-blur-md border border-rose-200/60 p-4">
              <h3 className="text-sm font-medium text-rose-700 mb-1 flex items-center gap-1">
                <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                Financial Health
              </h3>
              <p className="text-2xl font-semibold text-green-700">{financialHealth}%</p>
              <p className="text-xs text-rose-600">+5%</p>
            </div>
            <div className="bg-white/30 backdrop-blur-md border border-rose-200/60 p-4">
              <h3 className="text-sm font-medium text-rose-700 mb-1 flex items-center gap-1">
                <FireIcon className="w-4 h-4 text-orange-500" />
                Streak
              </h3>
              <p className="text-2xl font-semibold text-orange-600">{streak} days</p>
              <p className="text-xs text-rose-600">Keep it up</p>
            </div>
          </div>

          {/* Badge Archive (Side Panel) */}
          <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Squares2X2Icon className="w-6 h-6 text-rose-600" />
              <span className="text-rose-800 text-lg" style={fontStyle}>Badges</span>
            </div>
            <button
              onClick={() => navigate('/badges')}
              className="px-3 py-1 bg-rose-600 text-white text-sm hover:bg-rose-700 transition"
            >
              View All
            </button>
          </div>

          {/* Start Quest Button moved to side panel */}
          <button
            onClick={() => navigate('/courses')}
            className="w-full bg-rose-600 text-white font-semibold text-lg py-3 shadow hover:bg-rose-700 transition"
            style={fontStyle}
          >
            Your Financial Quest
          </button>

          {/* Leaderboard & Analytics buttons (keep as before) */}
          <button onClick={() => navigate('/leaderboard')} className="w-full bg-white/40 backdrop-blur-md border border-rose-200/60 p-3 flex items-center justify-between text-rose-800 hover:bg-white/80 transition text-base">
            <span className="flex items-center gap-2"><UserGroupIcon className="w-5 h-5 text-rose-600" />Leaderboard</span>
            <span className="text-rose-600">→</span>
          </button>
          <button onClick={() => navigate('/analytics')} className="w-full bg-white/30 backdrop-blur-md border border-rose-200/60 p-3 flex items-center justify-between text-rose-800 hover:bg-white/80 transition text-base">
            <span className="flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-rose-600" />Analytics</span>
            <span className="text-rose-600">→</span>
          </button>
        </div>

        {/* Right column (9 cols) */}
        <div className="lg:col-span-9 space-y-5">
          {/* Current Quest */}
          <div className="bg-white/30 backdrop-blur-md border border-rose-200/60 p-5">
            <h3 className="text-xl font-semibold text-rose-800 mb-2" style={fontStyle}> Current Quest</h3>
            {nextModule ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-rose-600">Next:</p>
                  <p className="text-lg font-medium text-rose-900">{nextModule.module.title}</p>
                  <p className="text-sm text-rose-500">{nextModule.courseId}</p>
                </div>
                <button onClick={() => navigate(`/course/${nextModule.courseId}/module/${nextModule.module.id}`)} className="px-5 py-1.5 bg-rose-600 text-white text-base hover:bg-rose-700 transition">Continue</button>
              </div>
            ) : <p className="text-rose-600 text-base">All beginner modules done! Explore other courses.</p>}
          </div>

          {/* Course Progress Overview */}
          <div className="bg-white/30 backdrop-blur-md border border-rose-200/60 p-5">
            <h3 className="text-xl font-semibold text-rose-800 mb-3" style={fontStyle}>Your Progress</h3>
            <div className="space-y-3">
              {['beginner', 'intermediate', 'advanced'].map(course => (
                <div key={course}>
                  <div className="flex justify-between text-sm text-rose-700 mb-1">
                    <span className="capitalize">{course}</span>
                    <span>{courseProgress[course] || 0}%</span>
                  </div>
                  <div className="w-full bg-rose-100 h-2">
                    <div className="bg-rose-600 h-2" style={{ width: `${courseProgress[course] || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily & Monthly side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white/30 backdrop-blur-md border border-rose-200/60 p-5">
              <h3 className="text-xl font-semibold text-rose-800 mb-3 flex items-center gap-2" style={fontStyle}>
                <FireIcon className="w-6 h-6 text-rose-600" />
                Daily Quests
              </h3>
              <ul className="space-y-2">
                {dailyQuests.map(quest => {
                  const completed = userData?.completedDailyQuests?.includes(quest.id);
                  return (
                    <li key={quest.id} className="flex items-center gap-2 p-2 bg-white/40 border border-rose-100">
                      <button
                        onClick={() => handleDailyQuestComplete(quest.id)}
                        disabled={completed}
                        className={`w-6 h-6 border flex items-center justify-center transition text-sm ${
                          completed ? 'bg-green-600 border-green-600 text-white' : 'border-rose-300 hover:border-rose-500'
                        }`}
                      >
                        {completed && '✓'}
                      </button>
                      <span className={`flex-1 text-base ${completed ? 'text-rose-400 line-through' : 'text-rose-800'}`}>
                        {quest.label}
                      </span>
                      <span className="text-sm text-rose-600">+{quest.xp}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="bg-white/30 backdrop-blur-md border border-rose-200/60 p-5">
              <h3 className="text-xl font-semibold text-rose-800 mb-3 flex items-center gap-2" style={fontStyle}>
                <CalendarIcon className="w-6 h-6 text-rose-600" />
                Monthly Missions
              </h3>
              <ul className="space-y-2">
                {monthlyMissions.map(mission => {
                  const completed = userData?.completedMonthlyMissions?.includes(mission.id);
                  return (
                    <li key={mission.id} className="flex items-center gap-2 p-2 bg-white/40 border border-rose-100">
                      <button
                        onClick={() => handleMonthlyMissionComplete(mission.id)}
                        disabled={completed}
                        className={`w-6 h-6 border flex items-center justify-center transition text-sm ${
                          completed ? 'bg-green-600 border-green-600 text-white' : 'border-rose-300 hover:border-rose-500'
                        }`}
                      >
                        {completed && '✓'}
                      </button>
                      <span className={`flex-1 text-base ${completed ? 'text-rose-400 line-through' : 'text-rose-800'}`}>
                        {mission.label}
                      </span>
                      <span className="text-sm text-rose-600">+{mission.xp}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Earned Badges (still in main area) */}
          <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-5">
            <h3 className="text-xl font-semibold text-rose-800 mb-2 flex items-center gap-2" style={fontStyle}>
              <TrophyIcon className="w-6 h-6 text-rose-600" />
              Earned Badges
            </h3>
            {badges.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {badges.map((badge, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-rose-100 flex items-center justify-center text-rose-800 text-lg">
                      {badge.icon || '🏅'}
                    </div>
                    <span className="text-sm text-rose-700 mt-1">{badge.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-rose-600 text-base">No badges yet. Complete quests to earn your first badge!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}