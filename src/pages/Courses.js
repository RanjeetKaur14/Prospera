import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-fire-950 text-white flex items-center justify-center">
        <div className="text-fire-500 text-2xl animate-pulse">Loading quests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-fire-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-fire-400 hover:text-fire-300"
          >
            ← Back to Lair
          </button>
          <h1 className="text-4xl font-bold text-fire-500">Choose Your Path</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="bg-black/40 backdrop-blur-sm rounded-2xl border border-fire-800 p-6 cursor-pointer hover:border-fire-600 hover:scale-105 transition transform"
            >
              <h2 className="text-2xl font-bold text-fire-400 mb-2 capitalize">{course.id}</h2>
              <p className="text-fire-300">{course.description}</p>
              <div className="mt-4 text-fire-500">Enter →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}