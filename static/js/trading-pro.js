/**
 * AI Trading Platform - Professional Trading Terminal
 * Real-time market data, candlestick charts, and order execution
 */

// Market data configuration
const CRYPTO_PRICES = {
    BTC: { symbol: 'BTC', name: 'Bitcoin', price: 43521.45, change: 2.34, high: 44892.00, low: 42156.00, volume: 28543 },
    ETH: { symbol: 'ETH', name: 'Ethereum', price: 2284.67, change: 3.12, high: 2345.00, low: 2198.00, volume: 185420 },
    SOL: { symbol: 'SOL', name: 'Solana', price: 98.45, change: -1.24, high: 102.30, low: 95.80, volume: 2845000 },
    BNB: { symbol: 'BNB', name: 'BNB', price: 312.78, change: 1.56, high: 318.50, low: 305.20, volume: 425800 },
    XRP: { symbol: 'XRP', name: 'XRP', price: 0.5234, change: 4.28, high: 0.5450, low: 0.4980, volume: 125000000 },
    ADA: { symbol: 'ADA', name: 'Cardano', price: 0.4856, change: -0.85, high: 0.4950, low: 0.4720, volume: 89500000 }
};

let currentPair = 'BTC';
let orderSide = 'buy';
let orderType = 'limit';
let chart = null;
let candleSeries = null;
let volumeSeries = null;
let currentTimeframe = '1h';
let priceUpdateInterval = null;
let orderBookInterval = null;
let chartData = [];
let openOrders = [];
let availableBalance = 10000.00;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeChart();
    initializeOrderBook();
    initializePriceUpdates();
    initializeEventListeners();
    loadOpenOrders();
    updateUI();
});

// Initialize TradingView Lightweight Chart
function initializeChart() {
    const container = document.getElementById('trading-chart');
    if (!container) return;

    chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: '#9ca3af',
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: { color: '#6366f1', width: 1, style: 2 },
            horzLine: { color: '#6366f1', width: 1, style: 2 },
        },
        rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            timeVisible: true,
            secondsVisible: false,
        },
        handleScroll: { vertTouchDrag: false },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
    });

    volumeSeries = chart.addHistogramSeries({
        color: '#6366f1',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.85, bottom: 0 },
    });

    generateCandleData();

    // Resize handler
    window.addEventListener('resize', () => {
        chart.applyOptions({
            width: container.clientWidth,
            height: container.clientHeight
        });
    });

    // Real-time candle updates
    setInterval(updateLiveCandle, 2000);
}

// Generate realistic candle data
function generateCandleData() {
    const basePrice = CRYPTO_PRICES[currentPair].price;
    const now = Math.floor(Date.now() / 1000);
    const candleCount = 200;
    let timeStep;

    switch (currentTimeframe) {
        case '1m': timeStep = 60; break;
        case '5m': timeStep = 300; break;
        case '15m': timeStep = 900; break;
        case '1h': timeStep = 3600; break;
        case '4h': timeStep = 14400; break;
        case '1d': timeStep = 86400; break;
        case '1w': timeStep = 604800; break;
        default: timeStep = 3600;
    }

    chartData = [];
    let price = basePrice * (1 - Math.random() * 0.15);

    for (let i = candleCount; i >= 0; i--) {
        const time = now - (i * timeStep);
        const volatility = 0.02;
        const trend = (Math.random() - 0.48) * volatility;

        const open = price;
        const change = trend * price;
        const high = open + Math.abs(change) * (1 + Math.random());
        const low = open - Math.abs(change) * Math.random();
        const close = open + change;
        const volume = Math.floor(Math.random() * 1000 + 500) * basePrice / 1000;

        chartData.push({
            time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(Math.max(high, open, close).toFixed(2)),
            low: parseFloat(Math.min(low, open, close).toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: volume
        });

        price = close;
    }

    candleSeries.setData(chartData.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
    volumeSeries.setData(chartData.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
    })));

    chart.timeScale().fitContent();
}

// Update live candle
function updateLiveCandle() {
    if (!chartData.length) return;

    const lastCandle = chartData[chartData.length - 1];
    const crypto = CRYPTO_PRICES[currentPair];
    const priceVariation = (Math.random() - 0.5) * crypto.price * 0.001;

    crypto.price = Math.max(crypto.price + priceVariation, 0.01);

    const newClose = crypto.price;
    lastCandle.close = parseFloat(newClose.toFixed(2));
    lastCandle.high = parseFloat(Math.max(lastCandle.high, newClose).toFixed(2));
    lastCandle.low = parseFloat(Math.min(lastCandle.low, newClose).toFixed(2));

    candleSeries.update({
        time: lastCandle.time,
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
    });

    updatePriceDisplay();
}

