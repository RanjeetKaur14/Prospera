'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CourseDetails() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/courses/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCourse(data);
        }
      } catch (err) {
        console.error('Failed to fetch course', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCourse();
  }, [id, router]);

  if (loading) return <div className="loading-container"><p>Loading Course Details...</p></div>;
  if (!course) return <div className="loading-container"><p>Course not found.</p></div>;

  const diagnosticQuiz = course.modules?.flatMap(m => m.quizzes).find(q => q.is_diagnostic) || 
                       course.quizzes?.find(q => q.is_diagnostic);

  return (
    <div className="course-details-container">
      <button className="btn-back" onClick={() => router.push('/courses')}>← Back to Explorer</button>
      
      <header className="course-header">
        <div className="header-content">
          <h1>{course.title}</h1>
          <p className="description">{course.description}</p>
        </div>
        {diagnosticQuiz && (
          <div className="diagnostic-card glass">
            <h4>Already an expert?</h4>
            <p>Pass the diagnostic quiz (80% score) to unlock the next course! ✨</p>
            <button className="btn-primary" onClick={() => router.push(`/courses/${id}/quiz/${diagnosticQuiz.id}`)}>
              Take Diagnostic
            </button>
          </div>
        )}
      </header>

      <section className="modules-section">
        <h2 style={{ fontFamily: '"Cinzel", serif', color: 'var(--drg-gold)', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '10px' }}>QUEST MODULES</h2>
        <div className="modules-list">
          {course.modules?.map((module, index) => (
            <div key={module.id} className="module-item" onClick={() => router.push(`/courses/${id}/module/${module.id}`)} style={{
              background: 'rgba(20, 10, 5, 0.8)',
              border: module.is_completed ? '1px solid var(--drg-gold)' : '1px solid rgba(255,255,255,0.05)',
              padding: '25px',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              gap: '20px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '25px',
                background: module.is_completed ? 'var(--drg-red)' : '#111',
                color: module.is_completed ? 'var(--drg-gold)' : '#555',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                border: '2px solid' + (module.is_completed ? 'var(--drg-gold)' : '#333')
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: module.is_completed ? 'var(--drg-gold)' : '#fff', marginBottom: '5px' }}>{module.title}</h3>
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
                  <span style={{ color: module.is_completed ? '#2ecc71' : '#888' }}>
                    {module.is_completed ? '✓ Scrolls Read' : '📖 Unread'}
                  </span>
                  <span style={{ color: module.score_percentage !== null ? '#2ecc71' : '#888' }}>
                    {module.score_percentage !== null ? `⚔ Quiz Passed (${module.score_percentage}%)` : '⚔ Quiz Pending'}
                  </span>
                </div>
              </div>
              <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.8rem', background: module.is_completed ? 'var(--drg-gold)' : 'var(--drg-red)', color: module.is_completed ? '#000' : '#fff' }}>
                {module.is_completed ? 'Review' : 'Embark'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .course-details-container {
          padding: 60px 20px;
          max-width: 1000px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .btn-back {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 1rem;
          margin-bottom: 40px;
          transition: color 0.3s;
        }

        .btn-back:hover {
          color: #00f2fe;
        }

        .course-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 40px;
          margin-bottom: 60px;
        }

        .header-content {
          flex: 1;
        }

        .course-header h1 {
          font-size: 3rem;
          margin-bottom: 20px;
          color: #fff;
        }

        .description {
          font-size: 1.25rem;
          color: #cbd5e0;
          line-height: 1.6;
        }

        .diagnostic-card {
          width: 300px;
          padding: 25px;
          border-radius: 20px;
          border: 1px solid rgba(0, 242, 254, 0.3);
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(79, 172, 254, 0.05) 100%);
        }

        .diagnostic-card h4 {
          margin-bottom: 10px;
          color: #00f2fe;
        }

        .diagnostic-card p {
          font-size: 0.9rem;
          color: #a0aec0;
          margin-bottom: 20px;
        }

        .modules-section h2 {
          font-size: 2rem;
          margin-bottom: 30px;
          color: #fff;
        }

        .modules-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .module-item {
          display: flex;
          align-items: center;
          padding: 25px;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .module-item:hover {
          transform: translateX(10px);
          border-color: rgba(0, 242, 254, 0.3);
          background: rgba(255, 255, 255, 0.03);
        }

        .module-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #4facfe;
          width: 50px;
          height: 50px;
          background: rgba(79, 172, 254, 0.1);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 25px;
        }

        .module-info {
          flex: 1;
        }

        .module-info h3 {
          font-size: 1.3rem;
          margin-bottom: 5px;
          color: #fff;
        }

        .module-info p {
          color: #718096;
          font-size: 0.95rem;
        }

        .btn-text {
          background: none;
          border: none;
          color: #00f2fe;
          font-weight: 600;
          cursor: pointer;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        @media (max-width: 768px) {
          .course-header {
            flex-direction: column;
          }
          .diagnostic-card {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
