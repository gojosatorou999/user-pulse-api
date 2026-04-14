const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. Add expense
app.post('/api/expenses', (req, res) => {
  const { amount, category, description, date } = req.body;
  
  if (!amount || !category) {
    return res.status(400).json({ error: 'Amount and category are required' });
  }

  const stmt = db.prepare('INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)');
  const info = stmt.run(amount, category, description || null, date || new Date().toISOString().split('T')[0]);
  
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(expense);
});

// 2. View all expenses (with search/filter)
app.get('/api/expenses', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (description LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY date DESC, timestamp DESC';
  const expenses = db.prepare(query).all(...params);
  res.json(expenses);
});

// 3. Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  res.json({ message: 'Deleted successfully' });
});

// 4. Update expense
app.put('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const { amount, category, description, date } = req.body;
  
  const info = db.prepare(`
    UPDATE expenses 
    SET amount = ?, category = ?, description = ?, date = ? 
    WHERE id = ?
  `).run(amount, category, description, date, id);
  
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  res.json(expense);
});

// 5. Budget Settings
app.get('/api/budget', (req, res) => {
  const budget = db.prepare('SELECT value FROM settings WHERE key = ?').get('monthly_budget');
  res.json({ budget: parseFloat(budget.value) });
});

app.post('/api/budget', (req, res) => {
  const { amount } = req.body;
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(amount.toString(), 'monthly_budget');
  res.json({ message: 'Budget updated successfully' });
});

// 4. Stats: Total Spending & Category Breakdown
app.get('/api/expenses/stats', (req, res) => {
  // Total spending
  const total = db.prepare('SELECT SUM(amount) as total FROM expenses').get();
  
  // This month's spending
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthlyTotal = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?").get(`${currentMonth}%`);

  // Today's spending
  const today = new Date().toISOString().split('T')[0];
  const todayTotal = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE date = ?").get(today);
  
  // Category-wise breakdown
  const breakdown = db.prepare('SELECT category, SUM(amount) as total FROM expenses GROUP BY category').all();
  
  // Monthly trends (Last 6 months)
  const trends = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
    const monthName = d.toLocaleString('default', { month: 'short' });
    
    const res = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?").get(`${monthStr}%`);
    trends.push({
      month: monthName,
      total: res.total || 0
    });
  }
  
  res.json({
    totalSpending: total.total || 0,
    monthlyTotal: monthlyTotal.total || 0,
    todayTotal: todayTotal.total || 0,
    breakdown: breakdown,
    trends: trends
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
