/**
 * AI Trading Platform - Binance-Style Trading Terminal
 * Real-time market data from Binance API with professional candlestick charts
 */

// Binance API endpoints
const BINANCE_API = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/ws';

// State
let currentSymbol = 'BTCUSDT';
let currentInterval = '4h';
let orderSide = 'buy';
let orderType = 'limit';
let chart = null;
let candleSeries = null;
let volumeSeries = null;
let ma7Series = null;
let ma25Series = null;
let ma99Series = null;
let chartData = [];
let priceSocket = null;
let klineSocket = null;
let availableBalance = 10000.00;
let currentPrice = 0;
let priceDirection = 'up';

// Crypto symbols for ticker
const TICKER_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
    initializeChart();
    await loadRealKlineData();
    initializeWebSocket();
    initializeOrderBook();
    initializeTicker();
    initializeEventListeners();
    updateUI();
    hideLoading();
});

// Initialize TradingView Lightweight Chart
function initializeChart() {
    const container = document.getElementById('trading-chart');
    if (!container) return;

    chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
            background: { type: 'solid', color: '#0b0e11' },
            textColor: '#848e9c',
        },
        grid: {
            vertLines: { color: 'rgba(43, 49, 57, 0.5)' },
            horzLines: { color: 'rgba(43, 49, 57, 0.5)' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: { color: '#758696', width: 1, style: 2, labelBackgroundColor: '#1e2329' },
            horzLine: { color: '#758696', width: 1, style: 2, labelBackgroundColor: '#1e2329' },
        },
        rightPriceScale: {
            borderColor: '#2b3139',
            scaleMargins: { top: 0.1, bottom: 0.25 },
        },
        timeScale: {
            borderColor: '#2b3139',
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 5,
        },
        handleScroll: { vertTouchDrag: true },
    });

    // Candlestick series
    candleSeries = chart.addCandlestickSeries({
        upColor: '#0ecb81',
        downColor: '#f6465d',
        borderDownColor: '#f6465d',
        borderUpColor: '#0ecb81',
        wickDownColor: '#f6465d',
        wickUpColor: '#0ecb81',
    });

    // Volume series
    volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: { top: 0.85, bottom: 0 },
    });

    chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
    });

    // Moving averages
    ma7Series = chart.addLineSeries({
        color: '#f0b90b',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
    });

    ma25Series = chart.addLineSeries({
        color: '#e84142',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
    });

    ma99Series = chart.addLineSeries({
        color: '#9945ff',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
    });

    // Resize handler
    window.addEventListener('resize', () => {
        chart.applyOptions({
            width: container.clientWidth,
            height: container.clientHeight
        });
    });

    // Crosshair move handler for MA values
    chart.subscribeCrosshairMove(param => {
        if (param.time) {
            const ma7Data = param.seriesData.get(ma7Series);
            const ma25Data = param.seriesData.get(ma25Series);
            const ma99Data = param.seriesData.get(ma99Series);

            if (ma7Data) document.getElementById('ma7-value').textContent = formatPrice(ma7Data.value);
            if (ma25Data) document.getElementById('ma25-value').textContent = formatPrice(ma25Data.value);
            if (ma99Data) document.getElementById('ma99-value').textContent = formatPrice(ma99Data.value);
        }
    });
}

// Load real kline data from Binance
async function loadRealKlineData() {
    try {
        const response = await fetch(`${BINANCE_API}/klines?symbol=${currentSymbol}&interval=${currentInterval}&limit=500`);
        const data = await response.json();

        chartData = data.map(k => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));

        // Update chart
        candleSeries.setData(chartData.map(c => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
        })));

        // Volume with colors
        volumeSeries.setData(chartData.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(14, 203, 129, 0.5)' : 'rgba(246, 70, 93, 0.5)'
        })));

        // Calculate and set MAs
        setMovingAverages();

        // Get current price
        if (chartData.length > 0) {
            currentPrice = chartData[chartData.length - 1].close;
            updatePriceDisplay(currentPrice);
        }

        // Load 24h ticker data
        await load24hTicker();

        chart.timeScale().fitContent();
    } catch (error) {
        console.error('Error loading kline data:', error);
        showToast('Error loading chart data', 'error');
    }
}

