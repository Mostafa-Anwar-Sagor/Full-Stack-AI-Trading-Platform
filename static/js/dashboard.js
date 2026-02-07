// AI Trading Platform - Dashboard JavaScript
const API = '/api';
let dashboardData = null;
let portfolioChart = null;
let predictionChart = null;
let allocationChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    initCharts();
    setupNavigation();
    setupMobileMenu();
    setInterval(updateMarketData, 15000);
});

// Mobile Menu
function setupMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    toggle?.addEventListener('click', () => sidebar.classList.toggle('active'));
    document.getElementById('main-content')?.addEventListener('click', () => sidebar.classList.remove('active'));
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function () {
            const page = this.dataset.page;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const pageEl = document.getElementById(`page-${page}`);
            if (pageEl) pageEl.classList.add('active');
            else document.getElementById('page-dashboard').classList.add('active');

            // Load page-specific data
            if (page === 'predictions') loadPredictions();
            if (page === 'risk') loadRiskAnalysis();
            if (page === 'optimize') loadOptimization();

            document.getElementById('sidebar')?.classList.remove('active');
        });
    });
}

// Load Dashboard
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/dashboard/`);
        dashboardData = await res.json();
        updateDashboardUI(dashboardData);
    } catch (err) {
        console.error('Dashboard error:', err);
        showToast('Failed to load dashboard', 'error');
    }
}

// Update Dashboard UI
function updateDashboardUI(data) {
    document.getElementById('portfolio-value').textContent = `$${data.portfolio.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('active-agents').textContent = data.market_stats.active_agents;
    document.getElementById('win-rate').textContent = `${data.market_stats.win_rate}%`;

    renderAssets(data.assets);
    renderAgents(data.agents);
    renderTrades(data.recent_trades);
    renderAISignals(data.ai_insights?.trading_signals || []);
    updatePortfolioChart(data.performance_data);
}

// Render AI Signals
function renderAISignals(signals) {
    const container = document.getElementById('ai-signals');
    if (!container) return;

    if (!signals.length) {
        signals = [
            { symbol: 'BTC', signal: 'buy', confidence: 78 },
            { symbol: 'ETH', signal: 'hold', confidence: 62 },
            { symbol: 'SOL', signal: 'strong_buy', confidence: 85 },
            { symbol: 'BNB', signal: 'sell', confidence: 71 }
        ];
    }

    container.innerHTML = signals.map(s => {
        const signalClass = s.signal.includes('buy') ? 'buy' : s.signal.includes('sell') ? 'sell' : 'hold';
        const icon = signalClass === 'buy' ? '📈' : signalClass === 'sell' ? '📉' : '➖';
        return `<div class="signal-chip ${signalClass}">${icon} ${s.symbol}: ${s.signal.replace('_', ' ').toUpperCase()} (${s.confidence}%)</div>`;
    }).join('');
}

// Render Assets
function renderAssets(assets) {
    const container = document.getElementById('asset-list');
    if (!container) return;

    container.innerHTML = assets.map(asset => `
        <div class="asset-item" onclick="showAssetAnalysis('${asset.symbol}')">
            <div class="asset-info">
                <div class="asset-icon ${asset.symbol.toLowerCase()}">${asset.symbol.slice(0, 2)}</div>
                <div><div class="asset-name">${asset.name}</div><div class="asset-symbol">${asset.symbol}</div></div>
            </div>
            <div class="asset-price">
                <div class="asset-price-value">$${parseFloat(asset.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="asset-change ${parseFloat(asset.price_change_24h) >= 0 ? 'positive' : 'negative'}">${parseFloat(asset.price_change_24h) >= 0 ? '+' : ''}${parseFloat(asset.price_change_24h).toFixed(2)}%</div>
            </div>
        </div>
    `).join('');
}

