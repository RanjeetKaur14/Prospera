'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Renders the slide-based content from seed.py
function SlideContent({ contentStr }) {
  let slides = [];
  try {
    slides = JSON.parse(contentStr);
  } catch {
    // Not JSON — just raw text, show as-is
    return <p style={{ color: '#ccc', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{contentStr}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {slides.map((slide, i) => {
        if (slide.type === 'dragon') return (
          <div key={i} style={{ display: 'flex', gap: '14px', padding: '18px 20px', background: 'rgba(139,0,0,.12)', border: '1px solid rgba(139,0,0,.3)', borderRadius: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>🐉</span>
            <p style={{ color: '#f0d080', lineHeight: 1.7, margin: 0, fontStyle: 'italic', fontSize: '1rem' }}>{slide.text}</p>
          </div>
        );
        if (slide.type === 'visual') return (
          <div key={i} style={{ padding: '24px', background: 'rgba(212,175,55,.06)', border: '1px dashed rgba(212,175,55,.3)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📊</div>
            <p style={{ color: 'rgba(212,175,55,.7)', fontSize: '.85rem', margin: 0 }}>Visual: {slide.chart?.replace(/_/g, ' ')}</p>
          </div>
        );
        // Default: regular slide
        return (
          <div key={i} style={{ padding: '18px 22px', background: 'rgba(20,12,5,.7)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '10px' }}>
            <p style={{ color: '#e0e0e0', lineHeight: 1.75, margin: 0, fontSize: '1rem' }}>{slide.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function ModulePage() {
  const [courseData, setCourseData] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const { id, mid } = useParams();
  console.log("Params:", { id, mid });
  const router = useRouter();

  useEffect(() => {

    if (!id || !mid) return;
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch(`http://localhost:8000/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { setError(`Could not load course (${res.status})`); return; }
        const course = await res.json();
        setCourseData(course);
        const found = course.modules?.find(m => m.id === parseInt(mid));
        if (found) {
          setModule(found);
        } else {
          setError(`Module #${mid} not found in this course.`);
        }
      } catch (e) {
        setError('Network error loading module. Is the backend running?');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, mid, router]);

  const handleAIChat = async () => {
    const token = localStorage.getItem('token');
    if (!chatQuery.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/chat/module?module_id=${mid}&user_query=${encodeURIComponent(chatQuery)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatResponse(data.choices?.[0]?.message?.content || 'Long is thinking...');
      }
    } catch (e) { console.error(e); }
    finally { setChatLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070200', color: '#D4AF37' }}>
      <div style={{ width: '50px', height: '50px', border: '3px solid rgba(212,175,55,.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ marginTop: '14px', fontFamily: '"Cinzel",serif', letterSpacing: '2px', fontSize: '.8rem' }}>UNROLLING THE SCROLL...</p>
    </div>
  );

  if (error || !module) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070200', color: '#ff6b6b', gap: '14px' }}>
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <p style={{ fontFamily: '"Cinzel",serif' }}>{error || 'Module not found.'}</p>
      <button onClick={() => router.push(`/courses/${id}`)} style={{ padding: '10px 24px', background: '#8B0000', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontFamily: '"Cinzel",serif' }}>
        ← Back to Course
      </button>
    </div>
  );

  const firstQuiz = module.quizzes?.[0];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#070200,#100600 60%,#08020c)', color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');`}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '32px' }}>

        {/* ===== LEFT: Lesson content ===== */}
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '.8rem', color: '#555' }}>
            <button onClick={() => router.push('/courses')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>Academy</button>
            <span>›</span>
            <button onClick={() => router.push(`/courses/${id}`)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>{courseData?.title}</button>
            <span>›</span>
            <span style={{ color: '#D4AF37' }}>{module.title}</span>
          </div>

          {/* Module header */}
          <div style={{ marginBottom: '28px', padding: '24px', background: 'rgba(10,5,0,.7)', border: '1px solid rgba(212,175,55,.2)', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <h1 style={{ fontFamily: '"Cinzel",serif', color: '#D4AF37', fontSize: 'clamp(1.2rem,3vw,1.8rem)', margin: 0 }}>{module.title}</h1>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {module.is_completed && (
                  <span style={{ background: 'rgba(46,204,113,.15)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '3px 10px', borderRadius: '12px', fontSize: '.7rem', fontWeight: 'bold' }}>
                    ✓ CLEARED
                  </span>
                )}
                {module.score_percentage != null && (
                  <span style={{ color: module.score_percentage >= 80 ? '#2ecc71' : '#f4d03f', fontSize: '.75rem' }}>
                    Quiz: {module.score_percentage}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Slide-based content */}
          <SlideContent contentStr={module.content || ''} />

          {/* Examples */}
          {module.examples && (
            <div style={{ marginTop: '20px', padding: '18px 22px', background: 'rgba(212,175,55,.05)', border: '1px solid rgba(212,175,55,.15)', borderRadius: '10px' }}>
              <p style={{ color: 'rgba(212,175,55,.7)', fontSize: '.75rem', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>EXAMPLE</p>
              <p style={{ color: '#ccc', lineHeight: 1.65, margin: 0, fontSize: '.9rem' }}>{module.examples}</p>
            </div>
          )}

          {/* Quiz CTA */}
          {firstQuiz && (
            <div style={{ marginTop: '32px', padding: '24px', background: 'linear-gradient(135deg,rgba(139,0,0,.2),rgba(10,5,0,.8))', border: '1px solid rgba(139,0,0,.4)', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚔️</div>
              <h3 style={{ fontFamily: '"Cinzel",serif', color: '#D4AF37', margin: '0 0 8px' }}>READY FOR THE TRIAL?</h3>
              <p style={{ color: '#888', fontSize: '.82rem', marginBottom: '16px' }}>Score <strong style={{ color: '#f4d03f' }}>80% or above</strong> to clear this module and advance.</p>
              <button onClick={() => router.push(`/courses/${id}/quiz/${firstQuiz.id}`)} style={{ padding: '12px 30px', background: 'linear-gradient(90deg,#8B0000,#D4AF37)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Cinzel",serif', fontSize: '.9rem' }}>
                TAKE THE QUIZ ⚔️
              </button>
            </div>
          )}
        </div>

        {/* ===== RIGHT: AI Tutor ===== */}
        <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
          <div style={{ padding: '22px', background: 'rgba(10,5,0,.85)', border: '1px solid rgba(212,175,55,.2)', borderRadius: '14px', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,.15)' }}>
              <span style={{ fontSize: '1.6rem' }}>🐉</span>
              <div>
                <div style={{ color: '#D4AF37', fontFamily: '"Cinzel",serif', fontWeight: 'bold', fontSize: '.88rem' }}>LONG</div>
                <div style={{ color: '#555', fontSize: '.58rem', letterSpacing: '1px' }}>Module AI Tutor</div>
              </div>
            </div>
            <p style={{ color: '#666', fontSize: '.75rem', marginBottom: '14px', lineHeight: 1.5 }}>Ask me anything about this lesson. My wisdom is bounded by this scroll.</p>
            <textarea
              placeholder="Ask the Dragon..."
              value={chatQuery}
              onChange={e => setChatQuery(e.target.value)}
              style={{ width: '100%', height: '90px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,.04)', color: '#fff', border: '1px solid rgba(255,255,255,.08)', fontSize: '.82rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button onClick={handleAIChat} disabled={chatLoading || !chatQuery.trim()} style={{ marginTop: '8px', width: '100%', padding: '9px', background: chatLoading ? '#1a1a1a' : 'linear-gradient(90deg,#8B0000,#D4AF37)', border: 'none', borderRadius: '8px', color: chatLoading ? '#555' : '#000', fontWeight: 'bold', cursor: chatLoading ? 'wait' : 'pointer', fontFamily: '"Cinzel",serif', fontSize: '.78rem' }}>
              {chatLoading ? 'Dragon is thinking...' : 'ASK LONG 🐉'}
            </button>
            {chatResponse && (
              <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(212,175,55,.05)', borderRadius: '8px', fontSize: '.82rem', lineHeight: 1.6, color: '#ddd', border: '1px solid rgba(212,175,55,.1)' }}>
                {chatResponse}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