// Initialize order book
function initializeOrderBook() {
    updateOrderBook();
    orderBookInterval = setInterval(updateOrderBook, 1500);
}

// Update order book with realistic data
function updateOrderBook() {
    const crypto = CRYPTO_PRICES[currentPair];
    const sellsContainer = document.getElementById('order-book-sells');
    const buysContainer = document.getElementById('order-book-buys');
    if (!sellsContainer || !buysContainer) return;

    let sellsHtml = '';
    let buysHtml = '';

    // Generate sell orders (asks)
    for (let i = 8; i >= 1; i--) {
        const price = crypto.price * (1 + i * 0.0008 + Math.random() * 0.0003);
        const amount = (Math.random() * 2 + 0.1).toFixed(5);
        const total = (price * parseFloat(amount)).toFixed(2);
        sellsHtml += `<div class="order-row sell" onclick="fillOrderPrice(${price.toFixed(2)})">
            <span class="price">${formatPrice(price)}</span>
            <span class="amount">${amount}</span>
            <span class="total">${formatNumber(total)}</span>
        </div>`;
    }

    // Generate buy orders (bids)
    for (let i = 1; i <= 8; i++) {
        const price = crypto.price * (1 - i * 0.0008 - Math.random() * 0.0003);
        const amount = (Math.random() * 2 + 0.1).toFixed(5);
        const total = (price * parseFloat(amount)).toFixed(2);
        buysHtml += `<div class="order-row buy" onclick="fillOrderPrice(${price.toFixed(2)})">
            <span class="price">${formatPrice(price)}</span>
            <span class="amount">${amount}</span>
            <span class="total">${formatNumber(total)}</span>
        </div>`;
    }

    sellsContainer.innerHTML = sellsHtml;
    buysContainer.innerHTML = buysHtml;
}

// Initialize real-time price updates
function initializePriceUpdates() {
    updatePriceDisplay();
    priceUpdateInterval = setInterval(() => {
        // Simulate price changes for all cryptos
        Object.keys(CRYPTO_PRICES).forEach(symbol => {
            const crypto = CRYPTO_PRICES[symbol];
            const change = (Math.random() - 0.5) * crypto.price * 0.002;
            crypto.price = Math.max(crypto.price + change, 0.01);
            crypto.change += (Math.random() - 0.5) * 0.1;
        });
        updatePriceDisplay();
    }, 3000);
}

// Update price displays
function updatePriceDisplay() {
    const crypto = CRYPTO_PRICES[currentPair];

    // Header price
    const headerPrice = document.getElementById('header-price');
    const headerChange = document.getElementById('header-change');
    const headerUsd = document.getElementById('header-usd');

    if (headerPrice) {
        headerPrice.textContent = formatPrice(crypto.price);
        headerPrice.className = `current-price ${crypto.change >= 0 ? 'up' : 'down'}`;
    }
    if (headerChange) {
        headerChange.textContent = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`;
        headerChange.className = `price-change ${crypto.change >= 0 ? 'positive' : 'negative'}`;
    }
    if (headerUsd) {
        headerUsd.textContent = `≈ ${formatPrice(crypto.price)}`;
    }

    // Spread price
    const spreadPrice = document.getElementById('spread-price');
    const spreadChange = document.getElementById('spread-change');
    if (spreadPrice) {
        spreadPrice.textContent = formatPrice(crypto.price);
        spreadPrice.className = `spread-price ${crypto.change >= 0 ? 'up' : 'down'}`;
    }
    if (spreadChange) {
        spreadChange.textContent = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}% (24h)`;
        spreadChange.className = `spread-change ${crypto.change >= 0 ? 'positive' : 'negative'}`;
    }

    // Market stats
    document.getElementById('stat-high')?.textContent && (document.getElementById('stat-high').textContent = formatPrice(crypto.high));
    document.getElementById('stat-low')?.textContent && (document.getElementById('stat-low').textContent = formatPrice(crypto.low));
    document.getElementById('stat-volume')?.textContent && (document.getElementById('stat-volume').textContent = `${formatNumber(crypto.volume)} ${crypto.symbol}`);
    document.getElementById('stat-turnover')?.textContent && (document.getElementById('stat-turnover').textContent = `$${formatLargeNumber(crypto.volume * crypto.price)}`);

    // Order form price
    if (orderType === 'market' || document.getElementById('order-price')?.value === '') {
        document.getElementById('order-price').value = formatNumber(crypto.price);
    }

    // Update AI signals
    updateAISignals();
}

