'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function QuizPage() {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { id: courseId, qid: quizId } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!quizId) return;
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      try {
        // Use the dedicated /quiz/{id} endpoint so questions are always included
        const res = await fetch(`http://localhost:8000/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.questions || data.questions.length === 0) {
            setError('This quiz has no questions yet. Please check back later.');
          } else {
            setQuiz(data);
          }
        } else {
          setError(`Quiz not found (${res.status}).`);
        }
      } catch(e) {
        setError('Failed to load quiz. Is the backend running?');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, router]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const answerList = quiz.questions.map((_, idx) => answers[idx] ?? -1);
    try {
      const res = await fetch(`http://localhost:8000/courses/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(answerList),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        // If failed (<80%), redirect back to the course page after 3s so user must study more
        if (!data.passed) {
          setTimeout(() => router.push(`/courses/${courseId}`), 3000);
        }
      } else { setError('Submission failed. Please try again.'); }
    } catch(e) {
      setError('Network error during submission.'); console.error(e);
    } finally { setSubmitting(false); }
  };

  const unanswered = quiz ? quiz.questions.length - Object.keys(answers).length : 0;

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#070200', color:'#D4AF37' }}>
      <div style={{ width:'50px', height:'50px', border:'3px solid rgba(212,175,55,.2)', borderTopColor:'#D4AF37', borderRadius:'50%', animation:'spin .9s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ marginTop:'16px', fontFamily:'"Cinzel",serif', letterSpacing:'2px', fontSize:'.8rem' }}>LOADING TRIAL...</p>
    </div>
  );

  if (error || !quiz) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#070200', color:'#ff6b6b', gap:'16px' }}>
      <div style={{ fontSize:'3rem' }}>⚠️</div>
      <p style={{ fontFamily:'"Cinzel",serif' }}>{error || 'Quiz not found.'}</p>
      <button onClick={() => router.push(`/courses/${courseId}`)} style={{ padding:'10px 24px', background:'#8B0000', border:'none', borderRadius:'8px', color:'#fff', cursor:'pointer', fontFamily:'"Cinzel",serif' }}>← Return</button>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#070200,#100600 50%,#08020c)', color:'#fff', padding:'40px 20px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');`}</style>

      <div style={{ maxWidth:'760px', margin:'0 auto' }}>
        {/* Back button */}
        <button onClick={() => router.push(`/courses/${courseId}`)} style={{ background:'none', border:'none', color:'rgba(212,175,55,.6)', cursor:'pointer', fontSize:'.85rem', marginBottom:'30px', display:'flex', alignItems:'center', gap:'6px' }}>
          ← Back to Course
        </button>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' }}>
          <h1 style={{ fontFamily:'"Cinzel",serif', fontSize:'clamp(1.4rem,4vw,2.2rem)', color:'#D4AF37', margin:0 }}>{quiz.title}</h1>
          <div style={{ background:'rgba(139,0,0,.3)', border:'1px solid rgba(139,0,0,.5)', borderRadius:'20px', padding:'4px 14px', fontSize:'.7rem', color:'#ff9999', fontWeight:'bold', whiteSpace:'nowrap' }}>
            {quiz.is_diagnostic ? '⚔️ SKIP TRIAL' : '📖 MODULE QUIZ'}
          </div>
        </div>

        {result ? (
          /* ===== RESULT SCREEN ===== */
          <div style={{ textAlign:'center', padding:'50px 30px', background:'rgba(10,5,0,.8)', border:`2px solid ${result.passed?'#D4AF37':'#8B0000'}`, borderRadius:'20px' }}>
            <div style={{ fontSize:'4rem', marginBottom:'16px' }}>{result.passed ? '🎉' : '📚'}</div>
            <h2 style={{ fontFamily:'"Cinzel",serif', color: result.passed?'#D4AF37':'#ff6b6b', fontSize:'2rem', marginBottom:'16px' }}>
              {result.passed ? 'TRIAL PASSED!' : 'KEEP TRAINING'}
            </h2>
            <div style={{ width:'120px', height:'120px', borderRadius:'50%', border:`5px solid ${result.passed?'#D4AF37':'#8B0000'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:'2rem', fontWeight:'bold', color: result.passed?'#D4AF37':'#ff6b6b', boxShadow: result.passed?'0 0 30px rgba(212,175,55,.4)':'none' }}>
              {Math.round(result.score)}%
            </div>
            <p style={{ color:'#aaa', lineHeight:1.6, maxWidth:'400px', margin:'0 auto 30px', fontSize:'.9rem' }}>
              {result.passed
                ? `Excellent! You scored ${Math.round(result.score)}%. ${quiz.is_diagnostic ? 'All modules in this course have been marked complete. +200 XP!' : 'Module marked as complete. +50 XP!'}`
                : `You scored ${Math.round(result.score)}%. You need at least 80% to pass. Review the lesson and try again.`}
            </p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
              {!result.passed && (
                <button onClick={() => { setResult(null); setAnswers({}); }} style={{ padding:'10px 24px', background:'rgba(139,0,0,.4)', border:'1px solid #8B0000', borderRadius:'8px', color:'#ff9999', cursor:'pointer', fontFamily:'"Cinzel",serif', fontSize:'.8rem' }}>
                  ↺ Try Again
                </button>
              )}
              <button onClick={() => router.push('/courses')} style={{ padding:'10px 24px', background:'linear-gradient(90deg,#8B0000,#D4AF37)', border:'none', borderRadius:'8px', color:'#000', cursor:'pointer', fontWeight:'bold', fontFamily:'"Cinzel",serif', fontSize:'.8rem' }}>
                Back to Academy
              </button>
            </div>
          </div>
        ) : (
          /* ===== QUESTIONS ===== */
          <>
            <p style={{ color:'rgba(212,175,55,.5)', fontSize:'.8rem', marginBottom:'30px' }}>
              Score <strong style={{ color:'#f4d03f' }}>80% or above</strong> to pass this trial.
            </p>

            {quiz.questions.map((q, qIdx) => {
              const opts = (() => { try { return JSON.parse(q.options); } catch { return q.options; } })();
              return (
                <div key={q.id} style={{ marginBottom:'28px', padding:'22px', background:'rgba(15,8,3,.85)', border:`1px solid ${answers[qIdx] !== undefined ? 'rgba(212,175,55,.3)' : 'rgba(255,255,255,.06)'}`, borderRadius:'12px', transition:'border-color .2s' }}>
                  <p style={{ color:'#e8e8e8', fontSize:'.95rem', fontWeight:'bold', marginBottom:'16px', lineHeight:1.5 }}>
                    <span style={{ color:'rgba(212,175,55,.6)', marginRight:'8px' }}>{qIdx + 1}.</span>
                    {q.question_text}
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {opts.map((opt, oIdx) => (
                      <label key={oIdx} onClick={() => setAnswers(a => ({ ...a, [qIdx]: oIdx }))} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background: answers[qIdx] === oIdx ? 'rgba(212,175,55,.1)' : 'rgba(255,255,255,.02)', border: `1px solid ${answers[qIdx] === oIdx ? 'rgba(212,175,55,.5)' : 'rgba(255,255,255,.05)'}`, borderRadius:'8px', cursor:'pointer', transition:'all .15s', color: answers[qIdx] === oIdx ? '#D4AF37' : '#ccc', fontSize:'.88rem' }}>
                        <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px solid ${answers[qIdx] === oIdx ? '#D4AF37' : '#333'}`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {answers[qIdx] === oIdx && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#D4AF37' }} />}
                        </div>
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Submit */}
            <div style={{ position:'sticky', bottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', background:'rgba(10,5,0,.95)', border:'1px solid rgba(212,175,55,.2)', borderRadius:'12px', backdropFilter:'blur(10px)', marginTop:'20px' }}>
              <span style={{ color:'#555', fontSize:'.8rem' }}>
                {unanswered > 0 ? `${unanswered} question${unanswered>1?'s':''} remaining` : '✓ All answered'}
              </span>
              <button onClick={handleSubmit} disabled={unanswered > 0 || submitting} style={{ padding:'10px 28px', background: unanswered > 0 ? '#1a1a1a' : 'linear-gradient(90deg,#8B0000,#D4AF37)', border:'none', borderRadius:'8px', color: unanswered > 0 ? '#555' : '#000', fontWeight:'bold', cursor: unanswered > 0 ? 'not-allowed' : 'pointer', fontFamily:'"Cinzel",serif', fontSize:'.85rem', transition:'all .2s' }}>
                {submitting ? 'SUBMITTING...' : 'SUBMIT TRIAL ⚔️'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
