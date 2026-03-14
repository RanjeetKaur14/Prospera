import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import Onboarding from './components/Onboarding';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses'; 
import CourseDetail from './pages/CourseDetail';
import ModuleDetail from './pages/ModuleDetail';
import CourseReview from './pages/CourseReview';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
  path="/courses"
  element={
    <ProtectedRoute>
      <Courses />
    </ProtectedRoute>
  }
/>

            <Route
  path="/course/:courseId"
  element={
    <ProtectedRoute>
      <CourseDetail />
    </ProtectedRoute>
  }
/>
          <Route
  path="/course/:courseId/module/:moduleId"
  element={
    <ProtectedRoute>
      <ModuleDetail />
    </ProtectedRoute>
  }
/>
          <Route
  path="/course/:courseId/review"
  element={
    <ProtectedRoute>
      <CourseReview />
    </ProtectedRoute>
  }
/>

          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


// Inside Routes, add:
<Route
  path="/courses"
  element={
    <ProtectedRoute>
      <Courses />
    </ProtectedRoute>
  }
/>

export default App;