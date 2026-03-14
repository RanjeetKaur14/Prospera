'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ category: 'Food', amount: '', description: '' });
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setExpenses(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newExpense)
      });
      if (res.ok) {
        setNewExpense({ category: 'Food', amount: '', description: '' });
        fetchExpenses();
      }
    } catch (err) { console.error(err); }
  };

  const predictNextMonth = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/expenses/predict', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setPrediction(data.predicted_next_month);
    }
  };

  const handleAIChat = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/chat/personal?user_query=${encodeURIComponent(chatQuery)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setChatResponse(data.choices?.[0]?.message?.content || 'AI is thinking...');
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/analysis', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (err) { console.error(err); }
    finally { setAnalyzing(false); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your portfolio...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Personal Portfolio</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Left Column: Logs & Prediction */}
        <div>
          <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px' }}>Spending Log</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <select 
                value={newExpense.category} 
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Rent</option>
                <option>Shopping</option>
                <option>Other</option>
              </select>
              <input 
                type="number" 
                placeholder="Amount ($)" 
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                required
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button type="submit" className="btn-primary">Log It</button>
            </form>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {expenses.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{e.category}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a5a5a5' }}>{new Date(e.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 'bold' }}>- ${e.amount}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>AI Expense Predictor</h2>
            <p style={{ color: '#a5a5a5', marginBottom: '20px' }}>Using our trained RandomForest model to estimate your next month's total.</p>
            <button onClick={predictNextMonth} className="btn-secondary">Run Prediction</button>
            {prediction && (
              <div style={{ marginTop: '20px', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                Estimated Next Month: ${prediction.toFixed(2)}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '30px', marginTop: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>Financial Insight Lab</h2>
            <p style={{ color: '#a5a5a5', marginBottom: '20px' }}>Unlock deep visualization of your spending patterns and category distributions.</p>
            <button 
              onClick={runAnalysis} 
              className="btn-primary" 
              disabled={analyzing}
              style={{ background: 'linear-gradient(135deg, #00f3ff 0%, #7000ff 100%)', border: 'none' }}
            >
              {analyzing ? 'Analyzing...' : 'View Deep Analysis'}
            </button>

            {analysis && (
              <div style={{ marginTop: '30px' }}>
                <div style={{ marginBottom: '20px', padding: '15px', borderRadius: '12px', background: 'rgba(112, 0, 255, 0.1)', border: '1px solid rgba(112, 0, 255, 0.2)' }}>
                  <span style={{ color: '#a5a5a5' }}>Highest Spending Category:</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{analysis.highest_spending_category}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#00f3ff' }}>Monthly Spending Trend</h3>
                    <img src={analysis.monthly_spending_graph} alt="Monthly Spending" style={{ width: '100%', borderRadius: '12px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#7000ff' }}>Category Distribution</h3>
                    <img src={analysis.category_spending_graph} alt="Category Spending" style={{ width: '100%', borderRadius: '12px' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Assistant */}
        <div>
          <div className="glass-card" style={{ padding: '30px', position: 'sticky', top: '40px' }}>
            <h2 style={{ marginBottom: '20px' }}>Prospera AI Advisor</h2>
            <p style={{ fontSize: '0.9rem', color: '#a5a5a5', marginBottom: '20px' }}>Ask about your spending habits.</p>
            <textarea 
              placeholder="How can I save more?" 
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '15px' }}
            />
            <button onClick={handleAIChat} className="btn-primary" style={{ width: '100%' }}>Ask AI</button>
            
            {chatResponse && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {chatResponse}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
