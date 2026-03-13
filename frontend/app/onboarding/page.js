'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // 1. Update User Profile
      await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          age: parseInt(age), 
          occupation, 
          country 
        }),
      });

      // 2. Create Financial Profile
      await fetch('http://localhost:8000/users/me/financial-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monthly_income_range: monthlyIncome,
          current_savings_range: currentSavings,
          financial_goal: financialGoal,
          risk_tolerance: riskTolerance,
          estimated_monthly_spending: estimatedMonthlySpending,
          main_spending_categories: mainSpendingCategories
        }),
      });
      
      router.push('/dashboard?new=true');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '500px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Welcome to Prospera</h1>
        <p style={{ textAlign: 'center', color: '#a5a5a5', marginBottom: '30px' }}>
          {step === 1 && "Let's get to know you better."}
          {step === 2 && "Tell us about your finances."}
          {step === 3 && "How do you spend your money?"}
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {step === 1 && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Age</label>
                <input type="number" className="input-field" placeholder="e.g. 25" value={age} onChange={(e) => setAge(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Occupation</label>
                <input type="text" className="input-field" placeholder="e.g. Software Engineer" value={occupation} onChange={(e) => setOccupation(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Country</label>
                <input type="text" className="input-field" placeholder="e.g. United States" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Monthly Income Range</label>
                <select className="input-field" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="" disabled>Select a range</option>
                  <option value="Under $2,000">Under $2,000</option>
                  <option value="$2,000 - $5,000">$2,000 - $5,000</option>
                  <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                  <option value="Over $10,000">Over $10,000</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Current Savings Range</label>
                <select className="input-field" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="" disabled>Select a range</option>
                  <option value="Under $1,000">Under $1,000</option>
                  <option value="$1,000 - $10,000">$1,000 - $10,000</option>
                  <option value="$10,000 - $50,000">$10,000 - $50,000</option>
                  <option value="Over $50,000">Over $50,000</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Risk Tolerance</label>
                <select className="input-field" value={riskTolerance} onChange={(e) => setRiskTolerance(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="" disabled>Select</option>
                  <option value="Low">Low (Safe investments)</option>
                  <option value="Medium">Medium (Balanced)</option>
                  <option value="High">High (Aggressive growth)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Primary Financial Goal</label>
                <input type="text" className="input-field" placeholder="e.g. Buying a house, retiring early" value={financialGoal} onChange={(e) => setFinancialGoal(e.target.value)} required />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Estimated Monthly Spending</label>
                <select className="input-field" value={estimatedMonthlySpending} onChange={(e) => setEstimatedMonthlySpending(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="" disabled>Select a range</option>
                  <option value="Under $1,000">Under $1,000</option>
                  <option value="$1,000 - $3,000">$1,000 - $3,000</option>
                  <option value="$3,000 - $6,000">$3,000 - $6,000</option>
                  <option value="Over $6,000">Over $6,000</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Main Spending Categories</label>
                <input type="text" className="input-field" placeholder="e.g. Rent, Groceries, Entertainment" value={mainSpendingCategories} onChange={(e) => setMainSpendingCategories(e.target.value)} required />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
                Back
              </button>
            )}
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Saving...' : step < 3 ? 'Continue' : 'Complete Setup'}
            </button>
          </div>
        </form>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              background: s === step ? 'var(--primary)' : 'rgba(255,255,255,0.2)' 
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
