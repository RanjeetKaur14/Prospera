'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const COURSE_META = {
  'Treasure of Money':                 { icon: '🪙', accentColor: '#F4D03F' },
  'Saving Your Gold':                  { icon: '🏦', accentColor: '#52BE80' },
  'Spending Wisely':                   { icon: '🧧', accentColor: '#F0B27A' },
  'First Investment Adventure':        { icon: '📈', accentColor: '#5DADE2' },
  'Child Mastery Test':                { icon: '🐲', accentColor: '#E74C3C' },
  'Young Professional Placement Test': { icon: '⚔️', accentColor: '#D4AF37' },
  'Budgeting Basics':                  { icon: '💰', accentColor: '#A9CCE3' },
};

const BRACKETS = {
  'Bracket 1': { name: 'CHILD REALM',    emoji: '🐣', color: '#4E96D9' },
  'Bracket 2': { name: 'YOUNG WARRIOR',  emoji: '⚔️', color: '#D4AF37' },
  'Bracket 3': { name: 'MASTER DOMAIN',  emoji: '🏯', color: '#C0392B' },
};

function getMeta(title) {
  return COURSE_META[title] || { icon: '📜', accentColor: '#aaa' };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMentor, setShowMentor] = useState(false);
  const [mentorMsg, setMentorMsg] = useState('');
  const [popup, setPopup] = useState(null); // { course }
  const router = useRouter();
  const petalsRef = useRef([]);

  // stable petal positions, not regenerated each render
  if (!petalsRef.current.length) {
    petalsRef.current = [...Array(16)].map((_, i) => ({
      left: `${(i * 47 + 3) % 100}%`,
      dur:  `${11 + (i * 2.3) % 9}s`,
      del:  `${(i * 1.9) % 10}s`,
      sz:   `${9 + (i * 5) % 12}px`,
    }));
  }

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); router.push('/login'); return; }
      try {
        const [ur, cr] = await Promise.all([
          fetch('http://localhost:8000/users/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:8000/courses',   { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (ur.ok) setUser(await ur.json());
        if (cr.ok) setCourses(await cr.json());
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      setTimeout(() => {
        setMentorMsg(`Welcome, ${user.full_name || 'young traveler'}. Every node on the path is a trial. Click a glowing lantern to explore it — STUDY the scroll or PROVE your knowledge by taking the quiz directly. Score 80%+ to advance. 🐉`);
        setShowMentor(true);
      }, 900);
    }
  }, [loading, user]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#070200', color:'#D4AF37' }}>
      <div style={{ width:'56px', height:'56px', border:'3px solid rgba(212,175,55,.25)', borderTopColor:'#D4AF37', borderRadius:'50%', animation:'spin .9s linear infinite', marginBottom:'16px' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontFamily:'"Cinzel",serif', letterSpacing:'3px', fontSize:'.78rem', opacity:.65 }}>SUMMONING THE PATHS...</p>
    </div>
  );

  // zig-zag node positions: alternating top / bottom half, spaced 220px apart
  // Each node gets {x, y} relative to a canvas that is 220*courses.length wide, 600px tall
  const NODE_SPACING = 220;
  const CANVAS_H = 600;
  const BAND_TOP = 160, BAND_BOT = 430;
  const nodes = courses.map((c, i) => ({
    ...c,
    x: 80 + i * NODE_SPACING,
    y: i % 2 === 0 ? BAND_TOP : BAND_BOT,
  }));
  const totalW = 80 + courses.length * NODE_SPACING + 80;

  // Build SVG path through all nodes
  const pathD = nodes.length < 2 ? '' : nodes.reduce((acc, n, i) => {
    if (i === 0) return `M ${n.x} ${n.y}`;
    const prev = nodes[i - 1];
    const cpx = (prev.x + n.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${n.y}, ${n.x} ${n.y}`;
  }, '');

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#070200,#100600 50%,#08020c)', color:'#fff', position:'relative', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
        @keyframes petal { 0%{transform:translateY(-20px) rotate(0deg);opacity:.8} 100%{transform:translateY(110vh) rotate(680deg);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes glow  { 0%,100%{box-shadow:0 0 10px rgba(212,175,55,.3)} 50%{box-shadow:0 0 28px rgba(212,175,55,.7),0 0 50px rgba(139,0,0,.25)} }
        .nd { animation:float 3.2s ease-in-out infinite; transition:transform .15s; cursor:pointer; }
        .nd:hover { transform:scale(1.18)!important; animation:none; }
        .nd-done { animation:glow 2.5s ease-in-out infinite; cursor:pointer; }
        .nd-done:hover { transform:scale(1.12); animation:none; }
        .popup-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:2000; display:flex; align-items:center; justify-content:center; }
        .popup-box { background:linear-gradient(160deg,#160900,#090012); border:1.5px solid #D4AF37; border-radius:16px; padding:28px; width:min(440px,94vw); max-height:85vh; overflow-y:auto; }
        .mod-row { display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:7px; background:rgba(255,255,255,.025); border-radius:8px; border:1px solid rgba(255,255,255,.05); }
        .btn-study { padding:5px 12px; background:rgba(212,175,55,.1); border:1px solid rgba(212,175,55,.3); border-radius:6px; color:#D4AF37; font-size:.65rem; cursor:pointer; font-weight:bold; transition:background .15s; }
        .btn-study:hover { background:rgba(212,175,55,.25); }
        .btn-skip  { padding:5px 12px; background:rgba(139,0,0,.35); border:1px solid rgba(139,0,0,.5); border-radius:6px; color:#ff9999; font-size:.65rem; cursor:pointer; font-weight:bold; transition:background .15s; }
        .btn-skip:hover  { background:rgba(139,0,0,.65); }
        ::-webkit-scrollbar{ width:4px; height:4px; }
        ::-webkit-scrollbar-track{ background:transparent; }
        ::-webkit-scrollbar-thumb{ background:#8B0000; border-radius:2px; }
      `}</style>

      {/* Falling petals */}
      {petalsRef.current.map((p,i) => (
        <div key={i} style={{ position:'fixed', top:'-20px', left:p.left, width:p.sz, height:p.sz, background:'radial-gradient(circle at 40% 30%,#ffb7c5,#e87090)', borderRadius:'60% 0 60% 0', zIndex:998, pointerEvents:'none', animation:`petal ${p.dur} ${p.del} linear infinite` }} />
      ))}

      {/* Dragon mentor popup */}
      {showMentor && (
        <div style={{ position:'fixed', bottom:'18px', right:'18px', width:'290px', background:'linear-gradient(160deg,#160900,#090012)', border:'1.5px solid #D4AF37', borderRadius:'12px', padding:'16px', zIndex:1001, boxShadow:'0 0 40px rgba(212,175,55,.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', paddingBottom:'10px', borderBottom:'1px solid rgba(212,175,55,.2)' }}>
            <span style={{ fontSize:'1.9rem' }}>🐉</span>
            <div>
              <div style={{ color:'#D4AF37', fontFamily:'"Cinzel",serif', fontWeight:'bold', fontSize:'.88rem', letterSpacing:'2px' }}>LONG</div>
              <div style={{ color:'#555', fontSize:'.58rem', letterSpacing:'1px' }}>GUARDIAN · DRAGON ACADEMY</div>
            </div>
          </div>
          <p style={{ fontSize:'.76rem', lineHeight:1.65, color:'#ccc', fontStyle:'italic', margin:0 }}>{mentorMsg}</p>
          <button onClick={() => setShowMentor(false)} style={{ marginTop:'12px', width:'100%', padding:'7px', background:'linear-gradient(90deg,#8B0000,#D4AF37)', border:'none', borderRadius:'6px', color:'#000', fontWeight:'bold', cursor:'pointer', fontFamily:'"Cinzel",serif', fontSize:'.72rem' }}>
            UNDERSTOOD ⚔️
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign:'center', paddingTop:'52px', paddingBottom:'30px', position:'relative' }}>
        <div style={{ fontSize:'8rem', opacity:.04, position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', pointerEvents:'none', color:'#D4AF37', lineHeight:1, userSelect:'none' }}>龍</div>
        <h1 style={{ fontFamily:'"Cinzel",serif', fontSize:'clamp(1.8rem,5vw,3.8rem)', fontWeight:900, margin:0, background:'linear-gradient(180deg,#D4AF37 0%,#8B0000 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'5px' }}>DRAGON ACADEMY</h1>
        <p style={{ color:'rgba(212,175,55,.5)', letterSpacing:'7px', fontSize:'.72rem', marginTop:'5px', fontFamily:'"Cinzel",serif' }}>PATH TO PROSPERITY</p>
        <p style={{ color:'rgba(255,255,255,.3)', fontSize:'.72rem', marginTop:'6px' }}>← scroll horizontally to follow the path →</p>
      </div>

      {/* ====== ZIG-ZAG PATH CANVAS ====== */}
      <div style={{ overflowX:'auto', overflowY:'visible', paddingBottom:'180px', WebkitOverflowScrolling:'touch', cursor:'grab' }}>
        <div style={{ width:`${totalW}px`, height:`${CANVAS_H}px`, position:'relative', flexShrink:0 }}>

          {/* SVG path */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'visible' }}>
            {/* Glow path */}
            <path d={pathD} fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="60" strokeLinecap="round" />
            {/* Main dashed path */}
            <path d={pathD} fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth="3" strokeDasharray="14,10" strokeLinecap="round" />
          </svg>

          {/* Bracket separator lines */}
          {nodes.map((node, i) => {
            const prevBracket = i > 0 ? nodes[i - 1].bracket : null;
            if (!prevBracket || prevBracket === node.bracket) return null;
            const gateX = node.x - NODE_SPACING / 2;
            const bInfo = BRACKETS[node.bracket] || {};
            const isLocked = node.is_locked;
            return (
              <div key={`gate-${i}`} style={{ position:'absolute', left:`${gateX}px`, top:0, bottom:0, width:'1px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:5 }}>
                {/* Vertical gate line */}
                <div style={{ position:'absolute', top:0, bottom:0, left:0, width:'1px', background:`linear-gradient(to bottom, transparent, ${isLocked ? '#2a2a2a' : bInfo.color}, transparent)` }} />
                {/* Gate badge */}
                <div style={{ position:'relative', background:'linear-gradient(135deg,#0a0000,#180000)', border:`1.5px solid ${isLocked ? '#2a2a2a' : bInfo.color}`, borderRadius:'10px', padding:'12px 16px', textAlign:'center', boxShadow: isLocked ? 'none' : `0 0 25px ${bInfo.color}44`, minWidth:'130px' }}>
                  <div style={{ fontSize:'1.6rem' }}>{isLocked ? '🔒' : bInfo.emoji}</div>
                  <div style={{ fontFamily:'"Cinzel",serif', color: isLocked ? '#333' : bInfo.color, fontSize:'.7rem', fontWeight:'bold', letterSpacing:'1px', marginTop:'4px' }}>{bInfo.name}</div>
                  <div style={{ fontSize:'.6rem', marginTop:'4px', color: isLocked ? '#ff6b6b' : '#2ecc71', fontWeight:'bold' }}>
                    {isLocked ? '🔒 80%+ required' : '✓ Gate Open'}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ===== NODES ===== */}
          {nodes.map((course, i) => {
            const meta = getMeta(course.title);
            const locked = course.is_locked;
            const cleared = course.is_cleared;
            const totalMods = course.modules?.length || 0;
            const clearedMods = course.modules?.filter(m => m.is_completed).length || 0;
            const avgScore = totalMods > 0 ? course.modules.reduce((a,m) => a+(m.score_percentage||0),0)/totalMods : 0;
            const stars = avgScore >= 90 ? 3 : avgScore >= 70 ? 2 : avgScore >= 50 ? 1 : 0;
            const isBelow = i % 2 !== 0; // node is in bottom band

            return (
              <div key={course.id} style={{ position:'absolute', left:`${course.x}px`, top:`${course.y}px`, transform:'translate(-50%,-50%)', zIndex:10 }}>
                {/* Stars above (or below for bottom-band nodes) */}
                <div style={{ position:'absolute', [isBelow ? 'bottom' : 'top']:'-30px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', whiteSpace:'nowrap' }}>
                  {!locked && [1,2,3].map(n => <span key={n} style={{ fontSize:'.9rem', color: n<=stars ? meta.accentColor : '#1e1e1e' }}>★</span>)}
                </div>

                {/* Circle node */}
                <div
                  className={locked ? '' : cleared ? 'nd-done' : 'nd'}
                  onClick={() => !locked && setPopup(course)}
                  style={{ width:'80px', height:'80px', borderRadius:'50%', background: locked ? '#0d0d0d' : cleared ? `radial-gradient(circle at 35% 35%,${meta.accentColor}88,${meta.accentColor}22)` : 'radial-gradient(circle at 35% 35%,#1f1200,#080300)', border:`3px solid ${locked ? '#1e1e1e' : cleared ? meta.accentColor : `${meta.accentColor}55`}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', opacity: locked ? .35 : 1, flexShrink:0 }}
                >
                  {meta.icon}
                </div>

                {/* Badge #number */}
                <div style={{ position:'absolute', top:'-8px', right:'-8px', background: locked ? '#1a1a1a' : meta.accentColor, color:'#000', borderRadius:'10px', padding:'1px 7px', fontSize:'.6rem', fontWeight:'bold', border:'2px solid #000', fontFamily:'"Cinzel",serif' }}>
                  {i + 1}
                </div>

                {/* Label below (or above for bottom-band) */}
                <div style={{ position:'absolute', [isBelow ? 'top' : 'bottom']:'-70px', left:'50%', transform:'translateX(-50%)', textAlign:'center', width:'160px', pointerEvents:'none' }}>
                  <div style={{ color: locked ? '#333' : cleared ? meta.accentColor : '#e0e0e0', fontSize:'.72rem', fontFamily:'"Cinzel",serif', fontWeight:'bold', lineHeight:1.3 }}>{course.title}</div>
                  <div style={{ fontSize:'.6rem', color: locked ? '#2a2a2a' : cleared ? '#2ecc71' : clearedMods>0 ? '#f4d03f' : '#555', marginTop:'3px' }}>
                    {locked ? '🔒 Locked' : cleared ? '✓ Cleared' : totalMods > 0 ? `${clearedMods}/${totalMods} done` : 'Final Trial'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== POPUP PANEL when clicking a node ===== */}
      {popup && (
        <div className="popup-overlay" onClick={() => setPopup(null)}>
          <div className="popup-box" onClick={e => e.stopPropagation()}>
            {(() => {
              const meta = getMeta(popup.title);
              const totalMods = popup.modules?.length || 0;
              const clearedMods = popup.modules?.filter(m=>m.is_completed).length || 0;
              const avgScore = totalMods > 0 ? popup.modules.reduce((a,m)=>a+(m.score_percentage||0),0)/totalMods : 0;
              const stars = avgScore>=90?3:avgScore>=70?2:avgScore>=50?1:0;
              return (
                <>
                  {/* Popup Header */}
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px', paddingBottom:'14px', borderBottom:'1px solid rgba(212,175,55,.2)' }}>
                    <div style={{ fontSize:'2.8rem' }}>{meta.icon}</div>
                    <div style={{ flex:1 }}>
                      <h2 style={{ margin:0, color: meta.accentColor, fontFamily:'"Cinzel",serif', fontSize:'1rem', lineHeight:1.3 }}>{popup.title}</h2>
                      <div style={{ display:'flex', gap:'2px', marginTop:'4px' }}>
                        {[1,2,3].map(n => <span key={n} style={{ fontSize:'.9rem', color:n<=stars?meta.accentColor:'#1e1e1e' }}>★</span>)}
                      </div>
                    </div>
                    <button onClick={()=>setPopup(null)} style={{ background:'none', border:'none', color:'#555', fontSize:'1.2rem', cursor:'pointer' }}>✕</button>
                  </div>

                  <p style={{ color:'#888', fontSize:'.78rem', lineHeight:1.5, marginBottom:'16px' }}>{popup.description}</p>

                  {/* Progress bar */}
                  {totalMods > 0 && (
                    <div style={{ marginBottom:'16px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.65rem', color:'#555', marginBottom:'4px' }}>
                        <span>{clearedMods}/{totalMods} missions cleared</span>
                        <span style={{ color:popup.is_cleared?'#2ecc71':clearedMods>0?'#f4d03f':'#555' }}>{popup.is_cleared?'✓ MASTERED':clearedMods>0?'IN PROGRESS':'NOT STARTED'}</span>
                      </div>
                      <div style={{ height:'3px', background:'#111', borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(clearedMods/totalMods)*100}%`, background:`linear-gradient(90deg,#8B0000,${meta.accentColor})`, transition:'width .5s' }} />
                      </div>
                    </div>
                  )}

                  {/* Modules */}
                  {popup.is_placement_test && totalMods === 0 ? (
                    <div style={{ textAlign:'center', padding:'20px', background:'rgba(139,0,0,.1)', border:'1px solid rgba(139,0,0,.3)', borderRadius:'10px' }}>
                      <div style={{ fontSize:'2rem', marginBottom:'8px' }}>🐲</div>
                      <div style={{ color:meta.accentColor, fontFamily:'"Cinzel",serif', fontSize:'.82rem', fontWeight:'bold', marginBottom:'8px' }}>FINAL MASTERY TRIAL</div>
                      <p style={{ color:'#888', fontSize:'.72rem', marginBottom:'14px', lineHeight:1.5 }}>Score <strong style={{color:'#f4d03f'}}>80%+</strong> to unlock the next realm.</p>
                      <button onClick={()=>{setPopup(null);router.push(`/courses/${popup.id}`);}} style={{ padding:'10px 24px', background:`linear-gradient(90deg,#8B0000,${meta.accentColor})`, border:'none', borderRadius:'8px', color:'#000', fontWeight:'bold', cursor:'pointer', fontFamily:'"Cinzel",serif', fontSize:'.8rem' }}>
                        TAKE FINAL TRIAL ⚔️
                      </button>
                    </div>
                  ) : (
                    <>
                      {popup.modules?.map((mod, mi) => (
                        <div key={mod.id} className="mod-row">
                          <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:mod.is_completed?meta.accentColor:'#111', border:`2px solid ${mod.is_completed?meta.accentColor:'#2a2a2a'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'.7rem', color:mod.is_completed?'#000':'#444', fontWeight:'bold' }}>
                            {mod.is_completed ? '✓' : mi+1}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:mod.is_completed?meta.accentColor:'#ccc', fontSize:'.76rem', fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mod.title}</div>
                            {mod.score_percentage != null && (
                              <div style={{ fontSize:'.6rem', color:mod.score_percentage>=80?'#2ecc71':'#f4d03f' }}>Quiz: {mod.score_percentage}%</div>
                            )}
                          </div>
                          <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                            <button className="btn-study" onClick={()=>{setPopup(null);router.push(`/courses/${popup.id}/module/${mod.id}`);}}>
                              📖 {mod.is_completed?'Review':'Study'}
                            </button>
                            {mod.first_quiz_id && !mod.is_completed && (
                              <button className="btn-skip" onClick={()=>{setPopup(null);router.push(`/courses/${popup.id}/quiz/${mod.first_quiz_id}`);}}>
                                ⚔ Skip
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div style={{ marginTop:'14px', display:'flex', justifyContent:'flex-end', gap:'8px' }}>
                        <button onClick={()=>{setPopup(null);router.push(`/courses/${popup.id}`);}} style={{ padding:'8px 20px', background:`linear-gradient(90deg,#1a0000,${meta.accentColor}99)`, border:`1px solid ${meta.accentColor}`, borderRadius:'8px', color:'#fff', fontWeight:'bold', cursor:'pointer', fontSize:'.78rem', fontFamily:'"Cinzel",serif' }}>
                          VIEW COURSE →
                        </button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