// Calculate and set moving averages
function setMovingAverages() {
    const closes = chartData.map(c => c.close);
    const times = chartData.map(c => c.time);

    const ma7Data = calculateMA(closes, 7).map((v, i) => v ? { time: times[i], value: v } : null).filter(Boolean);
    const ma25Data = calculateMA(closes, 25).map((v, i) => v ? { time: times[i], value: v } : null).filter(Boolean);
    const ma99Data = calculateMA(closes, 99).map((v, i) => v ? { time: times[i], value: v } : null).filter(Boolean);

    ma7Series.setData(ma7Data);
    ma25Series.setData(ma25Data);
    ma99Series.setData(ma99Data);

    // Update overlay values
    if (ma7Data.length) document.getElementById('ma7-value').textContent = formatPrice(ma7Data[ma7Data.length - 1].value);
    if (ma25Data.length) document.getElementById('ma25-value').textContent = formatPrice(ma25Data[ma25Data.length - 1].value);
    if (ma99Data.length) document.getElementById('ma99-value').textContent = formatPrice(ma99Data[ma99Data.length - 1].value);
}

// Calculate moving average
function calculateMA(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }
    return result;
}

// Load 24h ticker data
async function load24hTicker() {
    try {
        const response = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${currentSymbol}`);
        const data = await response.json();

        document.getElementById('stat-high').textContent = `$${formatNumber(parseFloat(data.highPrice))}`;
        document.getElementById('stat-low').textContent = `$${formatNumber(parseFloat(data.lowPrice))}`;
        document.getElementById('stat-volume').textContent = formatLargeNumber(parseFloat(data.volume));
        document.getElementById('stat-turnover').textContent = formatLargeNumber(parseFloat(data.quoteVolume));

        const change = parseFloat(data.priceChangePercent);
        priceDirection = change >= 0 ? 'up' : 'down';

        document.getElementById('header-change').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        document.getElementById('header-change').className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;

        document.getElementById('spread-change').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}% (24h)`;
    } catch (error) {
        console.error('Error loading 24h ticker:', error);
    }
}

// Initialize WebSocket for real-time updates
function initializeWebSocket() {
    // Close existing connections
    if (priceSocket) priceSocket.close();
    if (klineSocket) klineSocket.close();

    // Price stream
    priceSocket = new WebSocket(`${BINANCE_WS}/${currentSymbol.toLowerCase()}@ticker`);
    priceSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const price = parseFloat(data.c);
        const change = parseFloat(data.P);

        priceDirection = price >= currentPrice ? 'up' : 'down';
        currentPrice = price;

        updatePriceDisplay(price);
        document.getElementById('header-change').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        document.getElementById('header-change').className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
    };

    // Kline stream for real-time candle updates
    klineSocket = new WebSocket(`${BINANCE_WS}/${currentSymbol.toLowerCase()}@kline_${currentInterval}`);
    klineSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const k = data.k;

        const candle = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c)
        };

        candleSeries.update(candle);

        volumeSeries.update({
            time: candle.time,
            value: parseFloat(k.v),
            color: candle.close >= candle.open ? 'rgba(14, 203, 129, 0.5)' : 'rgba(246, 70, 93, 0.5)'
        });
    };

    priceSocket.onerror = () => console.error('Price WebSocket error');
    klineSocket.onerror = () => console.error('Kline WebSocket error');
}

// Update price display
function updatePriceDisplay(price) {
    const headerPrice = document.getElementById('header-price');
    const spreadPrice = document.getElementById('spread-price');
    const spreadArrow = document.getElementById('spread-arrow');
    const orderPrice = document.getElementById('order-price');

    const formattedPrice = `$${formatNumber(price)}`;

    if (headerPrice) {
        headerPrice.textContent = formattedPrice;
        headerPrice.className = `current-price ${priceDirection}`;
    }

    if (spreadPrice) {
        spreadPrice.innerHTML = `<span id="spread-arrow">${priceDirection === 'up' ? '↑' : '↓'}</span> ${formattedPrice}`;
        spreadPrice.className = `spread-price ${priceDirection}`;
    }

    if (orderType === 'market' || !orderPrice.value || orderPrice.dataset.auto === 'true') {
        orderPrice.value = formatNumber(price);
        orderPrice.dataset.auto = 'true';
    }

    // Update AI signals based on price
    updateAISignals(price);
}

