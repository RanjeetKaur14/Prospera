import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import DragonIcon from '../components/DragonIcon';

export default function Onboarding() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ageRange: '',
    financialGoals: [],
    incomeRange: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const goalsList = ['Saving', 'Investing', 'Budgeting', 'Debt Control'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const updatedGoals = checked
        ? [...formData.financialGoals, value]
        : formData.financialGoals.filter(goal => goal !== value);
      setFormData({ ...formData, financialGoals: updatedGoals });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const getRecommendedCourse = (ageRange) => {
    if (ageRange === '15-20') return 'beginner';
    if (ageRange === '21-40') return 'intermediate';
    if (ageRange === '41+') return 'advanced';
    return 'beginner'; // default
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const recommendedCourse = getRecommendedCourse(formData.ageRange);
      await updateDoc(userRef, {
        ...formData,
        recommendedCourse,
        passedPrerequisites: [], // initialize empty array
        onboardingCompleted: true,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-black/50 backdrop-blur-lg p-8 rounded-2xl border border-red-500/30 shadow-2xl shadow-red-900/50">
        <div className="text-center mb-8">
          <DragonIcon className="w-24 h-24 mx-auto text-red-500" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mt-4">
            Awaken Your Dragon
          </h1>
          <p className="text-gray-400">Tell us about yourself to begin your quest</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select your age range
                </label>
                <select
                  name="ageRange"
                  value={formData.ageRange}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-red-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                >
                  <option value="">-- Choose --</option>
                  <option value="15-20">15-20 years</option>
                  <option value="21-40">21-40 years</option>
                  <option value="41+">41+ years</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Financial Goals (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {goalsList.map(goal => (
                    <label key={goal} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="financialGoals"
                        value={goal}
                        checked={formData.financialGoals.includes(goal)}
                        onChange={handleChange}
                        className="accent-red-500"
                      />
                      <span className="text-gray-300">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monthly Income (approx)
                </label>
                <select
                  name="incomeRange"
                  value={formData.incomeRange}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 border border-red-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                >
                  <option value="">-- Select --</option>
                  <option value="<25k">Less than ₹25,000</option>
                  <option value="25k-50k">₹25,000 - ₹50,000</option>
                  <option value="50k-100k">₹50,000 - ₹1,00,000</option>
                  <option value=">100k">More than ₹1,00,000</option>
                </select>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-bold hover:from-red-700 hover:to-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Complete Onboarding'}
                </button>
              </div>
            </>
          )}
        </form>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}