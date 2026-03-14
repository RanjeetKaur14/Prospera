import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, query, orderBy } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function CourseReview() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [phase, setPhase] = useState('discussion');
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        content: `Congratulations on completing all modules in the **${courseId}** course! I'm your **Dragon Coach**. Let's discuss what you've learned. What key concepts stood out to you? Feel free to ask any questions.`
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
    console.log('Raw content:', content); // Debug log

    // Try to parse the whole content as JSON first
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code block or just the object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not find JSON in response');
      const jsonString = jsonMatch[0];
      // Attempt to clean up trailing commas (simple version)
      const cleaned = jsonString.replace(/,(\s*[}\]])/g, '$1');
      parsed = JSON.parse(cleaned);
    }

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

  const generateAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not found.');

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
    generateTest();
  };

  const finish = () => {
    navigate('/dashboard');
  };

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundImage: `url('/coursevbackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-rose-600 text-2xl mb-4" style={fontStyle}>Error: {error}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage: `url('/coursevbackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
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

        <h1 className="text-5xl font-bold text-rose-800 drop-shadow-md mb-6 capitalize" style={fontStyle}>
          {courseId} Course Review
        </h1>

        {phase === 'discussion' && (
          <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
            <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-sm ${
                    msg.role === 'user' 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-white/40 text-rose-800'
                  }`}>
                    <div className="prose prose-rose max-w-none text-base">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/40 text-rose-600 p-4 rounded-sm">
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-white/40 border border-rose-200 rounded-sm px-4 py-3 text-rose-900 placeholder-rose-400 text-base"
                placeholder="Ask your dragon..."
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-6 py-3 bg-rose-600 text-white text-lg hover:bg-rose-700 disabled:opacity-50 transition"
              >
                Send
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={generateTest}
                disabled={loading}
                className="px-8 py-3 bg-rose-600 text-white text-xl font-semibold hover:bg-rose-700 transition"
                style={fontStyle}
              >
                I'm Ready for the Test
              </button>
            </div>
          </div>
        )}

        {phase === 'test' && !submitted && (
          <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
            <h2 className="text-3xl font-bold text-rose-800 mb-4" style={fontStyle}>Test Your Knowledge</h2>
            <p className="text-rose-600 text-lg mb-6">Answer all 10 questions. You need 70% to pass.</p>

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
                        <span className="text-rose-700 text-base">{opt}</span>
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
          </div>
        )}

        {submitted && phase !== 'analysis' && (
          <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 text-center shadow-lg">
            <h2 className="text-4xl font-bold text-rose-800 mb-4" style={fontStyle}>{passed ? 'Passed!' : 'Not Passed'}</h2>
            <p className="text-3xl text-rose-700 mb-2">Your score: {score}%</p>
            <p className="text-rose-600 text-xl mb-6">Passing score: 70%</p>

            {passed ? (
              <div>
                <p className="text-green-700 text-xl mb-4" style={fontStyle}>Congratulations! You've mastered the {courseId} course.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={generateAnalysis}
                    disabled={loading}
                    className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition"
                  >
                    {loading ? 'Generating...' : 'Get Detailed Analysis'}
                  </button>
                  <button
                    onClick={finish}
                    className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-rose-600 text-xl mb-4" style={fontStyle}>Don't worry, you can review and try again.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={generateAnalysis}
                    disabled={loading}
                    className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition"
                  >
                    {loading ? 'Generating...' : 'Get Detailed Analysis'}
                  </button>
                  <button
                    onClick={retryTest}
                    className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'analysis' && (
          <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-rose-800 mb-4" style={fontStyle}>Detailed Analysis</h2>
            <div className="prose prose-rose max-w-none text-rose-800 bg-white/40 p-6 rounded-sm max-h-[500px] overflow-y-auto text-lg">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
            <div className="mt-6 flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setPhase('discussion')}
                className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition"
              >
                Back to Discussion
              </button>
              <button
                onClick={finish}
                className="px-6 py-2 bg-rose-600 text-white text-lg hover:bg-rose-700 transition"
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