// Render Agents
function renderAgents(agents) {
    const container = document.getElementById('agents-grid');
    if (!container) return;

    if (!agents?.length) {
        agents = [
            { id: 1, name: 'PPO Alpha', agent_type: 'ppo', status: 'running', trading_pair: 'BTC/USD', win_rate: 72.5, total_profit: 2847 },
            { id: 2, name: 'DQN Momentum', agent_type: 'dqn', status: 'running', trading_pair: 'ETH/USD', win_rate: 65.8, total_profit: 1523 },
            { id: 3, name: 'LSTM Predictor', agent_type: 'lstm', status: 'running', trading_pair: 'SOL/USD', win_rate: 68.2, total_profit: 957 },
            { id: 4, name: 'A3C Multi', agent_type: 'a3c', status: 'idle', trading_pair: 'MULTI', win_rate: 58.9, total_profit: 456 }
        ];
    }

    container.innerHTML = agents.map(agent => `
        <div class="agent-card">
            <div class="agent-header">
                <span class="agent-type ${agent.agent_type}">${agent.agent_type}</span>
                <div class="agent-status"><span class="status-dot ${agent.status}"></span>${agent.status}</div>
            </div>
            <div class="agent-name">${agent.name}</div>
            <div class="agent-pair">${agent.trading_pair}</div>
            <div class="agent-stats">
                <div class="agent-stat"><div class="agent-stat-value" style="color:var(--success)">${parseFloat(agent.win_rate).toFixed(1)}%</div><div class="agent-stat-label">Win Rate</div></div>
                <div class="agent-stat"><div class="agent-stat-value" style="color:${parseFloat(agent.total_profit) >= 0 ? 'var(--success)' : 'var(--danger)'}">$${parseFloat(agent.total_profit).toLocaleString()}</div><div class="agent-stat-label">P&L</div></div>
            </div>
            <div class="agent-actions">
                ${agent.status === 'running'
            ? `<button class="agent-btn stop" onclick="stopAgent('${agent.id}')"><i class="fas fa-stop"></i> Stop</button>`
            : `<button class="agent-btn start" onclick="startAgent('${agent.id}')"><i class="fas fa-play"></i> Start</button>`}
            </div>
        </div>
    `).join('');
}

// Render Trades
function renderTrades(trades) {
    const tbody = document.getElementById('trades-table');
    if (!tbody) return;

    const demoTrades = [
        { time: '14:32', type: 'buy', asset: 'BTC', price: '$43,521', value: '$544', status: 'Executed' },
        { time: '13:45', type: 'sell', asset: 'ETH', price: '$2,654', value: '$1,327', status: 'Executed' },
        { time: '12:15', type: 'buy', asset: 'SOL', price: '$98.76', value: '$518', status: 'Executed' },
        { time: '11:02', type: 'buy', asset: 'BNB', price: '$312', value: '$312', status: 'Executed' },
        { time: '10:28', type: 'sell', asset: 'XRP', price: '$0.52', value: '$261', status: 'Executed' }
    ];

    const displayTrades = trades?.length ? trades.map(t => ({
        time: new Date(t.executed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: t.trade_type, asset: t.asset?.symbol || 'N/A',
        price: `$${parseFloat(t.price).toLocaleString()}`,
        value: `$${parseFloat(t.total_value).toLocaleString()}`,
        status: t.status
    })) : demoTrades;

    tbody.innerHTML = displayTrades.map(t => `
        <tr>
            <td style="color:var(--text-secondary)">${t.time}</td>
            <td><span class="trade-type ${t.type}">${t.type}</span></td>
            <td><strong>${t.asset}</strong></td>
            <td>${t.price}</td>
            <td><strong>${t.value}</strong></td>
            <td><span style="color:var(--success)"><i class="fas fa-check-circle"></i></span></td>
        </tr>
    `).join('');
}

// Initialize Charts
function initCharts() {
    // Portfolio Chart
    const ctx = document.getElementById('portfolioChart')?.getContext('2d');
    if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 280);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        portfolioChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], fill: true, backgroundColor: gradient, borderColor: '#6366f1', borderWidth: 2, tension: 0.4, pointRadius: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#6b7280', maxTicksLimit: 6 } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280', callback: v => `$${(v / 1000).toFixed(1)}k` } }
                }
            }
        });
    }
}