// Update AI analysis
function updateAISignals() {
    const crypto = CRYPTO_PRICES[currentPair];
    const rsi = 30 + Math.random() * 40;
    const macd = (Math.random() - 0.4) * 200;
    let signal, confidence;

    if (rsi < 30) {
        signal = 'STRONG BUY';
        confidence = 85 + Math.random() * 10;
    } else if (rsi < 40) {
        signal = 'BUY';
        confidence = 70 + Math.random() * 15;
    } else if (rsi > 70) {
        signal = 'STRONG SELL';
        confidence = 80 + Math.random() * 15;
    } else if (rsi > 60) {
        signal = 'SELL';
        confidence = 65 + Math.random() * 15;
    } else {
        signal = 'HOLD';
        confidence = 50 + Math.random() * 20;
    }

    const signalEl = document.getElementById('ai-signal');
    if (signalEl) {
        signalEl.textContent = signal;
        signalEl.className = `signal-badge ${signal.toLowerCase().replace(' ', '-')}`;
    }

    const confidenceEl = document.getElementById('ai-confidence');
    const confidenceFill = document.getElementById('confidence-fill');
    if (confidenceEl) confidenceEl.textContent = `${confidence.toFixed(0)}%`;
    if (confidenceFill) {
        confidenceFill.style.width = `${confidence}%`;
        confidenceFill.style.background = signal.includes('BUY') ? 'var(--success)' : signal.includes('SELL') ? 'var(--danger)' : 'var(--text-muted)';
    }

    const rsiEl = document.getElementById('ai-rsi');
    if (rsiEl) {
        rsiEl.textContent = rsi.toFixed(1);
        rsiEl.style.color = rsi < 30 ? 'var(--success)' : rsi > 70 ? 'var(--danger)' : 'var(--text-secondary)';
    }

    const macdEl = document.getElementById('ai-macd');
    if (macdEl) {
        macdEl.textContent = (macd >= 0 ? '+' : '') + macd.toFixed(0);
        macdEl.style.color = macd >= 0 ? 'var(--success)' : 'var(--danger)';
    }
}

// Event listeners
function initializeEventListeners() {
    // Trading pair change
    document.getElementById('trading-pair')?.addEventListener('change', function () {
        currentPair = this.value;
        document.getElementById('ob-pair').textContent = `${currentPair}/USDT`;
        document.getElementById('order-asset').textContent = currentPair;
        generateCandleData();
        updateOrderBook();
        updateUI();
    });

    // Timeframe buttons
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTimeframe = this.dataset.tf;
            generateCandleData();
        });
    });

    // Chart type buttons
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Chart type switching handled by lightweight-charts
        });
    });

    // Order type buttons
    document.querySelectorAll('.order-type-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            orderType = this.dataset.type;
            const priceInput = document.getElementById('order-price');
            if (orderType === 'market') {
                priceInput.value = 'Market Price';
                priceInput.disabled = true;
            } else {
                priceInput.disabled = false;
                priceInput.value = formatNumber(CRYPTO_PRICES[currentPair].price);
            }
        });
    });

    // Percentage buttons
    document.querySelectorAll('.percent-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const pct = parseInt(this.dataset.pct);
            const crypto = CRYPTO_PRICES[currentPair];
            const price = orderType === 'market' ? crypto.price : parseFloat(document.getElementById('order-price').value.replace(/,/g, ''));

            if (orderSide === 'buy') {
                const maxAmount = (availableBalance * pct / 100) / price;
                document.getElementById('order-amount').value = maxAmount.toFixed(5);
            } else {
                // For sell, use 0 as we don't have crypto balance in this demo
                document.getElementById('order-amount').value = (pct / 100).toFixed(5);
            }
            updateOrderTotal();
        });
    });

    // Amount input
    document.getElementById('order-amount')?.addEventListener('input', updateOrderTotal);
    document.getElementById('order-price')?.addEventListener('input', updateOrderTotal);

    // Mobile menu
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

