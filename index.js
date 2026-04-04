const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Routes

/**
 * @route POST /api/activities
 * @desc Log a new activity
 */
app.post('/api/activities', (req, res) => {
    const { user_id, type, description } = req.body;

    if (!user_id || !type) {
        return res.status(400).json({ error: 'user_id and type are required' });
    }

    const query = `INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)`;
    const params = [user_id, type, description || ''];

    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Activity logged successfully'
        });
    });
});

/**
 * @route GET /api/activities
 * @desc GET all activities with filters
 */
app.get('/api/activities', (req, res) => {
    const { user_id, type, start_date, end_date } = req.query;
    
    let query = `SELECT * FROM activities WHERE 1=1`;
    const params = [];

    if (user_id) {
        query += ` AND user_id = ?`;
        params.push(user_id);
    }
    if (type) {
        query += ` AND type = ?`;
        params.push(type);
    }
    if (start_date) {
        query += ` AND timestamp >= ?`;
        params.push(start_date);
    }
    if (end_date) {
        query += ` AND timestamp <= ?`;
        params.push(end_date);
    }

    query += ` ORDER BY timestamp DESC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            count: rows.length,
            activities: rows
        });
    });
});

/**
 * @route GET /api/activities/:id
 * @desc Get a single activity by ID
 */
app.get('/api/activities/:id', (req, res) => {
    const query = `SELECT * FROM activities WHERE id = ?`;
    
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(row);
    });
});

// Root endpoint with info
app.get('/', (req, res) => {
    res.json({
        name: 'User Activity Tracker API',
        version: '1.0.0',
        endpoints: [
            { method: 'POST', path: '/api/activities', body: '{ user_id, type, description }' },
            { method: 'GET', path: '/api/activities', query: '?user_id=...&type=...&start_date=...&end_date=...' }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
