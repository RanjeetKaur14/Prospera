import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function ModuleDetail() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function fetchModule() {
      try {
        // Fetch module data
        const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
        const moduleSnap = await getDoc(moduleRef);
        if (!moduleSnap.exists()) {
          navigate(`/course/${courseId}`);
          return;
        }
        setModule({ id: moduleSnap.id, ...moduleSnap.data() });

        // Fetch course description (optional)
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          setCourse(courseSnap.data());
        }

        // Check if user already completed this module
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const completed = userSnap.data().completedModules || [];
          setIsCompleted(completed.includes(`${courseId}_${moduleId}`));
        }
      } catch (error) {
        console.error('Error fetching module:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchModule();
  }, [courseId, moduleId, currentUser, navigate]);

  const handleComplete = async () => {
    if (isCompleted) {
      // If already completed, just go to next/review
      goToNextModule();
      return;
    }

    setCompleting(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const moduleXp = module.xp || 50;

      // Update user document
      await updateDoc(userRef, {
        completedModules: arrayUnion(`${courseId}_${moduleId}`),
        xp: increment(moduleXp)   // use "xp" not "totalXP" to match your schema
      });

      setIsCompleted(true);
      // After marking complete, go to next module or review
      goToNextModule();
    } catch (error) {
      console.error('Error completing module:', error);
      alert('Failed to complete module. Try again.');
    } finally {
      setCompleting(false);
    }
  };

  const goToNextModule = async () => {
    try {
      // Fetch all modules for this course
      const modulesCol = collection(db, 'courses', courseId, 'modules');
      const modulesQuery = query(modulesCol, orderBy('order'));
      const modulesSnap = await getDocs(modulesQuery);
      const allModules = modulesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get user's completed modules
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const completed = userSnap.exists() ? (userSnap.data().completedModules || []) : [];

      // Find first module not completed
      const nextModule = allModules.find(m => !completed.includes(`${courseId}_${m.id}`));

      if (nextModule) {
        navigate(`/course/${courseId}/module/${nextModule.id}`);
      } else {
        // All modules completed → go to review page
        navigate(`/course/${courseId}/review`);
      }
    } catch (error) {
      console.error('Error finding next module:', error);
      navigate(`/course/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-fire-950 text-white flex items-center justify-center">
        <div className="text-fire-500 text-2xl animate-pulse">Loading lesson...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-fire-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="text-fire-400 hover:text-fire-300"
          >
            ← Back to Modules
          </button>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-fire-700 p-8 mb-8">
          <h1 className="text-3xl font-bold text-fire-500 mb-4">{module.title}</h1>
          <div className="prose prose-invert max-w-none text-fire-100 whitespace-pre-wrap">
            {module.description}
          </div>

          {module.xp && (
            <div className="mt-4 text-fire-400">Reward: {module.xp} XP</div>
          )}
        </div>

        <button
          onClick={handleComplete}
          disabled={completing}
          className={`w-full py-4 rounded-xl font-bold text-xl transition ${
            isCompleted
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-fire-600 hover:bg-fire-700'
          }`}
        >
          {completing
            ? 'Completing...'
            : isCompleted
            ? 'Already Completed - Next →'
            : 'Complete & Continue'}
        </button>
      </div>
    </div>
  );
}