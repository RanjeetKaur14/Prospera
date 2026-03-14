import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const fontStyle = {
  fontFamily: "'Cormorant Garamond', serif",
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [country, setCountry] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [financialGoal, setFinancialGoal] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('');
  const [estimatedMonthlySpending, setEstimatedMonthlySpending] = useState('');
  const [mainSpendingCategories, setMainSpendingCategories] = useState('');

  // Redirect if no user
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Helper to determine recommended course based on age
  const getRecommendedCourse = (age) => {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return 'beginner';
    if (ageNum >= 15 && ageNum <= 20) return 'beginner';
    if (ageNum >= 21 && ageNum <= 40) return 'intermediate';
    return 'advanced'; // 41+
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const recommendedCourse = getRecommendedCourse(age);
      await updateDoc(userRef, {
        age: parseInt(age) || null,
        occupation,
        country,
        monthly_income_range: monthlyIncome,
        current_savings_range: currentSavings,
        financial_goal: financialGoal,
        risk_tolerance: riskTolerance,
        estimated_monthly_spending: estimatedMonthlySpending,
        main_spending_categories: mainSpendingCategories,
        onboardingCompleted: true,
        recommendedCourse,                    // ← store recommended course
        passedPrerequisiteTests: [],          // ← initialize empty array
      });
      
      navigate('/dashboard?new=true');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/onboardingbackground.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="max-w-md w-full bg-white/40 backdrop-blur-md border border-rose-200/60 p-8 shadow-lg">
        <h1 className="text-4xl font-bold text-rose-800 mb-2 text-center" style={fontStyle}>
          Welcome to Prospera
        </h1>
        <p className="text-center text-rose-600 text-lg mb-6">
          {step === 1 && "Let's get to know you better."}
          {step === 2 && "Tell us about your finances."}
          {step === 3 && "How do you spend your money?"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="block text-rose-700 text-base mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900 placeholder-rose-400"
                  placeholder="e.g. 25"
                  required
                />
              </div>
              <div>
                <label className="block text-rose-700 text-base mb-1">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900 placeholder-rose-400"
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-rose-700 text-base mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900 placeholder-rose-400"
                  placeholder="e.g. United States"
                  required
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-rose-700 text-base mb-1">Monthly Income Range</label>
                <select
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900"
                  required
                >
                  <option value="" disabled>Select a range</option>
                  <option value="Under $2,000">Under $2,000</option>
                  <option value="$2,000 - $5,000">$2,000 - $5,000</option>
                  <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                  <option value="Over $10,000">Over $10,000</option>
                </select>
              </div>
              <div>
                <label className="block text-rose-700 text-base mb-1">Current Savings Range</label>
                <select
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900"
                  required
                >
                  <option value="" disabled>Select a range</option>
                  <option value="Under $1,000">Under $1,000</option>
                  <option value="$1,000 - $10,000">$1,000 - $10,000</option>
                  <option value="$10,000 - $50,000">$10,000 - $50,000</option>
                  <option value="Over $50,000">Over $50,000</option>
                </select>
              </div>
              <div>
                <label className="block text-rose-700 text-base mb-1">Risk Tolerance</label>
                <select
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900"
                  required
                >
                  <option value="" disabled>Select</option>
                  <option value="Low">Low (Safe investments)</option>
                  <option value="Medium">Medium (Balanced)</option>
                  <option value="High">High (Aggressive growth)</option>
                </select>
              </div>
              <div>
                <label className="block text-rose-700 text-base mb-1">Primary Financial Goal</label>
                <input
                  type="text"
                  value={financialGoal}
                  onChange={(e) => setFinancialGoal(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900 placeholder-rose-400"
                  placeholder="e.g. Buying a house, retiring early"
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-rose-700 text-base mb-1">Estimated Monthly Spending</label>
                <select
                  value={estimatedMonthlySpending}
                  onChange={(e) => setEstimatedMonthlySpending(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900"
                  required
                >
                  <option value="" disabled>Select a range</option>
                  <option value="Under $1,000">Under $1,000</option>
                  <option value="$1,000 - $3,000">$1,000 - $3,000</option>
                  <option value="$3,000 - $6,000">$3,000 - $6,000</option>
                  <option value="Over $6,000">Over $6,000</option>
                </select>
              </div>
              <div>
                <label className="block text-rose-700 text-base mb-1">Main Spending Categories</label>
                <input
                  type="text"
                  value={mainSpendingCategories}
                  onChange={(e) => setMainSpendingCategories(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900 placeholder-rose-400"
                  placeholder="e.g. Rent, Groceries, Entertainment"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-white/40 border border-rose-300 text-rose-700 hover:bg-white/60 transition"
                style={fontStyle}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className={`${step > 1 ? 'flex-[2]' : 'w-full'} py-3 bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50`}
              style={fontStyle}
              disabled={loading}
            >
              {loading ? 'Saving...' : step < 3 ? 'Continue' : 'Complete Setup'}
            </button>
          </div>
        </form>

        {/* Step indicators */}
        <div className="flex justify-center mt-6 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all ${
                s === step ? 'bg-rose-600 w-4' : 'bg-rose-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}