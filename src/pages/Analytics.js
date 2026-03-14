import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const API_BASE = 'http://localhost:8000';

const COLORS = ['#fbbf24', '#4ade80', '#f87171', '#60a5fa', '#c084fc', '#f472b6'];

export default function Analytics() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ category: 'Food', amount: '', description: '' });
  const [predictionInputs, setPredictionInputs] = useState({
    food: '', entertainment: '', health: '', rent: '', shopping: '', travel: '', utilities: '', salary: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [futureProjection, setFutureProjection] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const getToken = async () => {
    return await currentUser.getIdToken();
  };

  const fetchAllData = async () => {
    try {
      const token = await getToken();
      // Fetch expenses
      const expensesRes = await fetch(`${API_BASE}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data);
      }

      // Fetch monthly aggregates
      const monthlyRes = await fetch(`${API_BASE}/expenses/monthly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (monthlyRes.ok) {
        const data = await monthlyRes.json();
        setMonthlyData(data);
      }

      // Fetch category breakdown
      const categoryRes = await fetch(`${API_BASE}/expenses/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (categoryRes.ok) {
        const data = await categoryRes.json();
        setCategoryData(data);
      }

      // Fetch future projection (e.g., next 12 months)
      const projectionRes = await fetch(`${API_BASE}/expenses/projection?months=12`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (projectionRes.ok) {
        const data = await projectionRes.json();
        setFutureProjection(data);
      }

      // Fetch financial health score
      const healthRes = await fetch(`${API_BASE}/expenses/health-score`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealthScore(data.score);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newExpense)
      });
      if (res.ok) {
        setNewExpense({ category: 'Food', amount: '', description: '' });
        fetchAllData(); // refresh all data
      }
    } catch (err) {
      console.error(err);
    }
  };

  const predictNextMonth = async () => {
    try {
      const token = await getToken();
      const payload = {
        food: Number(predictionInputs.food) || 0,
        entertainment: Number(predictionInputs.entertainment) || 0,
        health: Number(predictionInputs.health) || 0,
        rent: Number(predictionInputs.rent) || 0,
        shopping: Number(predictionInputs.shopping) || 0,
        travel: Number(predictionInputs.travel) || 0,
        utilities: Number(predictionInputs.utilities) || 0,
        salary: Number(predictionInputs.salary) || 0
      };
      const res = await fetch(`${API_BASE}/expenses/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setPrediction(data.predicted_next_month_spending);
    } catch (err) {
      console.error(err);
    }
  };

  const getAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/expenses/ai-suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: chatQuery }) // optional query
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url('/analyticsbackground.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="text-rose-600 text-2xl animate-pulse" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Loading your portfolio...</div>
    </div>
  );

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: `url('/analyticsbackground..png')`, backgroundSize: 'cover', backgroundPosition: 'center', fontFamily: "'Cormorant Garamond', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="mb-6 px-5 py-1 border border-rose-600/30 text-rose-700 hover:text-rose-900 hover:border-rose-600 transition rounded-sm text-base tracking-wide">
          ← Back to Lair
        </button>
        <h1 className="text-5xl font-bold text-rose-800 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Financial Analytics</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Expenses & Predictor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expense Log */}
            <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-rose-800 mb-4">Spending Log</h2>
              <form onSubmit={handleAddExpense} className="flex flex-wrap gap-3 mb-6">
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="p-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900"
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Rent</option>
                  <option>Shopping</option>
                  <option>Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                  className="flex-1 p-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900 placeholder-rose-400"
                />
                <button type="submit" className="px-6 py-3 bg-rose-600 text-white hover:bg-rose-700 transition">
                  Log It
                </button>
              </form>
              <div className="max-h-64 overflow-y-auto">
                {expenses.map((e) => (
                  <div key={e.id} className="flex justify-between p-3 border-b border-rose-100">
                    <div>
                      <div className="font-semibold text-rose-800">{e.category}</div>
                      <div className="text-sm text-rose-500">{new Date(e.date).toLocaleDateString()}</div>
                    </div>
                    <div className="font-bold text-rose-700">- ₹{e.amount}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Spending Chart */}
            <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-rose-800 mb-4">Monthly Spending</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d0c0" />
                  <XAxis dataKey="month" stroke="#7f5a3a" />
                  <YAxis stroke="#7f5a3a" />
                  <Tooltip contentStyle={{ backgroundColor: '#fef5e7', borderColor: '#b28b5e' }} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#fbbf24" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-rose-800 mb-4">Category Breakdown</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fef5e7', borderColor: '#b28b5e' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Future Projection */}
            <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-rose-800 mb-4">Spending Projection (Next 12 Months)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={futureProjection} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d0c0" />
                  <XAxis dataKey="month" stroke="#7f5a3a" />
                  <YAxis stroke="#7f5a3a" />
                  <Tooltip contentStyle={{ backgroundColor: '#fef5e7', borderColor: '#b28b5e' }} />
                  <Legend />
                  <Bar dataKey="predicted" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column: Health Score & AI */}
          <div className="space-y-6">
            {/* Financial Health Score */}
            <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg text-center">
              <h2 className="text-2xl font-semibold text-rose-800 mb-2">Financial Health Score</h2>
              {healthScore !== null && (
                <>
                  <div className="text-6xl font-bold text-rose-700 mb-2">{healthScore}</div>
                  <div className="w-full bg-rose-100 h-4 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-4" style={{ width: `${healthScore}%` }}></div>
                  </div>
                  <p className="text-rose-600 mt-2">
                    {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Improvement'}
                  </p>
                </>
              )}
            </div>

            {/* Prediction Inputs (existing) */}
            <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-rose-800 mb-2">AI Expense Predictor</h2>
              <p className="text-rose-600 mb-4">Enter planned expenses to predict next month.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input placeholder="Food" type="number" value={predictionInputs.food} onChange={(e) => setPredictionInputs({...predictionInputs, food: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
                <input placeholder="Entertainment" type="number" value={predictionInputs.entertainment} onChange={(e) => setPredictionInputs({...predictionInputs, entertainment: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
                <input placeholder="Health" type="number" value={predictionInputs.health} onChange={(e) => setPredictionInputs({...predictionInputs, health: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
                <input placeholder="Rent" type="number" value={predictionInputs.rent} onChange={(e) => setPredictionInputs({...predictionInputs, rent: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
                <input placeholder="Shopping" type="number" value={predictionInputs.shopping} onChange={(e) => setPredictionInputs({...predictionInputs, shopping: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
                <input placeholder="Travel" type="number" value={predictionInputs.travel} onChange={(e) => setPredictionInputs({...predictionInputs, travel: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
                <input placeholder="Utilities" type="number" value={predictionInputs.utilities} onChange={(e) => setPredictionInputs({...predictionInputs, utilities: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
                <input placeholder="Salary" type="number" value={predictionInputs.salary} onChange={(e) => setPredictionInputs({...predictionInputs, salary: e.target.value})} className="p-2 bg-white/60 border border-rose-200 rounded-sm" />
              </div>
              <button onClick={predictNextMonth} className="w-full px-6 py-2 bg-rose-600 text-white hover:bg-rose-700 transition">
                Run Prediction
              </button>
              {prediction && (
                <div className="mt-4 text-xl font-bold text-rose-700 text-center">
                  Next Month: ₹{prediction.toFixed(2)}
                </div>
              )}
            </div>

            {/* AI Suggestions */}
            <div className="bg-white/40 backdrop-blur-md border border-rose-200/60 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-rose-800 mb-2">AI Financial Advice</h2>
              <textarea
                placeholder="Ask for personalized advice (e.g., How can I save more?)"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                className="w-full h-20 p-3 bg-white/60 border border-rose-200 rounded-sm text-rose-900 placeholder-rose-400 mb-3"
              />
              <button onClick={getAISuggestions} disabled={loadingAI} className="w-full px-6 py-2 bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50">
                {loadingAI ? 'Thinking...' : 'Get Advice'}
              </button>
              {aiSuggestions && (
                <div className="mt-4 p-4 bg-white/40 border border-rose-200 text-rose-800 text-sm whitespace-pre-wrap">
                  {aiSuggestions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}