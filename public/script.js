let categoryChart = null;
let trendChart = null;
let monthlyBudget = 0;

// DOM Elements
const form = document.getElementById('expense-form');
const totalAmountEl = document.getElementById('total-amount');
const todayAmountEl = document.getElementById('today-amount');
const monthlyAmountEl = document.getElementById('monthly-amount');
const expensesListEl = document.getElementById('expenses-list');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const dateInput = document.getElementById('date');
const toastContainer = document.getElementById('toast-container');

// Budget Elements
const budgetProgressText = document.getElementById('budget-progress-text');
const budgetRemainingText = document.getElementById('budget-remaining-text');
const budgetFill = document.getElementById('budget-fill');
const monthlyBudgetValue = document.getElementById('monthly-budget-value');
const openBudgetModalBtn = document.getElementById('open-budget-modal');
const budgetModal = document.getElementById('budget-modal');
const budgetForm = document.getElementById('budget-form');
const closeBudgetModalBtn = document.getElementById('close-budget-modal');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalBtn = document.getElementById('close-modal');

// Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');

// Insight Element
const insightContentEl = document.getElementById('insight-content');

// Export button
const exportBtn = document.getElementById('export-btn');

// Quick Templates
window.applyTemplate = (category, amount, description) => {
    document.getElementById('amount').value = amount;
    document.getElementById('category').value = category;
    document.getElementById('description').value = description;
    
    // Smooth scroll to form if mobile
    if (window.innerWidth < 1000) {
        document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    initTheme();
    fetchBudget();
    updateDashboard();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon('light');
    }
}

themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    const theme = isLight ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
});

function updateThemeIcon(theme) {
    themeToggleBtn.innerHTML = theme === 'light' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    lucide.createIcons();
}

// Toast System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'info') icon = 'info';
    
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.5s ease backwards reverse';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

async function fetchBudget() {
    try {
        const res = await fetch('/api/budget');
        const data = await res.json();
        monthlyBudget = data.budget;
        monthlyBudgetValue.textContent = `₹${monthlyBudget.toLocaleString()}`;
    } catch (error) {
        console.error('Error fetching budget:', error);
    }
}

// Event Listeners for Filtering
searchInput.addEventListener('input', debounce(() => updateDashboard(), 300));
categoryFilter.addEventListener('change', () => updateDashboard());

// Helper: Debounce for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update data from the API
async function updateDashboard() {
    try {
        const search = searchInput.value;
        const category = categoryFilter.value;
        
        let url = `/api/expenses?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`;
        
        const expensesRes = await fetch(url);
        const expenses = await expensesRes.json();
        
        const statsRes = await fetch('/api/expenses/stats');
        const stats = await statsRes.json();
        
        renderStats(stats);
        updateBudgetProgress(stats.monthlyTotal);
        renderChart(stats.breakdown);
        renderTrendChart(stats.trends);
        renderExpenses(expenses);
        updateInsights(stats, monthlyBudget);
    } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to sync with server', 'error');
    }
}