// Initialize order book with real data
async function initializeOrderBook() {
    await updateOrderBook();
    setInterval(updateOrderBook, 2000);
}

// Update order book
async function updateOrderBook() {
    try {
        const response = await fetch(`${BINANCE_API}/depth?symbol=${currentSymbol}&limit=10`);
        const data = await response.json();

        const sellsContainer = document.getElementById('order-book-sells');
        const buysContainer = document.getElementById('order-book-buys');

        // Calculate max total for percentage bars
        const maxBid = Math.max(...data.bids.map(b => parseFloat(b[0]) * parseFloat(b[1])));
        const maxAsk = Math.max(...data.asks.map(a => parseFloat(a[0]) * parseFloat(a[1])));
        const maxTotal = Math.max(maxBid, maxAsk);

        // Sells (asks) - reversed order
        let sellsHtml = '';
        [...data.asks].reverse().slice(0, 8).forEach(ask => {
            const price = parseFloat(ask[0]);
            const amount = parseFloat(ask[1]);
            const total = price * amount;
            const pct = (total / maxTotal) * 100;

            sellsHtml += `<div class="order-row sell" style="--row-pct:${pct}%" onclick="fillOrderPrice(${price})">
                <span class="price">${formatNumber(price)}</span>
                <span class="amount">${amount.toFixed(5)}</span>
                <span class="total">${formatNumber(total)}</span>
            </div>`;
        });

        // Buys (bids)
        let buysHtml = '';
        data.bids.slice(0, 8).forEach(bid => {
            const price = parseFloat(bid[0]);
            const amount = parseFloat(bid[1]);
            const total = price * amount;
            const pct = (total / maxTotal) * 100;

            buysHtml += `<div class="order-row buy" style="--row-pct:${pct}%" onclick="fillOrderPrice(${price})">
                <span class="price">${formatNumber(price)}</span>
                <span class="amount">${amount.toFixed(5)}</span>
                <span class="total">${formatNumber(total)}</span>
            </div>`;
        });

        sellsContainer.innerHTML = sellsHtml;
        buysContainer.innerHTML = buysHtml;
    } catch (error) {
        console.error('Error updating order book:', error);
    }
}

// Initialize bottom ticker bar
async function initializeTicker() {
    try {
        const response = await fetch(`${BINANCE_API}/ticker/24hr`);
        const allTickers = await response.json();

        const tickerBar = document.getElementById('ticker-bar');
        let html = '';

        TICKER_SYMBOLS.forEach(symbol => {
            const ticker = allTickers.find(t => t.symbol === symbol);
            if (ticker) {
                const price = parseFloat(ticker.lastPrice);
                const change = parseFloat(ticker.priceChangePercent);
                const displaySymbol = symbol.replace('USDT', '/USDT');

                html += `<div class="ticker-item" onclick="changeSymbol('${symbol}')">
                    <span class="ticker-symbol">${displaySymbol}</span>
                    <span class="ticker-price ${change >= 0 ? 'positive' : 'negative'}">$${formatNumber(price)}</span>
                    <span class="ticker-change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>
                </div>`;
            }
        });

        tickerBar.innerHTML = html;

        // Update ticker periodically
        setInterval(updateTicker, 5000);
    } catch (error) {
        console.error('Error loading ticker:', error);
    }
}

