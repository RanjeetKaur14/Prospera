import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function CourseReview() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [phase, setPhase] = useState('discussion'); // 'discussion', 'test', 'analysis'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [passed, setPassed] = useState(false);
  const [courseContent, setCourseContent] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    async function fetchCourseContent() {
      try {
        const modulesCol = collection(db, 'courses', courseId, 'modules');
        const modulesSnap = await getDocs(query(modulesCol, orderBy('order')));
        const modules = modulesSnap.docs.map(doc => doc.data());
        const content = modules.map(m => `Module: ${m.title}\n${m.description}`).join('\n\n');
        setCourseContent(content);
      } catch (err) {
        console.error('Error fetching course content:', err);
        setError('Failed to load course content.');
      }
    }
    fetchCourseContent();
  }, [courseId]);

  // Start discussion with AI prompt
  useEffect(() => {
    if (phase === 'discussion' && messages.length === 0 && courseContent) {
      const initialMessage = {
        role: 'assistant',
        content: `Congratulations on completing all modules in the ${courseId} course! I'm your Dragon Coach. Let's discuss what you've learned. What key concepts stood out to you? Feel free to ask any questions.`
      };
      setMessages([initialMessage]);
    }
  }, [phase, courseId, messages.length, courseContent]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
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
              content: `You are a friendly financial coach helping a user review the ${courseId} course. 
                        Course content: ${courseContent}. 
                        Engage in a natural conversation to reinforce learning, ask questions, clarify doubts.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error(`API error (${response.status})`);
      const data = await response.json();
      if (!data.choices?.[0]?.message) throw new Error('Invalid response format');

      const botMessage = { role: 'assistant', content: data.choices[0].message.content };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTest = async () => {
    setLoading(true);
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
              content: `Generate 10 multiple-choice questions based on this course content: ${courseContent}.
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

      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse JSON from response');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error('Invalid questions format');
      setQuestions(parsed.questions);
      setPhase('test');
    } catch (error) {
      console.error('Error generating test:', error);
      setError(error.message);
    } finally {
      setLoading(false);
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

    const passed = scorePercent >= 70;
    setPassed(passed);

    if (passed) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          completedCourses: arrayUnion(courseId)
        });
      } catch (error) {
        console.error('Error updating completed courses:', error);
      }
    }
  };

  // NEW: Generate detailed analysis using Groq
  const generateAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not found.');

      // Build a summary of the test results
      const questionsData = questions.map((q, idx) => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        userAnswer: answers[idx] || 'Not answered',
        isCorrect: answers[idx] === q.correct
      }));

      const prompt = `Based on the following multiple-choice test results, provide a detailed analysis for the user:
- For each question, explain the correct answer and why the user's answer (if wrong) is incorrect.
- Give an overall summary of their performance (strengths, weaknesses).
- Suggest topics to review.

Questions and answers:
${JSON.stringify(questionsData, null, 2)}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a helpful financial tutor providing detailed test feedback.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) throw new Error(`API error (${response.status})`);
      const data = await response.json();
      if (!data.choices?.[0]?.message) throw new Error('Invalid response format');

      setAnalysis(data.choices[0].message.content);
      setPhase('analysis');
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const retryTest = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setAnalysis('');
    generateTest(); // generate new questions
  };

  const finish = () => {
    navigate('/dashboard');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400 text-xl mb-4">Error: {error}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-red-600 rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-6 capitalize">
          {courseId} Course Review
        </h1>

        {phase === 'discussion' && (
          <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-6">
            <div className="h-96 overflow-y-auto mb-4 space-y-3 p-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-gray-400">Thinking...</div>}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-black/60 border border-red-700 rounded-lg px-4 py-2 text-white"
                placeholder="Ask your dragon..."
              />
              <button onClick={sendMessage} disabled={loading} className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                Send
              </button>
            </div>

            <div className="mt-6 text-center">
              <button onClick={generateTest} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-bold">
                I'm Ready for the Test
              </button>
            </div>
          </div>
        )}

        {phase === 'test' && !submitted && (
          <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Test Your Knowledge</h2>
            <p className="text-gray-300 mb-6">Answer all 10 questions. You need 70% to pass.</p>

            {questions.map((q, idx) => (
              <div key={idx} className="mb-6 p-4 bg-black/40 rounded-lg">
                <p className="font-semibold text-red-300 mb-2">{idx+1}. {q.question}</p>
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
                          className="accent-red-500"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={submitTest}
              disabled={Object.keys(answers).length < questions.length}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-bold disabled:opacity-50"
            >
              Submit Test
            </button>
          </div>
        )}

        {submitted && phase !== 'analysis' && (
          <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">{passed ? '🎉 Passed!' : '😞 Not Passed'}</h2>
            <p className="text-2xl mb-2">Your score: {score}%</p>
            <p className="text-gray-300 mb-6">Passing score: 70%</p>

            {passed ? (
              <div>
                <p className="text-green-400 mb-4">Congratulations! You've mastered the {courseId} course.</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={generateAnalysis}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {loading ? 'Generating...' : 'Get Detailed Analysis'}
                  </button>
                  <button
                    onClick={finish}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-400 mb-4">Don't worry, you can review and try again.</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={generateAnalysis}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {loading ? 'Generating...' : 'Get Detailed Analysis'}
                  </button>
                  <button
                    onClick={retryTest}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'analysis' && (
          <div className="bg-black/60 backdrop-blur rounded-2xl border border-red-500/30 p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">📊 Detailed Analysis</h2>
            <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap">
              {analysis}
            </div>
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={() => setPhase('discussion')}
                className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700"
              >
                Back to Discussion
              </button>
              <button
                onClick={finish}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}