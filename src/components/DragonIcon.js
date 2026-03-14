export default function DragonIcon({ className = "w-24 h-24" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <path d="M50 10 L70 30 L60 40 L80 60 L70 80 L50 70 L30 80 L20 60 L40 40 L30 30 L50 10Z" />
      <circle cx="40" cy="40" r="5" fill="black" />
      <circle cx="60" cy="40" r="5" fill="black" />
      <path d="M45 55 Q50 65, 55 55" stroke="black" strokeWidth="3" fill="none" />
    </svg>
  );
}