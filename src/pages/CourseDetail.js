import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch course details
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) {
          navigate('/courses');
          return;
        }
        setCourse({ id: courseSnap.id, ...courseSnap.data() });

        // Fetch modules for this course
        const modulesCol = collection(db, 'courses', courseId, 'modules');
        const modulesQuery = query(modulesCol, orderBy('order'));
        const modulesSnap = await getDocs(modulesQuery);
        const modulesList = modulesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('Fetched modules for', courseId, ':', modulesList);
        setModules(modulesList);

        // Fetch user data
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          setUserData({ completedModules: [], level: 1, xp: 0, coins: 0 });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId, currentUser, navigate]);

  const handleModuleClick = (moduleId) => {
    navigate(`/course/${courseId}/module/${moduleId}`);
  };

  const completedModulesCount = userData?.completedModules
    ? userData.completedModules.filter(id => id.startsWith(courseId)).length
    : 0;
  const totalModules = modules.length;
  const progressPercentage = totalModules > 0
    ? Math.round((completedModulesCount / totalModules) * 100)
    : 0;

  const getModuleTitle = (module) => {
    return module.title || module.Title || module.name || "Untitled Module";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url('/coursedbackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="text-rose-700 text-2xl animate-pulse" style={fontStyle}>Loading your quest...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url('/coursedbackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="text-rose-600 text-2xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage: `url('/coursedbackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="px-5 py-1 border border-rose-600/30 text-rose-700 hover:text-rose-900 hover:border-rose-600 transition rounded-sm text-base tracking-wide"
            style={fontStyle}
          >
            ← All Courses
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-1 border border-rose-600/30 text-rose-700 hover:text-rose-900 hover:border-rose-600 transition rounded-sm text-base tracking-wide"
            style={fontStyle}
          >
            Dashboard
          </button>
        </div>

        {/* Course header */}
        <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 mb-8 shadow-lg">
          <h1 className="text-5xl font-bold text-rose-800 drop-shadow-md mb-2 capitalize" style={fontStyle}>
            {courseId}
          </h1>
          <p className="text-rose-600 text-xl">{course?.description}</p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-base text-rose-700 mb-1">
              <span>Progress</span>
              <span>{completedModulesCount}/{totalModules} modules ({progressPercentage}%)</span>
            </div>
            <div className="w-full bg-rose-100 h-3">
              <div
                className="bg-rose-500 h-3 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Modules list */}
        <div className="space-y-4">
          {modules.map((module) => {
            const isCompleted = userData?.completedModules?.includes(`${courseId}_${module.id}`);
            const moduleTitle = getModuleTitle(module);
            return (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`bg-white/40 backdrop-blur-md border p-6 cursor-pointer transition hover:scale-[1.02] ${
                  isCompleted
                    ? 'border-green-400 bg-green-500/20'
                    : 'border-rose-200/60 hover:bg-white/60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {isCompleted && (
                      <span className="text-green-600 text-2xl">✓</span>
                    )}
                    <h2 className={`text-2xl font-semibold ${
                      isCompleted ? 'text-green-700' : 'text-rose-800'
                    }`} style={fontStyle}>
                      {moduleTitle}
                    </h2>
                  </div>
                  {module.xp && (
                    <span className="text-base text-rose-600 bg-white/40 px-3 py-1 rounded-full">
                      +{module.xp} XP
                    </span>
                  )}
                </div>
                <p className="text-rose-500 text-base mt-1">Click to start module</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}