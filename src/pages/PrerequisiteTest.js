import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, query, orderBy } from 'firebase/firestore';

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function PrerequisiteTest() {
  const { courseId } = useParams(); // e.g., 'beginner'
  const [searchParams] = useSearchParams();
  const targetCourse = searchParams.get('next'); // e.g., 'intermediate'
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [passed, setPassed] = useState(false);
  const [courseContent, setCourseContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCourseContent() {
      try {
        const modulesCol = collection(db, 'courses', courseId, 'modules');
        const modulesSnap = await getDocs(query(modulesCol, orderBy('order')));
        const modules = modulesSnap.docs.map(doc => doc.data());
        const content = modules.map(m => `Module: ${m.title}\n${m.description}`).join('\n\n');
        setCourseContent(content);
        await generateTest(content);
      } catch (err) {
        console.error('Error fetching course content:', err);
        setError('Failed to load course content.');
      } finally {
        setLoading(false);
      }
    }
    fetchCourseContent();
  }, [courseId]);

  const generateTest = async (content) => {
    setGenerating(true);
    setError('');
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not found.');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Generate 20 multiple-choice questions based on this course content: ${content}.
                        Each question should have 4 options (A, B, C, D) and indicate the correct answer.
                        Output in valid JSON format like:
                        {
                          "questions": [
                            {
                              "question": "What is a budget?",
                              "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
                              "correct": "A"
                            },
                            ...
                          ]
                        }`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) throw new Error(`API error (${response.status})`);
      const data = await response.json();
      if (!data.choices?.[0]?.message) throw new Error('Invalid API response');

      const contentResponse = data.choices[0].message.content;
      // Try to extract JSON
      const jsonMatch = contentResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse JSON from response');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error('Invalid questions format');
      setQuestions(parsed.questions);
    } catch (error) {
      console.error('Error generating test:', error);
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const submitTest = async () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) correctCount++;
    });
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    setScore(scorePercent);
    setSubmitted(true);

    const passed = scorePercent >= 80;
    setPassed(passed);

    if (passed && targetCourse) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          passedPrerequisiteTests: arrayUnion(courseId)
        });
        // Redirect to the target course after a short delay to show success message
        setTimeout(() => navigate(`/course/${targetCourse}`), 2000);
      } catch (error) {
        console.error('Error updating passed tests:', error);
      }
    }
  };

  const retryTest = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setPassed(false);
    generateTest(courseContent);
  };

  const goBack = () => {
    navigate(`/course/${targetCourse || 'beginner'}`);
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url('/prereqbackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="text-rose-600 text-2xl animate-pulse" style={fontStyle}>
          {loading ? 'Loading test...' : 'Generating questions...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundImage: `url('/prereqbackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="max-w-2xl mx-auto bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 shadow-lg text-center">
          <p className="text-rose-700 text-xl mb-4">{error}</p>
          <button onClick={goBack} className="px-6 py-2 bg-rose-600 text-white hover:bg-rose-700 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: `url('/prereqbackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: "'Cormorant Garamond', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />
      <div className="max-w-3xl mx-auto">
        <button onClick={goBack} className="mb-6 px-5 py-1 border border-rose-600/30 text-rose-700 hover:text-rose-900 hover:border-rose-600 transition rounded-sm text-base tracking-wide">
          ← Back
        </button>

        <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 shadow-lg">
          <h1 className="text-4xl font-bold text-rose-800 mb-2 capitalize" style={fontStyle}>
            {courseId} Prerequisite Test
          </h1>
          <p className="text-rose-600 text-lg mb-6">
            {targetCourse ? `Pass this test to unlock ${targetCourse} course.` : 'Test your knowledge.'}
          </p>

          {!submitted ? (
            <>
              <p className="text-rose-700 mb-4">You need to score <span className="font-bold">80% or higher</span> to proceed.</p>
              {questions.map((q, idx) => (
                <div key={idx} className="mb-6 p-4 bg-white/40 border border-rose-100">
                  <p className="font-semibold text-rose-800 text-xl mb-2" style={fontStyle}>{idx+1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const optionLetter = String.fromCharCode(65 + optIdx);
                      return (
                        <label key={optIdx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`q${idx}`}
                            value={optionLetter}
                            checked={answers[idx] === optionLetter}
                            onChange={() => handleAnswerChange(idx, optionLetter)}
                            className="accent-rose-600"
                          />
                          <span className="text-rose-700 text-lg">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button
                onClick={submitTest}
                disabled={Object.keys(answers).length < questions.length}
                className="w-full py-3 bg-rose-600 text-white text-xl font-semibold disabled:opacity-50 hover:bg-rose-700 transition"
                style={fontStyle}
              >
                Submit Test
              </button>
            </>
          ) : (
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-rose-600'}`}>
                {passed ? ' Passed!' : 'Not Passed'}
              </h2>
              <p className="text-2xl text-rose-700 mb-2">Your score: {score}%</p>
              <p className="text-rose-600 text-lg mb-6">Passing score: 80%</p>

              {passed ? (
                <div>
                  <p className="text-green-600 text-xl mb-4" style={fontStyle}>You've unlocked the {targetCourse} course!</p>
                  <p className="text-rose-500">Redirecting...</p>
                </div>
              ) : (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={retryTest}
                    className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={goBack}
                    className="px-6 py-2 bg-white/40 border border-rose-300 text-rose-700 hover:bg-white/60 transition"
                  >
                    Back to Courses
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}