// Generate Smart Insights
function updateInsights(stats, budget) {
    if (!insightContentEl) return;
    
    const insights = [];
    
    // Budget Insight
    if (budget > 0) {
        const percent = (stats.monthlyTotal / budget) * 100;
        if (percent > 90) {
            insights.push({
                icon: 'zap',
                text: `Critical: You've used ${Math.round(percent)}% of your budget. Slow down!`
            });
        } else if (percent > 70) {
            insights.push({
                icon: 'alert-triangle',
                text: `Notice: You're at ${Math.round(percent)}% of your monthly limit.`
            });
        } else if (percent < 30 && stats.monthlyTotal > 0) {
            insights.push({
                icon: 'trending-down',
                text: "Great job! You're well within your budget this month."
            });
        }
    }

    // Category Insight
    if (stats.breakdown && stats.breakdown.length > 0) {
        const topCategory = stats.breakdown.sort((a, b) => b.total - a.total)[0];
        insights.push({
            icon: 'bar-chart-2',
            text: `Most of your money (₹${topCategory.total.toLocaleString()}) goes to ${topCategory.category}.`
        });
    }

    // General Tip
    if (stats.totalSpending > 0) {
        insights.push({
            icon: 'lightbulb',
            text: "Setting recurring bills can help you track fixed costs better."
        });
    }

    if (insights.length === 0) {
        insightContentEl.innerHTML = '<p class="insight-loading">Add more transactions to get insights.</p>';
        return;
    }

    insightContentEl.innerHTML = insights.map(item => `
        <div class="insight-item">
            <i data-lucide="${item.icon}" class="insight-icon"></i>
            <div class="insight-text">${item.text}</div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Render summary
function renderStats(stats) {
    const format = (val) => `₹${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    animateValue(totalAmountEl, stats.totalSpending, format);
    animateValue(todayAmountEl, stats.todayTotal, format);
    animateValue(monthlyAmountEl, stats.monthlyTotal, format);
}

function animateValue(obj, end, formatter) {
    const start = parseFloat(obj.textContent.replace(/[^\d.-]/g, '')) || 0;
    const duration = 1000;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (end - start) + start;
        obj.textContent = formatter(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateBudgetProgress(monthlyTotal) {
    if (monthlyBudget <= 0) {
        if (document.getElementById('health-badge')) document.getElementById('health-badge').style.display = 'none';
        return;
    }
    if (document.getElementById('health-badge')) document.getElementById('health-badge').style.display = 'flex';

    const percent = Math.min((monthlyTotal / monthlyBudget) * 100, 100);
    const remaining = Math.max(monthlyBudget - monthlyTotal, 0);

    budgetFill.style.width = `${percent}%`;
    budgetProgressText.textContent = `${Math.round((monthlyTotal / monthlyBudget) * 100)}% used`;
    budgetRemainingText.textContent = `₹${remaining.toLocaleString()} left`;

    // Health Badge Logic (if exists)
    const healthBadge = document.getElementById('health-badge');
    if (healthBadge) {
        const healthScore = document.getElementById('health-score');
        healthBadge.classList.remove('warning', 'danger');
        
        if (percent >= 100) {
            healthBadge.classList.add('danger');
            healthScore.textContent = 'Critical';
            healthBadge.querySelector('i').setAttribute('data-lucide', 'alert-circle');
        } else if (percent >= 80) {
            healthBadge.classList.add('warning');
            healthScore.textContent = 'Careful';
            healthBadge.querySelector('i').setAttribute('data-lucide', 'zap');
        } else {
            healthScore.textContent = 'Perfect';
            healthBadge.querySelector('i').setAttribute('data-lucide', 'shield-check');
        }
    }
    lucide.createIcons();

    // Color feedback
    budgetFill.classList.remove('warning', 'danger');
    if (percent >= 100) {
        budgetFill.classList.add('danger');
    } else if (percent >= 80) {
        budgetFill.classList.add('warning');
    }
}

// Render Chart.js
function renderChart(breakdown) {
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const labels = breakdown.map(item => item.category);
    const data = breakdown.map(item => item.total);
    const colors = [
        '#c084fc', '#fb7185', '#2dd4bf', '#f59e0b', '#60a5fa', '#ef4444', '#818cf8'
    ];

    if (categoryChart) {
        categoryChart.destroy();
    }

    if (data.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 15,
                borderRadius: 4
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 25,
                        font: { family: 'Outfit', size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { family: 'Outfit', size: 14, weight: '600' },
                    bodyFont: { family: 'Outfit', size: 13 },
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return ` ₹${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Render Trend Chart
function renderTrendChart(trends) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const labels = trends.map(item => item.month);
    const data = trends.map(item => item.total);

    if (trendChart) {
        trendChart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(192, 132, 252, 0.4)');
    gradient.addColorStop(1, 'rgba(192, 132, 252, 0)');

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending',
                data: data,
                fill: true,
                backgroundColor: gradient,
                borderColor: '#c084fc',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#c084fc',
                pointBorderColor: 'rgba(255, 255, 255, 0.2)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    cornerRadius: 12,
                    callbacks: {
                        label: function(context) {
                            return ` ₹${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.05)', drawBorder: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' }, padding: 10 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' }, padding: 10 }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Render the expense list
function renderExpenses(expenses) {
    expensesListEl.innerHTML = '';
    
    if (expenses.length === 0) {
        expensesListEl.innerHTML = `
            <div class="empty-state">
                <i data-lucide="layers"></i>
                <p>No transactions match your search</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    expenses.forEach((expense, index) => {
        const div = document.createElement('div');
        div.className = 'expense-card';
        div.style.animationDelay = `${index * 0.05}s`;
        
        const date = new Date(expense.date || expense.timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const emojiMap = {
            'Food': '🍔', 'Travel': '🚗', 'Health': '💊', 'Shopping': '🛍️', 
            'Bills': '🧾', 'Entertainment': '🎬', 'Other': '✨'
        };

        div.innerHTML = `
            <div class="cat-icon">${emojiMap[expense.category] || '💰'}</div>
            <div class="expense-main">
                <span class="expense-category">${expense.category}</span>
                <span class="expense-desc">${expense.description || 'No description'}</span>
                <span class="expense-date">${date}</span>
            </div>
            <div class="expense-amount">₹${parseFloat(expense.amount).toFixed(2)}</div>
            <div class="expense-actions">
                <button class="action-btn edit" title="Edit Entry" onclick="openEditModal(${JSON.stringify(expense).replace(/"/g, '&quot;')})">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="action-btn delete" title="Delete Entry" onclick="deleteExpense(${expense.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        expensesListEl.appendChild(div);
    });
    
    lucide.createIcons();
}

// Form submissions
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('add-btn');
    const originalContent = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Saving...</span>';
    lucide.createIcons();
    
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    
    try {
        const res = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, category, date, description })
        });
        
        if (res.ok) {
            form.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            await updateDashboard();
            showToast('Transaction saved successfully!');
            
            // Celebration!
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#c084fc', '#fb7185', '#2dd4bf']
                });
            }
        } else {
            throw new Error('Failed to save');
        }
    } catch (err) {
        showToast('Error saving transaction', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
        lucide.createIcons();
    }
});