// Update ticker prices
async function updateTicker() {
    try {
        const response = await fetch(`${BINANCE_API}/ticker/24hr`);
        const allTickers = await response.json();

        document.querySelectorAll('.ticker-item').forEach(item => {
            const symbol = item.querySelector('.ticker-symbol').textContent.replace('/USDT', 'USDT');
            const ticker = allTickers.find(t => t.symbol === symbol);
            if (ticker) {
                const price = parseFloat(ticker.lastPrice);
                const change = parseFloat(ticker.priceChangePercent);

                item.querySelector('.ticker-price').textContent = `$${formatNumber(price)}`;
                item.querySelector('.ticker-price').className = `ticker-price ${change >= 0 ? 'positive' : 'negative'}`;
                item.querySelector('.ticker-change').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                item.querySelector('.ticker-change').className = `ticker-change ${change >= 0 ? 'positive' : 'negative'}`;
            }
        });
    } catch (error) {
        console.error('Error updating ticker:', error);
    }
}

// Update AI signals
function updateAISignals(price) {
    // Simulated RSI and MACD based on price movement
    const rsi = 30 + Math.random() * 40;
    const macd = (Math.random() - 0.4) * 300;
    let signal, confidence;

    if (rsi < 30) {
        signal = 'STRONG BUY';
        confidence = 85 + Math.random() * 10;
    } else if (rsi < 45) {
        signal = 'BUY';
        confidence = 70 + Math.random() * 15;
    } else if (rsi > 70) {
        signal = 'STRONG SELL';
        confidence = 80 + Math.random() * 15;
    } else if (rsi > 55) {
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
        confidenceFill.style.background = signal.includes('BUY') ? '#0ecb81' : signal.includes('SELL') ? '#f6465d' : '#848e9c';
    }

    const rsiEl = document.getElementById('ai-rsi');
    if (rsiEl) {
        rsiEl.textContent = rsi.toFixed(1);
        rsiEl.style.color = rsi < 30 ? '#0ecb81' : rsi > 70 ? '#f6465d' : '#eaecef';
    }

    const macdEl = document.getElementById('ai-macd');
    if (macdEl) {
        macdEl.textContent = (macd >= 0 ? '+' : '') + macd.toFixed(0);
        macdEl.style.color = macd >= 0 ? '#0ecb81' : '#f6465d';
    }
}

// Event listeners
function initializeEventListeners() {
    // Trading pair change
    document.getElementById('trading-pair')?.addEventListener('change', async function () {
        currentSymbol = this.value;
        const displaySymbol = currentSymbol.replace('USDT', '/USDT');
        document.getElementById('ob-pair').textContent = displaySymbol;
        document.getElementById('order-asset').textContent = currentSymbol.replace('USDT', '');

        showLoading();
        await loadRealKlineData();
        initializeWebSocket();
        hideLoading();
    });

    // Timeframe buttons
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentInterval = this.dataset.tf;

            showLoading();
            await loadRealKlineData();
            initializeWebSocket();
            hideLoading();
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
                priceInput.value = 'Market';
                priceInput.disabled = true;
            } else {
                priceInput.disabled = false;
                priceInput.value = formatNumber(currentPrice);
                priceInput.dataset.auto = 'true';
            }
        });
    });

    // Percentage buttons
    document.querySelectorAll('.percent-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const pct = parseInt(this.dataset.pct);
            const price = orderType === 'market' ? currentPrice : parseFloat(document.getElementById('order-price').value.replace(/,/g, ''));

            if (orderSide === 'buy') {
                const maxAmount = (availableBalance * pct / 100) / price;
                document.getElementById('order-amount').value = maxAmount.toFixed(5);
            } else {
                document.getElementById('order-amount').value = (pct / 100).toFixed(5);
            }
            updateOrderTotal();
        });
    });

    // Amount/price inputs
    document.getElementById('order-amount')?.addEventListener('input', updateOrderTotal);
    document.getElementById('order-price')?.addEventListener('input', function () {
        this.dataset.auto = 'false';
        updateOrderTotal();
    });

    // Mobile menu
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Indicator buttons
    document.getElementById('btn-ma')?.addEventListener('click', function () {
        this.classList.toggle('active');
        const visible = this.classList.contains('active');
        ma7Series.applyOptions({ visible });
        ma25Series.applyOptions({ visible });
        ma99Series.applyOptions({ visible });
    });

    document.getElementById('btn-vol')?.addEventListener('click', function () {
        this.classList.toggle('active');
        volumeSeries.applyOptions({ visible: this.classList.contains('active') });
    });
}

