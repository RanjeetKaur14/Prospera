import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null); // Added missing state
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
        setModules(modulesList);

        // Fetch user data to get completed modules and progress
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          // Create minimal user data if missing (shouldn't happen, but just in case)
          console.warn('User document not found, creating default');
          setUserData({
            completedModules: [],
            level: 1,
            xp: 0,
            coins: 0
          });
        }
      } catch (err) {
        console.error('Error fetching course detail:', err);
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

  // Calculate completed modules for this course
  const completedModulesCount = userData?.completedModules
    ? userData.completedModules.filter(id => id.startsWith(courseId)).length
    : 0;
  const totalModules = modules.length;
  const progressPercentage = totalModules > 0
    ? Math.round((completedModulesCount / totalModules) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black text-white flex items-center justify-center">
        <div className="text-red-400 text-xl animate-pulse">Loading your quest...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black text-white flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="text-red-400 hover:text-red-300"
          >
            ← All Courses
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-red-400 hover:text-red-300"
          >
            Dashboard
          </button>
        </div>

        <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-8 mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2 capitalize">
            {courseId}
          </h1>
          <p className="text-gray-300 text-lg">{course?.description}</p>
          
          {/* Progress bar for this course */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Progress</span>
              <span>{completedModulesCount}/{totalModules} modules ({progressPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {modules.map((module) => {
            const isCompleted = userData?.completedModules?.includes(`${courseId}_${module.id}`);
            return (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`bg-black/60 backdrop-blur rounded-2xl border p-6 cursor-pointer transition ${
                  isCompleted
                    ? 'border-green-700 bg-green-900/20'
                    : 'border-red-500/30 hover:border-red-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-red-400">{module.title}</h2>
                    <p className="text-gray-300 mt-2 line-clamp-2">{module.description}</p>
                  </div>
                  {isCompleted && (
                    <div className="text-green-400 text-3xl">✓</div>
                  )}
                </div>
                {module.xp && (
                  <div className="mt-2 text-sm text-orange-400">+{module.xp} XP</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}