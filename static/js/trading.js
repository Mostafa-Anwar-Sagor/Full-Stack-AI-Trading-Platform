// Trading Terminal JavaScript
const API = '/api';
let currentSide = 'buy';
let currentPair = 'BTC';
let tradingChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initTradingChart();
    loadMarketData();
    generateOrderBook();
    loadAIRecommendation();
    setupEventListeners();
    setInterval(updatePrices, 5000);
});

function setupEventListeners() {
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.getElementById('order-amount')?.addEventListener('input', calculateTotal);
    document.getElementById('order-price')?.addEventListener('input', calculateTotal);
    document.getElementById('amount-slider')?.addEventListener('input', function () {
        const balance = 10000;
        const price = parseFloat(document.getElementById('order-price').value) || 43521;
        const percent = this.value / 100;
        const amount = (balance * percent) / price;
        document.getElementById('order-amount').value = amount.toFixed(6);
        calculateTotal();
    });

    document.getElementById('trading-pair')?.addEventListener('change', function () {
        currentPair = this.value;
        loadMarketData();
        loadAIRecommendation();
    });

    document.querySelectorAll('.order-type-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    document.querySelectorAll('.interval-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function setOrderSide(side) {
    currentSide = side;
    document.querySelectorAll('.panel-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.panel-tab.${side}`).classList.add('active');

    const btn = document.getElementById('order-btn');
    btn.className = `btn btn-order ${side}`;
    btn.innerHTML = `<i class="fas fa-arrow-${side === 'buy' ? 'up' : 'down'}"></i> ${side.charAt(0).toUpperCase() + side.slice(1)} ${currentPair}`;
}

function calculateTotal() {
    const price = parseFloat(document.getElementById('order-price').value) || 0;
    const amount = parseFloat(document.getElementById('order-amount').value) || 0;
    const total = price * amount;
    const fee = total * 0.001;

    document.getElementById('order-total').value = total.toFixed(2);
    document.getElementById('order-fee').textContent = `$${fee.toFixed(2)}`;
}

function initTradingChart() {
    const ctx = document.getElementById('tradingChart')?.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    // Generate candlestick-like data
    const data = generateChartData();

    tradingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.prices,
                fill: true,
                backgroundColor: gradient,
                borderColor: '#10b981',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#6b7280', maxTicksLimit: 10 }
                },
                y: {
                    position: 'right',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#6b7280', callback: v => `$${v.toLocaleString()}` }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

function generateChartData() {
    const prices = [];
    const labels = [];
    let price = 43000;

    for (let i = 0; i < 48; i++) {
        price += (Math.random() - 0.48) * 200;
        prices.push(price);
        labels.push(`${String(i % 24).padStart(2, '0')}:00`);
    }

    return { prices, labels };
}

function generateOrderBook() {
    const sellsContainer = document.getElementById('order-book-sells');
    const buysContainer = document.getElementById('order-book-buys');
    if (!sellsContainer || !buysContainer) return;

    const basePrice = 43521.45;
    let sellHtml = '';
    let buyHtml = '';

    for (let i = 10; i >= 1; i--) {
        const price = (basePrice + i * 5).toFixed(2);
        const amount = (Math.random() * 2).toFixed(4);
        const total = (parseFloat(price) * parseFloat(amount)).toFixed(2);
        sellHtml += `<div class="order-row sell"><span class="price">${price}</span><span style="text-align:center">${amount}</span><span style="text-align:right">${total}</span></div>`;
    }

    for (let i = 1; i <= 10; i++) {
        const price = (basePrice - i * 5).toFixed(2);
        const amount = (Math.random() * 2).toFixed(4);
        const total = (parseFloat(price) * parseFloat(amount)).toFixed(2);
        buyHtml += `<div class="order-row buy"><span class="price">${price}</span><span style="text-align:center">${amount}</span><span style="text-align:right">${total}</span></div>`;
    }

    sellsContainer.innerHTML = sellHtml;
    buysContainer.innerHTML = buyHtml;
}

async function loadMarketData() {
    const prices = { BTC: 43521.45, ETH: 2654.32, SOL: 98.76, BNB: 312.45 };
    const changes = { BTC: 2.34, ETH: -1.21, SOL: 5.67, BNB: 0.89 };

    const price = prices[currentPair] || 43521.45;
    const change = changes[currentPair] || 2.34;

    document.getElementById('current-price').textContent = `$${price.toLocaleString()}`;
    document.getElementById('spread-price').textContent = `$${price.toLocaleString()}`;
    document.getElementById('order-price').value = price;

    const changeEl = document.getElementById('price-change');
    const spreadChangeEl = document.getElementById('spread-change');
    const changeText = `${change >= 0 ? '+' : ''}${change}%`;

    changeEl.textContent = changeText;
    changeEl.className = `pair-change ${change >= 0 ? 'positive' : 'negative'}`;
    spreadChangeEl.textContent = changeText;
    spreadChangeEl.className = `spread-change ${change >= 0 ? 'positive' : 'negative'}`;
}

async function loadAIRecommendation() {
    try {
        const res = await fetch(`${API}/ai-analysis/?symbol=${currentPair}`);
        const data = await res.json();

        const signal = data.trading_signal?.signal || 'buy';
        const confidence = data.trading_signal?.confidence || 75;

        document.getElementById('ai-rec-signal').textContent = signal.replace('_', ' ').toUpperCase();
        document.getElementById('ai-rec-signal').className = `ai-signal-badge ${signal.includes('buy') ? 'buy' : signal.includes('sell') ? 'sell' : 'hold'}`;
        document.getElementById('ai-rec-conf').textContent = `${confidence}%`;
        document.getElementById('ai-rec-reason').textContent = getReasonText(data.trading_signal);
    } catch (err) {
        console.error('AI recommendation error:', err);
    }
}

function getReasonText(signal) {
    if (!signal) return 'Analyzing market conditions...';
    const indicators = signal.indicators || {};
    const reasons = [];

    if (indicators.rsi) {
        const rsi = indicators.rsi.value;
        if (rsi < 30) reasons.push('RSI oversold');
        else if (rsi > 70) reasons.push('RSI overbought');
    }

    if (signal.indicator_scores?.macd > 0) reasons.push('MACD bullish');
    else if (signal.indicator_scores?.macd < 0) reasons.push('MACD bearish');

    if (signal.indicator_scores?.moving_averages > 0) reasons.push('Above key MAs');

    return reasons.length ? reasons.join(', ') : 'Multiple indicators analyzed';
}

function updatePrices() {
    const priceEl = document.getElementById('current-price');
    if (!priceEl) return;

    let price = parseFloat(priceEl.textContent.replace(/[$,]/g, ''));
    price += (Math.random() - 0.5) * 50;
    priceEl.textContent = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('spread-price').textContent = priceEl.textContent;

    generateOrderBook();
}

async function placeOrder() {
    const amount = document.getElementById('order-amount').value;
    const price = document.getElementById('order-price').value;

    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/execute-trade/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                asset: currentPair,
                type: currentSide,
                quantity: parseFloat(amount),
                price: parseFloat(price)
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast(`${currentSide.toUpperCase()} order executed: ${amount} ${currentPair}`, 'success');
            document.getElementById('order-amount').value = '';
            document.getElementById('order-total').value = '';
            document.getElementById('amount-slider').value = 0;
        } else {
            showToast(data.error || 'Order failed', 'error');
        }
    } catch (err) {
        showToast('Failed to place order', 'error');
    }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}