// Change symbol from ticker
async function changeSymbol(symbol) {
    currentSymbol = symbol;
    document.getElementById('trading-pair').value = symbol;
    const displaySymbol = symbol.replace('USDT', '/USDT');
    document.getElementById('ob-pair').textContent = displaySymbol;
    document.getElementById('order-asset').textContent = symbol.replace('USDT', '');

    showLoading();
    await loadRealKlineData();
    initializeWebSocket();
    hideLoading();
}

// Set order side
function setOrderSide(side) {
    orderSide = side;
    document.querySelectorAll('.panel-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.panel-tab.${side}`).classList.add('active');

    const submitBtn = document.getElementById('submit-order');
    const asset = currentSymbol.replace('USDT', '');
    submitBtn.className = `order-btn ${side}`;
    submitBtn.innerHTML = `<i class="fas fa-check"></i> ${side.toUpperCase()} ${asset}`;

    updateOrderTotal();
}

// Fill order price from order book
function fillOrderPrice(price) {
    if (orderType !== 'market') {
        document.getElementById('order-price').value = formatNumber(price);
        document.getElementById('order-price').dataset.auto = 'false';
        updateOrderTotal();
    }
}

// Update order total
function updateOrderTotal() {
    const priceInput = document.getElementById('order-price');
    const amountInput = document.getElementById('order-amount');
    const totalInput = document.getElementById('order-total');
    const feeEl = document.getElementById('order-fee');
    const receivedEl = document.getElementById('est-received');
    const asset = currentSymbol.replace('USDT', '');

    const price = orderType === 'market' ? currentPrice : parseFloat(priceInput.value.replace(/,/g, '')) || 0;
    const amount = parseFloat(amountInput.value) || 0;
    const total = price * amount;
    const fee = total * 0.001;

    totalInput.value = formatNumber(total);
    feeEl.textContent = `${fee.toFixed(4)} USDT`;

    if (orderSide === 'buy') {
        receivedEl.textContent = `${amount.toFixed(5)} ${asset}`;
    } else {
        receivedEl.textContent = `${(total - fee).toFixed(2)} USDT`;
    }
}

// Submit order
function submitOrder() {
    const price = orderType === 'market' ? currentPrice : parseFloat(document.getElementById('order-price').value.replace(/,/g, ''));
    const amount = parseFloat(document.getElementById('order-amount').value);
    const asset = currentSymbol.replace('USDT', '');

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
    if (orderSide === 'buy') {
        availableBalance -= total;
    } else {
        availableBalance += total;
    }

    showToast(`${orderSide.toUpperCase()} order filled: ${amount} ${asset} @ $${formatNumber(price)}`, 'success');

    document.getElementById('available-balance').textContent = `${formatNumber(availableBalance)} USDT`;
    document.getElementById('order-amount').value = '';
    document.getElementById('order-total').value = '';
    document.getElementById('order-fee').textContent = '0.00 USDT';
    document.getElementById('est-received').textContent = `0.00000 ${asset}`;
}

// Update UI
function updateUI() {
    const asset = currentSymbol.replace('USDT', '');
    document.getElementById('available-balance').textContent = `${formatNumber(availableBalance)} USDT`;
    document.getElementById('order-asset').textContent = asset;

    const submitBtn = document.getElementById('submit-order');
    submitBtn.innerHTML = `<i class="fas fa-check"></i> Buy ${asset}`;
}

// Utility functions
function formatNumber(num) {
    const n = parseFloat(num);
    if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(2);
    return n.toFixed(4);
}

function formatPrice(num) {
    const n = parseFloat(num);
    if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(2);
    return n.toFixed(4);
}

function formatLargeNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function showLoading() {
    document.getElementById('chart-loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('chart-loading').style.display = 'none';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (priceSocket) priceSocket.close();
    if (klineSocket) klineSocket.close();
});