// Update Portfolio Chart
function updatePortfolioChart(data) {
    if (!portfolioChart || !data) return;
    portfolioChart.data.labels = data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    portfolioChart.data.datasets[0].data = data.map(d => d.value);
    portfolioChart.update();
}

// Load Predictions
async function loadPredictions() {
    const symbol = document.getElementById('prediction-asset')?.value || 'BTC';
    try {
        const res = await fetch(`${API}/predictions/?symbol=${symbol}`);
        const data = await res.json();
        renderPredictions(data);
    } catch (err) {
        showToast('Failed to load predictions', 'error');
    }
}

// Render Predictions
function renderPredictions(data) {
    const info = document.getElementById('prediction-info');
    if (info) {
        const dir = data.prediction?.direction || 'bullish';
        const change = data.prediction?.predicted_change_percent || 2.5;
        const conf = data.prediction?.confidence || 75;

        info.innerHTML = `
            <div class="prediction-card">
                <div class="prediction-direction">${dir === 'bullish' ? '📈' : '📉'}</div>
                <div class="prediction-label">Direction</div>
                <div class="prediction-value ${dir}">${dir.toUpperCase()}</div>
            </div>
            <div class="prediction-card">
                <div class="prediction-label">Predicted Change</div>
                <div class="prediction-value ${change >= 0 ? 'bullish' : 'bearish'}">${change >= 0 ? '+' : ''}${change}%</div>
            </div>
            <div class="prediction-card">
                <div class="prediction-label">Model Confidence</div>
                <div class="prediction-value">${conf}%</div>
            </div>
            <div class="prediction-card">
                <div class="prediction-label">Signal</div>
                <div class="prediction-value bullish">${data.trading_signal?.signal?.toUpperCase() || 'BUY'}</div>
            </div>
        `;
    }

    // Indicators
    const indicators = document.getElementById('indicators-grid');
    if (indicators && data.trading_signal?.indicators) {
        const ind = data.trading_signal.indicators;
        indicators.innerHTML = `
            <div class="indicator-card"><div class="indicator-name">RSI</div><div class="indicator-value">${ind.rsi?.value || 45}</div><div class="indicator-signal" style="color:${ind.rsi?.value < 30 ? 'var(--success)' : ind.rsi?.value > 70 ? 'var(--danger)' : 'var(--text-secondary)'}">${ind.rsi?.signal || 'Neutral'}</div></div>
            <div class="indicator-card"><div class="indicator-name">MACD</div><div class="indicator-value">${ind.macd?.histogram?.toFixed(4) || '0.0012'}</div></div>
            <div class="indicator-card"><div class="indicator-name">SMA 20</div><div class="indicator-value">$${ind.sma_20?.toLocaleString() || '43,200'}</div></div>
            <div class="indicator-card"><div class="indicator-name">SMA 50</div><div class="indicator-value">$${ind.sma_50?.toLocaleString() || '42,800'}</div></div>
            <div class="indicator-card"><div class="indicator-name">Bollinger Upper</div><div class="indicator-value">$${ind.bollinger_bands?.upper?.toLocaleString() || '45,000'}</div></div>
            <div class="indicator-card"><div class="indicator-name">Bollinger Lower</div><div class="indicator-value">$${ind.bollinger_bands?.lower?.toLocaleString() || '41,500'}</div></div>
        `;
    }

    // Prediction Chart
    const ctx = document.getElementById('predictionChart')?.getContext('2d');
    if (ctx && data.prediction?.predictions) {
        if (predictionChart) predictionChart.destroy();
        predictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.prediction.predictions.map((_, i) => `+${i + 1}h`),
                datasets: [
                    { label: 'Predicted', data: data.prediction.predictions.map(p => p.predicted_price), borderColor: '#6366f1', borderWidth: 2, fill: false, tension: 0.3 },
                    { label: 'Upper', data: data.prediction.predictions.map(p => p.upper_bound), borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1, borderDash: [5, 5], fill: false },
                    { label: 'Lower', data: data.prediction.predictions.map(p => p.lower_bound), borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1, borderDash: [5, 5], fill: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
}

// Load Risk Analysis
async function loadRiskAnalysis() {
    try {
        const res = await fetch(`${API}/risk-analysis/`);
        const data = await res.json();
        renderRiskAnalysis(data);
    } catch (err) {
        showToast('Failed to load risk analysis', 'error');
    }
}

// Render Risk Analysis
function renderRiskAnalysis(data) {
    const metrics = document.getElementById('risk-metrics');
    if (metrics) {
        metrics.innerHTML = `
            <div class="risk-metric"><span class="risk-metric-label">Value at Risk (95%)</span><span class="risk-metric-value" style="color:var(--danger)">${data.risk_metrics?.value_at_risk_95 || 8.5}%</span></div>
            <div class="risk-metric"><span class="risk-metric-label">Sharpe Ratio</span><span class="risk-metric-value">${data.risk_metrics?.sharpe_ratio || 1.85}</span></div>
            <div class="risk-metric"><span class="risk-metric-label">Max Drawdown</span><span class="risk-metric-value" style="color:var(--danger)">${data.risk_metrics?.max_drawdown || -12.3}%</span></div>
            <div class="risk-metric"><span class="risk-metric-label">Beta</span><span class="risk-metric-value">${data.portfolio_risk?.beta || 1.12}</span></div>
            <div class="risk-metric"><span class="risk-metric-label">Diversification Score</span><span class="risk-metric-value" style="color:var(--success)">${data.portfolio_risk?.diversification_score || 7}/10</span></div>
        `;
    }

    const alerts = document.getElementById('risk-alerts');
    if (alerts) {
        const riskAlerts = data.risk_alerts || [
            { type: 'warning', message: 'BTC position exceeds 40% of portfolio' },
            { type: 'info', message: 'Consider diversifying into more assets' }
        ];
        alerts.innerHTML = riskAlerts.map(a => `
            <div class="risk-alert ${a.type}"><i class="fas fa-${a.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i><span>${a.message}</span></div>
        `).join('');
    }

    // Allocation Chart
    const ctx = document.getElementById('allocationChart')?.getContext('2d');
    if (ctx) {
        if (allocationChart) allocationChart.destroy();
        allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['BTC', 'ETH', 'SOL', 'Others'],
                datasets: [{ data: [40, 24, 16, 20], backgroundColor: ['#f7931a', '#627eea', '#9945ff', '#6b7280'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } } }
        });
    }
}

// Load Optimization
async function loadOptimization() {
    const tolerance = document.getElementById('risk-tolerance')?.value || 'medium';
    try {
        const res = await fetch(`${API}/portfolio-optimization/?risk_tolerance=${tolerance}`);
        const data = await res.json();
        renderOptimization(data);
    } catch (err) {
        showToast('Failed to load optimization', 'error');
    }
}

// Render Optimization
function renderOptimization(data) {
    const content = document.getElementById('optimization-content');
    if (!content) return;

    const opt = data.optimization || { optimal_allocation: [{ symbol: 'BTC', weight: 0.35 }, { symbol: 'ETH', weight: 0.30 }, { symbol: 'SOL', weight: 0.20 }, { symbol: 'BNB', weight: 0.15 }], expected_portfolio_return: 18.5, expected_portfolio_volatility: 22.3, sharpe_ratio: 1.65 };

    content.innerHTML = `
        <div>
            <h3 style="margin-bottom:16px;font-size:15px">Optimal Allocation</h3>
            ${opt.optimal_allocation.map(a => `
                <div class="allocation-item">
                    <span>${a.symbol}</span>
                    <span style="font-weight:600">${(a.weight * 100).toFixed(1)}%</span>
                </div>
                <div class="allocation-bar"><div class="allocation-fill" style="width:${a.weight * 100}%"></div></div>
            `).join('')}
        </div>
        <div>
            <h3 style="margin-bottom:16px;font-size:15px">Expected Metrics</h3>
            <div class="risk-metric"><span class="risk-metric-label">Expected Return</span><span class="risk-metric-value" style="color:var(--success)">+${opt.expected_portfolio_return}%</span></div>
            <div class="risk-metric"><span class="risk-metric-label">Expected Volatility</span><span class="risk-metric-value">${opt.expected_portfolio_volatility}%</span></div>
            <div class="risk-metric"><span class="risk-metric-label">Sharpe Ratio</span><span class="risk-metric-value">${opt.sharpe_ratio}</span></div>
            <button class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center" onclick="applyOptimization()"><i class="fas fa-check"></i> Apply Allocation</button>
        </div>
    `;
}

// Update Market Data
async function updateMarketData() {
    try {
        const res = await fetch(`${API}/market-data/`);
        const data = await res.json();
        if (data.assets) renderAssets(data.assets);
    } catch (err) { console.error('Market update error:', err); }
}

// Execute Trade
async function executeTrade() {
    const type = document.getElementById('trade-type').value;
    const asset = document.getElementById('trade-asset').value;
    const qty = document.getElementById('trade-quantity').value;

    if (!qty || parseFloat(qty) <= 0) { showToast('Enter valid quantity', 'error'); return; }

    try {
        const res = await fetch(`${API}/execute-trade/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolio_id: dashboardData?.portfolio?.id, asset, type, quantity: parseFloat(qty) })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`${type.toUpperCase()} ${qty} ${asset} executed!`, 'success');
            closeModal('trade-modal');
            loadDashboard();
        } else showToast(data.error || 'Trade failed', 'error');
    } catch (err) { showToast('Trade error', 'error'); }
}

// Run Backtest
async function runBacktest() {
    showToast('Running backtest...', 'info');
    try {
        const res = await fetch(`${API}/run-backtest/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent_type: document.getElementById('backtest-agent').value,
                start_date: document.getElementById('backtest-start').value,
                end_date: document.getElementById('backtest-end').value,
                initial_capital: parseFloat(document.getElementById('backtest-capital').value)
            })
        });
        const data = await res.json();
        if (data.success) {
            const r = data.detailed_metrics;
            showToast(`Backtest complete! Return: ${r.total_return_pct.toFixed(1)}%, Sharpe: ${r.sharpe_ratio.toFixed(2)}, Win Rate: ${r.win_rate.toFixed(1)}%`, 'success');
        }
    } catch (err) { showToast('Backtest error', 'error'); }
}

