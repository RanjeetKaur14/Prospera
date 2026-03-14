import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, getDocs, query, orderBy } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function ModuleDetail() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [detailedContent, setDetailedContent] = useState('');

  useEffect(() => {
    async function fetchModule() {
      try {
        const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
        const moduleSnap = await getDoc(moduleRef);
        if (!moduleSnap.exists()) {
          navigate(`/course/${courseId}`);
          return;
        }
        const moduleData = { id: moduleSnap.id, ...moduleSnap.data() };
        setModule(moduleData);

        // Check if detailed content already exists
        if (moduleData.detailedContent) {
          setDetailedContent(moduleData.detailedContent);
        } else {
          // Generate content using Groq
          await generateDetailedContent(moduleData);
        }

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

  const generateDetailedContent = async (moduleData) => {
    setGenerating(true);
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not found.');

      const prompt = `You are a financial education expert. Create a detailed, engaging lesson on the topic "${moduleData.title}" based on this brief description: "${moduleData.description}".
      The lesson should be structured like a mini research paper or textbook chapter with:
      - An introduction
      - Several sections with headings (##)
      - Bullet points or numbered lists where appropriate
      - Real-world examples
      - Key takeaways
      - A summary
      Format the entire response in markdown. Make it comprehensive and suitable for a learner.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a helpful financial tutor.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) throw new Error(`API error (${response.status})`);
      const data = await response.json();
      const content = data.choices[0].message.content;

      // Save to Firestore
      const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
      await updateDoc(moduleRef, { detailedContent: content });
      setDetailedContent(content);
    } catch (error) {
      console.error('Error generating content:', error);
      setDetailedContent('Failed to generate content. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async () => {
    if (isCompleted) {
      goToNextModule();
      return;
    }

    setCompleting(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const moduleXp = module.xp || 50;

      await updateDoc(userRef, {
        completedModules: arrayUnion(`${courseId}_${moduleId}`),
        xp: increment(moduleXp)
      });

      setIsCompleted(true);
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
      const modulesCol = collection(db, 'courses', courseId, 'modules');
      const modulesQuery = query(modulesCol, orderBy('order'));
      const modulesSnap = await getDocs(modulesQuery);
      const allModules = modulesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const completed = userSnap.exists() ? (userSnap.data().completedModules || []) : [];

      const nextModule = allModules.find(m => !completed.includes(`${courseId}_${m.id}`));
      if (nextModule) {
        navigate(`/course/${courseId}/module/${nextModule.id}`);
      } else {
        navigate(`/course/${courseId}/review`);
      }
    } catch (error) {
      console.error('Error finding next module:', error);
      navigate(`/course/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url('/moduledetail.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="text-rose-700 text-2xl animate-pulse" style={fontStyle}>Loading module...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage: `url('/moduledetail.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="px-5 py-1 border border-rose-600/30 text-rose-700 hover:text-rose-900 hover:border-rose-600 transition rounded-sm text-base tracking-wide"
            style={fontStyle}
          >
            ← Back to Modules
          </button>
        </div>

        <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 mb-8 shadow-lg">
          <h1 className="text-4xl font-bold text-rose-800 mb-4" style={fontStyle}>{module?.title}</h1>
          {generating ? (
            <div className="text-rose-600 text-xl animate-pulse">Crafting your lesson...</div>
          ) : (
            <div className="prose prose-rose max-w-none text-rose-800 text-lg">
              <ReactMarkdown>{detailedContent || module?.description}</ReactMarkdown>
            </div>
          )}
          {module?.xp && (
            <div className="mt-4 text-rose-600 bg-white/40 inline-block px-4 py-2 rounded-sm text-base">
              Reward: {module.xp} XP
            </div>
          )}
        </div>

        <button
          onClick={handleComplete}
          disabled={completing || generating}
          className={`w-full py-4 font-bold text-xl transition ${
            isCompleted
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
          style={fontStyle}
        >
          {completing
            ? 'Completing...'
            : generating
            ? 'Generating lesson...'
            : isCompleted
            ? 'Already Completed - Next →'
            : 'Complete & Continue'}
        </button>
      </div>
    </div>
  );
}