// Budget form
budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('budget-amount').value;
    
    try {
        const res = await fetch('/api/budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        
        if (res.ok) {
            budgetModal.style.display = 'none';
            await fetchBudget();
            await updateDashboard();
            showToast('Budget goals updated!');
        } else {
            throw new Error('Update failed');
        }
    } catch (err) {
        showToast('Error updating budget', 'error');
    }
});

// Delete expense
async function deleteExpense(id) {
    if (!confirm('Are you certain you want to remove this record?')) return;
    
    try {
        const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await updateDashboard();
            showToast('Transaction removed', 'info');
        } else {
            throw new Error('Delete failed');
        }
    } catch (err) {
        showToast('Error deleting record', 'error');
    }
}

// Modal Handlers
window.openEditModal = (expense) => {
    document.getElementById('edit-id').value = expense.id;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-category').value = expense.category;
    
    // Ensure the date is in YYYY-MM-DD format for the input
    const dateObj = new Date(expense.date);
    const dateStr = dateObj.toISOString().split('T')[0];
    document.getElementById('edit-date').value = dateStr;
    
    document.getElementById('edit-description').value = expense.description || '';
    editModal.style.display = 'flex';
    lucide.createIcons();
};

closeModalBtn.onclick = () => editModal.style.display = 'none';
openBudgetModalBtn.onclick = () => {
    document.getElementById('budget-amount').value = monthlyBudget;
    budgetModal.style.display = 'flex';
    lucide.createIcons();
};
closeBudgetModalBtn.onclick = () => budgetModal.style.display = 'none';

window.onclick = (e) => {
    if (e.target === editModal) editModal.style.display = 'none';
    if (e.target === budgetModal) budgetModal.style.display = 'none';
};

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const body = {
        amount: document.getElementById('edit-amount').value,
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value,
        description: document.getElementById('edit-description').value
    };
    
    try {
        const res = await fetch(`/api/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            editModal.style.display = 'none';
            await updateDashboard();
            showToast('Transaction updated');
        } else {
            throw new Error('Update failed');
        }
    } catch (err) {
        showToast('Error updating transaction', 'error');
    }
});

// CSV Export
exportBtn.addEventListener('click', async () => {
    try {
        const search = searchInput.value;
        const category = categoryFilter.value;
        const url = `/api/expenses?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        const headers = ['ID', 'Date', 'Category', 'Amount', 'Description'];
        const rows = data.map(e => [e.id, e.date, e.category, e.amount, `"${e.description || ''}"`]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', downloadUrl);
        a.setAttribute('download', `xpense_report_${new Date().toISOString().split('T')[0]}.csv`);
        a.click();
        showToast('Report generated successfully!');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Export failed', 'error');
    }
});
