'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  
  // Hide navbar on login, signup, and onboarding pages
  const hideNavbar = ['/login', '/signup', '/onboarding', '/'].includes(pathname);
  if (hideNavbar) return null;

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Courses', path: '/courses' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Portfolio', path: '/expenses' },
  ];

  return (
    <nav style={{ 
      padding: '20px 40px', 
      background: 'rgba(10, 10, 18, 0.8)', 
      backdropFilter: 'blur(20px)', 
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '1px' }}>PROSPERA</div>
      <div style={{ display: 'flex', gap: '30px' }}>
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            href={link.path}
            style={{ 
              textDecoration: 'none', 
              color: pathname === link.path ? 'var(--primary)' : '#a5a5a5',
              fontSize: '0.9rem',
              fontWeight: pathname === link.path ? '600' : '400',
              transition: 'color 0.3s ease'
            }}
          >
            {link.name}
          </Link>
        ))}
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