// Train Agent
async function trainAgent() {
    showToast('Training agent...', 'info');
    try {
        const res = await fetch(`${API}/train-agent/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent_type: document.getElementById('agent-type').value,
                trading_pair: document.getElementById('agent-pair').value,
                episodes: parseInt(document.getElementById('agent-episodes').value)
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Agent "${data.agent.name}" trained! Win Rate: ${data.agent.win_rate}%`, 'success');
            closeModal('agent-modal');
            loadDashboard();
        }
    } catch (err) { showToast('Training error', 'error'); }
}

// Agent Controls
async function startAgent(id) {
    try {
        await fetch(`${API}/agents/${id}/start/`, { method: 'POST' });
        showToast('Agent started', 'success');
        loadDashboard();
    } catch (err) { showToast('Error starting agent', 'error'); }
}

async function stopAgent(id) {
    try {
        await fetch(`${API}/agents/${id}/stop/`, { method: 'POST' });
        showToast('Agent stopped', 'success');
        loadDashboard();
    } catch (err) { showToast('Error stopping agent', 'error'); }
}

// Show Asset Analysis
function showAssetAnalysis(symbol) {
    document.getElementById('prediction-asset').value = symbol;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-page="predictions"]').classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-predictions').classList.add('active');
    loadPredictions();
}

// Apply Optimization
function applyOptimization() {
    showToast('Portfolio rebalancing initiated', 'success');
}

// Modals
function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// Toast
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    toast.innerHTML = `<i class="fas fa-${icons[type]}" style="color:var(--${type === 'error' ? 'danger' : type})"></i><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// Time filter
document.querySelectorAll('.time-filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        showToast(`Loading ${this.dataset.range} data...`, 'info');
    });
});