// Set order side (buy/sell)
function setOrderSide(side) {
    orderSide = side;
    document.querySelectorAll('.panel-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.panel-tab.${side}`).classList.add('active');

    const submitBtn = document.getElementById('submit-order');
    submitBtn.className = `order-btn ${side}`;
    submitBtn.innerHTML = `<i class="fas fa-check"></i> ${side.toUpperCase()} ${currentPair}`;

    updateOrderTotal();
}

// Fill order price from order book
function fillOrderPrice(price) {
    if (orderType !== 'market') {
        document.getElementById('order-price').value = formatNumber(price);
        updateOrderTotal();
    }
}

// Update order total
function updateOrderTotal() {
    const crypto = CRYPTO_PRICES[currentPair];
    const priceInput = document.getElementById('order-price');
    const amountInput = document.getElementById('order-amount');
    const totalInput = document.getElementById('order-total');
    const feeEl = document.getElementById('order-fee');
    const receivedEl = document.getElementById('est-received');

    const price = orderType === 'market' ? crypto.price : parseFloat(priceInput.value.replace(/,/g, '')) || 0;
    const amount = parseFloat(amountInput.value) || 0;
    const total = price * amount;
    const fee = total * 0.001;

    totalInput.value = formatNumber(total.toFixed(2));
    feeEl.textContent = `${fee.toFixed(4)} USDT`;

    if (orderSide === 'buy') {
        receivedEl.textContent = `${amount.toFixed(5)} ${currentPair}`;
    } else {
        receivedEl.textContent = `${(total - fee).toFixed(2)} USDT`;
    }
}

// Submit order
function submitOrder() {
    const crypto = CRYPTO_PRICES[currentPair];
    const price = orderType === 'market' ? crypto.price : parseFloat(document.getElementById('order-price').value.replace(/,/g, ''));
    const amount = parseFloat(document.getElementById('order-amount').value);

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    const total = price * amount;

    if (orderSide === 'buy' && total > availableBalance) {
        showToast('Insufficient balance', 'error');
        return;
    }

    // Process order
    const order = {
        id: Date.now(),
        pair: `${currentPair}/USDT`,
        side: orderSide,
        type: orderType,
        price: price,
        amount: amount,
        total: total,
        status: orderType === 'market' ? 'filled' : 'open',
        timestamp: new Date()
    };

    if (orderType === 'market') {
        // Market orders fill immediately
        if (orderSide === 'buy') {
            availableBalance -= total;
        } else {
            availableBalance += total;
        }
        showToast(`${orderSide.toUpperCase()} order filled: ${amount} ${currentPair} @ ${formatPrice(price)}`, 'success');
    } else {
        // Limit orders go to open orders
        openOrders.push(order);
        updateOpenOrdersUI();
        showToast(`${orderSide.toUpperCase()} limit order placed: ${amount} ${currentPair} @ ${formatPrice(price)}`, 'success');
    }

    // Update balance display
    document.getElementById('available-balance').textContent = `${formatNumber(availableBalance.toFixed(2))} USDT`;

    // Clear form
    document.getElementById('order-amount').value = '';
    document.getElementById('order-total').value = '';
    document.getElementById('order-fee').textContent = '0.00 USDT';
    document.getElementById('est-received').textContent = `0.00000 ${currentPair}`;
}

// Load open orders
function loadOpenOrders() {
    // Sample orders
    openOrders = [
        { id: 1, pair: 'BTC/USDT', side: 'buy', type: 'limit', price: 42500, amount: 0.05, timestamp: new Date(Date.now() - 3600000) },
        { id: 2, pair: 'ETH/USDT', side: 'sell', type: 'limit', price: 2400, amount: 0.5, timestamp: new Date(Date.now() - 7200000) },
        { id: 3, pair: 'BTC/USDT', side: 'buy', type: 'limit', price: 42000, amount: 0.02, timestamp: new Date(Date.now() - 1800000) }
    ];
    updateOpenOrdersUI();
}

// Update open orders UI
function updateOpenOrdersUI() {
    const container = document.getElementById('open-orders');
    if (!container) return;

    let html = '';
    openOrders.forEach(order => {
        html += `<div class="order-item">
            <div class="order-item-info">
                <span class="order-item-type ${order.side}">${order.side.toUpperCase()} ${order.pair}</span>
                <span class="order-item-details">${order.amount} @ ${formatPrice(order.price)}</span>
            </div>
            <button class="cancel-btn" onclick="cancelOrder(${order.id})">Cancel</button>
        </div>`;
    });

    container.innerHTML = html || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No open orders</div>';
    document.querySelector('.orders-header').textContent = `Open Orders (${openOrders.length})`;
}

// Cancel order
function cancelOrder(orderId) {
    openOrders = openOrders.filter(o => o.id !== orderId);
    updateOpenOrdersUI();
    showToast('Order cancelled', 'info');
}

// Update UI
function updateUI() {
    const crypto = CRYPTO_PRICES[currentPair];
    document.getElementById('order-price').value = formatNumber(crypto.price);
    document.getElementById('available-balance').textContent = `${formatNumber(availableBalance.toFixed(2))} USDT`;
    updatePriceDisplay();
}

// Utility functions
function formatPrice(price) {
    if (price >= 1000) return `$${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatLargeNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
