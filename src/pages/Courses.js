import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { FireIcon, AcademicCapIcon, StarIcon } from '@heroicons/react/24/solid';

// Course metadata – ordered left to right
const COURSE_META = {
  beginner: { title: 'Beginner’s Path', icon: <AcademicCapIcon className="w-8 h-8" />, accentColor: '#4E96D9' },
  intermediate: { title: 'Intermediate Trials', icon: <FireIcon className="w-8 h-8" />, accentColor: '#D4AF37' },
  advanced: { title: 'Advanced Mastery', icon: <StarIcon className="w-8 h-8" />, accentColor: '#C0392B' },
};

// Bracket definitions – in correct progression order
const BRACKETS = [
  { name: 'CHILD REALM', emoji: '🐣', color: '#4E96D9' },
  { name: 'YOUNG WARRIOR', emoji: '⚔️', color: '#D4AF37' },
  { name: 'MASTER DOMAIN', emoji: '🏯', color: '#C0392B' },
];

function getMeta(courseId) {
  return COURSE_META[courseId] || { title: courseId, icon: '📜', accentColor: '#aaa' };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const petalsRef = useRef([]);

  if (!petalsRef.current.length) {
    petalsRef.current = [...Array(8)].map((_, i) => ({
      left: `${(i * 47 + 3) % 100}%`,
      dur: `${11 + (i * 2.3) % 9}s`,
      del: `${(i * 1.9) % 10}s`,
      sz: `${9 + (i * 5) % 12}px`,
    }));
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        let userSnap = await getDoc(userRef);
        let user = null;
        if (userSnap.exists()) {
          user = userSnap.data();
        } else {
          const defaultData = {
            name: currentUser.displayName || 'Dragon Rider',
            email: currentUser.email,
            level: 1,
            xp: 0,
            coins: 0,
            completedModules: [],
            completedDailyQuests: [],
            lastDailyReset: new Date().toISOString().split('T')[0],
            streak: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
          };
          await setDoc(userRef, defaultData);
          user = defaultData;
        }
        setUserData(user);

        // Fetch all courses and manually order them
        const coursesCol = collection(db, 'courses');
        const coursesSnap = await getDocs(coursesCol);
        const coursesMap = {};
        coursesSnap.docs.forEach(doc => { coursesMap[doc.id] = { id: doc.id, ...doc.data() }; });

        const courseOrder = ['beginner', 'intermediate', 'advanced'];
        const coursesList = [];

        for (const courseId of courseOrder) {
          const courseData = coursesMap[courseId];
          if (!courseData) continue;

          const modulesCol = collection(db, 'courses', courseId, 'modules');
          const modulesQuery = query(modulesCol, orderBy('order'));
          const modulesSnap = await getDocs(modulesQuery);
          const modules = modulesSnap.docs.map(modDoc => ({
            id: modDoc.id,
            ...modDoc.data(),
            is_completed: user.completedModules?.includes(`${courseId}_${modDoc.id}`) || false,
          }));

          courseData.modules = modules;
          coursesList.push(courseData);
        }

        setCourses(coursesList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url('/coursebackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="text-rose-600 text-2xl animate-pulse" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Summoning the paths...</div>
      </div>
    );
  }

  const isBracketUnlocked = (index) => {
    if (index === 0) return true; // beginner always open
    const beginnerCompleted = courses[0]?.modules.every(mod => mod.is_completed) || false;
    const passedBeginnerTest = userData?.passedPrerequisiteTests?.includes('beginner');
    if (index === 1) { // intermediate
      return beginnerCompleted || passedBeginnerTest;
    }
    if (index === 2) { // advanced
      const intermediateCompleted = courses[1]?.modules.every(mod => mod.is_completed) || false;
      const passedIntermediateTest = userData?.passedPrerequisiteTests?.includes('intermediate');
      return intermediateCompleted || passedIntermediateTest;
    }
    return false;
  };

  // Node positions – spread wider
  const NODE_SPACING = 450;
  const CANVAS_H = 600;
  const BAND_TOP = 160;
  const BAND_BOT = 430;
  const nodes = courses.map((course, i) => ({
    ...course,
    x: 100 + i * NODE_SPACING,
    y: i % 2 === 0 ? BAND_TOP : BAND_BOT,
  }));

  // ========== EXTENDED PATH with extra final node ==========
  const lastNode = nodes[nodes.length - 1];
  const finalNodeX = lastNode.x + 600; // extra node after advanced
  const finalNodeY = lastNode.y;
  const finalNode = { x: finalNodeX, y: finalNodeY, title: 'Mastery', isFinal: true };

  const extendX = finalNode.x + 800; // extend further for fade
  const extendY = finalNode.y;
  const extendedPoint = { x: extendX, y: extendY };

  // Build main path through all course nodes
  const mainPathD = nodes.length < 2 ? '' : nodes.reduce((acc, n, i) => {
    if (i === 0) return `M ${n.x} ${n.y}`;
    const prev = nodes[i - 1];
    const cpx = (prev.x + n.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${n.y}, ${n.x} ${n.y}`;
  }, '');

  // Path from last course node to final node
  const toFinalPathD = (() => {
    const prev = lastNode;
    const n = finalNode;
    const cpx = (prev.x + n.x) / 2;
    return `M ${prev.x} ${prev.y} C ${cpx} ${prev.y}, ${cpx} ${n.y}, ${n.x} ${n.y}`;
  })();

  // Path from final node to extended point
  const extendedPathD = (() => {
    const prev = finalNode;
    const n = extendedPoint;
    const cpx = (prev.x + n.x) / 2;
    return `M ${prev.x} ${prev.y} C ${cpx} ${prev.y}, ${cpx} ${n.y}, ${n.x} ${n.y}`;
  })();

  // Total width
  const maxX = Math.max(...nodes.map(n => n.x), finalNode.x, extendedPoint.x);
  const totalW = maxX + 300;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url('/coursebackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Cormorant Garamond', serif",
        color: '#2c1810',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes petal { 0%{transform:translateY(-20px) rotate(0deg);opacity:.8} 100%{transform:translateY(110vh) rotate(680deg);opacity:0} }
        .nd { animation:float 3.2s ease-in-out infinite; transition:transform .15s; cursor:pointer; }
        .nd:hover { transform:scale(1.18)!important; animation:none; }
        .nd-done { animation:glow 2.5s ease-in-out infinite; cursor:pointer; }
        .nd-done:hover { transform:scale(1.12); animation:none; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes glow  { 0%,100%{box-shadow:0 0 10px rgba(212,175,55,.3)} 50%{box-shadow:0 0 28px rgba(212,175,55,.7),0 0 50px rgba(139,0,0,.25)} }
        .popup-overlay { position:fixed; inset:0; background:rgba(0,0,0,.3); z-index:2000; display:flex; align-items:center; justify-content:center; }
        .popup-box { background:white/40 backdrop-blur-md border border-rose-200/60 p-8; max-height:85vh; overflow-y:auto; }
        .mod-row { display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:7px; background:white/40 border border-rose-100; }
        .btn-study { padding:5px 12px; background:rgba(212,175,55,.1); border:1px solid rgba(212,175,55,.3); border-radius:6px; color:#D4AF37; font-size:.65rem; cursor:pointer; font-weight:bold; transition:background .15s; }
        .btn-study:hover { background:rgba(212,175,55,.25); }
        ::-webkit-scrollbar{ width:4px; height:4px; }
        ::-webkit-scrollbar-track{ background:transparent; }
        ::-webkit-scrollbar-thumb{ background:#b28b5e; border-radius:2px; }
      `}</style>

      {/* Falling petals (subtle) */}
      {petalsRef.current.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: '-20px',
            left: p.left,
            width: p.sz,
            height: p.sz,
            background: 'radial-gradient(circle at 40% 30%, #fde1d3, #f8c8b0)',
            borderRadius: '60% 0 60% 0',
            zIndex: 998,
            pointerEvents: 'none',
            animation: `petal ${p.dur} ${p.del} linear infinite`,
          }}
        />
      ))}

      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: '52px', paddingBottom: '30px', position: 'relative' }}>
        <div style={{ fontSize: '8rem', opacity: .04, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', color: '#b28b5e', lineHeight: 1, userSelect: 'none' }}>龍</div>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 700, margin: 0, color: '#9d6b4c', letterSpacing: '2px' }}>Prospera Path</h1>
        <p style={{ color: '#b28b5e', letterSpacing: '4px', fontSize: '.9rem', marginTop: '5px', fontFamily: '"Cormorant Garamond", serif' }}>PATH TO PROSPERITY</p>
        <p style={{ color: '#b28b5e', fontSize: '.9rem', marginTop: '6px' }}>← scroll horizontally to follow the path →</p>
      </div>

      {/* Path canvas */}
      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: '180px', WebkitOverflowScrolling: 'touch', cursor: 'grab' }}>
        <div style={{ width: `${totalW}px`, height: `${CANVAS_H}px`, position: 'relative', flexShrink: 0 }}>
          {/* SVG paths */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbe2496" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#4ade805f" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#fb249a8b" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbe247e" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#4ade80" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={mainPathD} fill="none" stroke="url(#pathGradient)" strokeWidth="80" strokeLinecap="round" filter="url(#glow)" />
            <path d={mainPathD} fill="none" stroke="url(#pathGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="16,12" />
            <path d={toFinalPathD} fill="none" stroke="url(#pathGradient)" strokeWidth="80" strokeLinecap="round" filter="url(#glow)" />
            <path d={toFinalPathD} fill="none" stroke="url(#pathGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="16,12" />
            <path d={extendedPathD} fill="none" stroke="url(#fadeGradient)" strokeWidth="80" strokeLinecap="round" filter="url(#glow)" />
            <path d={extendedPathD} fill="none" stroke="url(#fadeGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="16,12" />
            <circle cx={extendedPoint.x} cy={extendedPoint.y} r="16" fill="none" stroke="url(#pathGradient)" strokeWidth="4" filter="url(#glow)" />
            <circle cx={extendedPoint.x} cy={extendedPoint.y} r="8" fill="url(#pathGradient)" filter="url(#glow)" />
          </svg>

          {/* Bracket gates */}
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const gateX = node.x - NODE_SPACING / 2;
            const unlocked = isBracketUnlocked(i);
            const bInfo = BRACKETS[i];
            if (!bInfo) return null;
            return (
              <div key={`gate-${i}`} style={{ position: 'absolute', left: `${gateX}px`, top: 0, bottom: 0, width: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '1px', background: `linear-gradient(to bottom, transparent, ${unlocked ? bInfo.color : '#b28b5e'}, transparent)` }} />
                <div style={{ position: 'relative', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', border: `1.5px solid ${unlocked ? bInfo.color : '#b28b5e'}`, borderRadius: '10px', padding: '12px 16px', textAlign: 'center', boxShadow: unlocked ? `0 0 20px ${bInfo.color}` : 'none', minWidth: '130px' }}>
                  <div style={{ fontSize: '1.6rem' }}>{unlocked ? bInfo.emoji : '🔒'}</div>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', color: unlocked ? bInfo.color : '#3c3127', fontSize: '.9rem', fontWeight: 'bold', letterSpacing: '1px', marginTop: '4px' }}>{bInfo.name}</div>
                  <div style={{ fontSize: '.8rem', marginTop: '4px', color: unlocked ? '#2ecc71' : '#b28b5e', fontWeight: 'bold' }}>
                    {unlocked ? '✓ Gate Open' : '🔒 Complete previous realm'}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Course Nodes */}
          {nodes.map((course, i) => {
            const meta = getMeta(course.id);
            const unlocked = isBracketUnlocked(i);
            const allCompleted = course.modules.every(mod => mod.is_completed);
            const cleared = allCompleted;
            const totalMods = course.modules.length;
            const clearedMods = course.modules.filter(m => m.is_completed).length;
            const isBelow = i % 2 !== 0;

            return (
              <div key={course.id} style={{ position: 'absolute', left: `${course.x}px`, top: `${course.y}px`, transform: 'translate(-50%,-50%)', zIndex: 10 }}>
                <div style={{ position: 'absolute', [isBelow ? 'bottom' : 'top']: '-30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px', whiteSpace: 'nowrap' }}>
                  {unlocked && [1, 2, 3].map(n => (
                    <span key={n} style={{ fontSize: '1.2rem', color: n <= (cleared ? 3 : 1) ? meta.accentColor : '#d4b59e' }}>★</span>
                  ))}
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, 40px)', display: 'flex', gap: '8px', justifyContent: 'center', width: '120px', flexWrap: 'wrap' }}>
                  {course.modules.map((mod, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: mod.is_completed ? '#4ade80' : '#d4b59e',
                        boxShadow: mod.is_completed ? '0 0 10px #4ade80' : 'none',
                      }}
                      title={mod.title}
                    />
                  ))}
                </div>
                <div
                  className={unlocked ? (cleared ? 'nd-done' : 'nd') : ''}
                  onClick={() => setPopup(course)}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: !unlocked ? '#e0d6cc' : cleared
                      ? `radial-gradient(circle at 35% 35%, ${meta.accentColor}88, ${meta.accentColor}22)`
                      : 'radial-gradient(circle at 35% 35%, #fef5e7, #fae5d3)',
                    border: `3px solid ${!unlocked ? '#b28b5e' : cleared ? meta.accentColor : `${meta.accentColor}66`}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    opacity: !unlocked ? 0.5 : 1,
                    boxShadow: unlocked ? `0 0 20px ${meta.accentColor}80` : 'none',
                    cursor: unlocked ? 'pointer' : 'default',
                  }}
                >
                  {typeof meta.icon === 'string' ? meta.icon : meta.icon}
                </div>
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: !unlocked ? '#b28b5e' : meta.accentColor, color: '#fff', borderRadius: '10px', padding: '2px 8px', fontSize: '.8rem', fontWeight: 'bold', border: '2px solid #fff', fontFamily: '"Cormorant Garamond", serif' }}>
                  {i + 1}
                </div>
                <div style={{ position: 'absolute', [isBelow ? 'top' : 'bottom']: '-70px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '180px', pointerEvents: 'none' }}>
                  <div style={{ color: !unlocked ? '#b28b5e' : cleared ? meta.accentColor : '#7f5a3a', fontSize: '1rem', fontFamily: '"Cormorant Garamond", serif', fontWeight: 'bold', lineHeight: 1.3 }}>
                    {meta.title}
                  </div>
                  <div style={{ fontSize: '.9rem', color: !unlocked ? '#b28b5e' : cleared ? '#2ecc71' : clearedMods > 0 ? '#fbbf24' : '#b28b5e', marginTop: '3px' }}>
                    {!unlocked ? '🔒 Locked' : cleared ? '✓ Cleared' : `${clearedMods}/${totalMods} done`}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Final node (Mastery) */}
          <div style={{ position: 'absolute', left: `${finalNode.x}px`, top: `${finalNode.y}px`, transform: 'translate(-50%,-50%)', zIndex: 10 }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #fbbf24, #4ade80)', border: '3px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 0 30px #fbbf24' }}>
              🏆
            </div>
            <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#fbbf24', color: '#fff', borderRadius: '10px', padding: '2px 8px', fontSize: '.8rem', fontWeight: 'bold', border: '2px solid #fff' }}>4</div>
            <div style={{ position: 'absolute', bottom: '-70px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '180px', pointerEvents: 'none' }}>
              <div style={{ color: '#fbbf24', fontSize: '1rem', fontFamily: '"Cormorant Garamond", serif', fontWeight: 'bold' }}>Mastery</div>
              <div style={{ fontSize: '.9rem', color: '#4ade80' }}>Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup with test button for locked courses */}
      {popup && (
        <div className="popup-overlay" onClick={() => setPopup(null)}>
          <div className="bg-white/80 backdrop-blur-md border border-rose-200 p-8 rounded-lg max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => {
              const meta = getMeta(popup.id);
              const totalMods = popup.modules?.length || 0;
              const clearedMods = popup.modules?.filter(m => m.is_completed).length || 0;
              // Find index of this course in the courses array
              const courseIndex = courses.findIndex(c => c.id === popup.id);
              const unlocked = isBracketUnlocked(courseIndex);
              // Determine prerequisite course
              let prerequisiteCourseId = null;
              let canTakeTest = false;
              if (popup.id === 'intermediate') {
                prerequisiteCourseId = 'beginner';
                canTakeTest = !unlocked && !userData?.passedPrerequisiteTests?.includes('beginner');
              } else if (popup.id === 'advanced') {
                prerequisiteCourseId = 'intermediate';
                canTakeTest = !unlocked && !userData?.passedPrerequisiteTests?.includes('intermediate');
              }

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(180,130,90,0.2)' }}>
                    <div style={{ fontSize: '2.8rem', color: meta.accentColor }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: 0, color: meta.accentColor, fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', lineHeight: 1.3 }}>{meta.title}</h2>
                      <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                        {[1, 2, 3].map(n => (
                          <span key={n} style={{ fontSize: '1rem', color: n <= (clearedMods === totalMods ? 3 : 1) ? meta.accentColor : '#b28b5e' }}>★</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setPopup(null)} style={{ background: 'none', border: 'none', color: '#b28b5e', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                  </div>

                  <p style={{ color: '#7f5a3a', fontSize: '.95rem', lineHeight: 1.5, marginBottom: '16px' }}>{popup.description || 'Embark on this path to financial wisdom.'}</p>

                  {totalMods > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: '#b28b5e', marginBottom: '4px' }}>
                        <span>{clearedMods}/{totalMods} missions cleared</span>
                        <span style={{ color: clearedMods === totalMods ? '#2ecc71' : clearedMods > 0 ? '#fbbf24' : '#b28b5e' }}>
                          {clearedMods === totalMods ? '✓ MASTERED' : clearedMods > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: '#f0e0d0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(clearedMods / totalMods) * 100}%`, background: `linear-gradient(90deg, #fbbf24, ${meta.accentColor})`, transition: 'width .5s' }} />
                      </div>
                    </div>
                  )}

                  {popup.modules?.map((mod, mi) => (
                    <div key={mod.id} className="mod-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '7px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(180,130,90,0.2)', borderRadius: '4px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: mod.is_completed ? meta.accentColor : '#f0e0d0', border: `2px solid ${mod.is_completed ? meta.accentColor : '#b28b5e'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.7rem', color: mod.is_completed ? '#fff' : '#7f5a3a', fontWeight: 'bold' }}>
                        {mod.is_completed ? '✓' : mi + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: mod.is_completed ? meta.accentColor : '#7f5a3a', fontSize: '.9rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          className="btn-study"
                          onClick={() => {
                            setPopup(null);
                            navigate(`/course/${popup.id}/module/${mod.id}`);
                          }}
                          style={{ padding: '4px 10px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px', color: '#b28b5e', fontSize: '.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          📖 {mod.is_completed ? 'Review' : 'Study'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Test button for locked courses */}
                  {!unlocked && canTakeTest && prerequisiteCourseId && (
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                      <p style={{ color: '#b28b5e', marginBottom: '8px' }}>
                        This path is locked. You need to pass the {prerequisiteCourseId} test first.
                      </p>
                      <button
                        onClick={() => {
                          setPopup(null);
                          navigate(`/test/${prerequisiteCourseId}?next=${popup.id}`);
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#fbbf24',
                          color: '#2c1810',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        Take {prerequisiteCourseId} Test
                      </button>
                    </div>
                  )}

                  {/* If locked but no test available (shouldn't happen) */}
                  {!unlocked && !canTakeTest && prerequisiteCourseId && (
                    <p style={{ color: '#b28b5e', textAlign: 'center', marginTop: '16px' }}>
                      Complete the previous path to unlock this one.
                    </p>
                  )}

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setPopup(null);
                        navigate(`/course/${popup.id}`);
                      }}
                      style={{ padding: '8px 20px', background: `linear-gradient(90deg, #fbbf24, ${meta.accentColor})`, border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '.85rem' }}
                    >
                      VIEW COURSE →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}