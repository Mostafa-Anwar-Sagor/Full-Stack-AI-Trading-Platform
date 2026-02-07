"""
API Views for AI Trading Platform
Full-featured with AI predictions, technical analysis, and more
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import timedelta
import random
from decimal import Decimal
import numpy as np

from .models import Portfolio, Asset, Position, Trade, TradingAgent, BacktestResult, PriceHistory, Alert
from .serializers import (
    PortfolioSerializer, AssetSerializer, PositionSerializer, TradeSerializer,
    TradingAgentSerializer, BacktestResultSerializer, PriceHistorySerializer, AlertSerializer
)
from .ai_services import (
    TechnicalIndicators, LSTMPredictor, RiskAssessment,
    PortfolioOptimizer, TradingSignalGenerator, SentimentAnalyzer
)


# Initialize AI services
signal_generator = TradingSignalGenerator()


def generate_price_history(base_price: float, days: int = 100) -> dict:
    """Generate realistic price history for an asset"""
    prices = {'open': [], 'high': [], 'low': [], 'close': [], 'volume': []}
    current = base_price
    
    for i in range(days):
        volatility = random.uniform(0.01, 0.04)
        change = random.gauss(0, volatility)
        
        open_price = current
        close_price = current * (1 + change)
        high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.02))
        low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.02))
        volume = random.uniform(1000000, 50000000)
        
        prices['open'].append(open_price)
        prices['high'].append(high_price)
        prices['low'].append(low_price)
        prices['close'].append(close_price)
        prices['volume'].append(volume)
        
        current = close_price
    
    return prices


class PortfolioViewSet(viewsets.ModelViewSet):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer


class TradeViewSet(viewsets.ModelViewSet):
    queryset = Trade.objects.all()
    serializer_class = TradeSerializer


class TradingAgentViewSet(viewsets.ModelViewSet):
    queryset = TradingAgent.objects.all()
    serializer_class = TradingAgentSerializer
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        agent = self.get_object()
        agent.status = 'running'
        agent.last_action_at = timezone.now()
        agent.save()
        return Response({'status': 'Agent started successfully', 'agent': TradingAgentSerializer(agent).data})
    
    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        agent = self.get_object()
        agent.status = 'stopped'
        agent.save()
        return Response({'status': 'Agent stopped successfully', 'agent': TradingAgentSerializer(agent).data})
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        agent = self.get_object()
        
        # Generate performance metrics
        performance_data = []
        base_value = 10000
        for i in range(30):
            change = random.uniform(-0.03, 0.04)
            base_value *= (1 + change)
            performance_data.append({
                'date': (timezone.now() - timedelta(days=29-i)).strftime('%Y-%m-%d'),
                'value': round(base_value, 2),
                'trades': random.randint(0, 5)
            })
        
        return Response({
            'agent': TradingAgentSerializer(agent).data,
            'performance': performance_data,
            'metrics': {
                'total_return': round((base_value - 10000) / 100, 2),
                'sharpe_ratio': round(random.uniform(0.5, 2.5), 2),
                'max_drawdown': round(random.uniform(-15, -5), 2),
                'win_rate': float(agent.win_rate),
                'total_trades': agent.total_trades,
                'avg_trade_duration': f"{random.randint(1, 24)}h",
                'profit_factor': round(random.uniform(1.1, 2.5), 2)
            }
        })


class BacktestResultViewSet(viewsets.ModelViewSet):
    queryset = BacktestResult.objects.all()
    serializer_class = BacktestResultSerializer


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer


class DashboardView(APIView):
    """Main dashboard data endpoint"""
    
    def get(self, request):
        # Get or create demo portfolio
        portfolio, _ = Portfolio.objects.get_or_create(
            name='Demo Portfolio',
            defaults={
                'initial_balance': Decimal('10000.00'),
                'current_balance': Decimal('12547.83'),
                'is_paper_trading': True,
            }
        )
        
        # Get or create demo assets with realistic prices
        assets_data = [
            {'symbol': 'BTC', 'name': 'Bitcoin', 'current_price': Decimal('43521.45'), 'price_change_24h': Decimal('2.34'), 'volume_24h': Decimal('28500000000'), 'market_cap': Decimal('851234567890')},
            {'symbol': 'ETH', 'name': 'Ethereum', 'current_price': Decimal('2654.32'), 'price_change_24h': Decimal('-1.21'), 'volume_24h': Decimal('15200000000'), 'market_cap': Decimal('318765432100')},
            {'symbol': 'SOL', 'name': 'Solana', 'current_price': Decimal('98.76'), 'price_change_24h': Decimal('5.67'), 'volume_24h': Decimal('2100000000'), 'market_cap': Decimal('42345678900')},
            {'symbol': 'BNB', 'name': 'Binance Coin', 'current_price': Decimal('312.45'), 'price_change_24h': Decimal('0.89'), 'volume_24h': Decimal('890000000'), 'market_cap': Decimal('48234567890')},
            {'symbol': 'XRP', 'name': 'Ripple', 'current_price': Decimal('0.5234'), 'price_change_24h': Decimal('-0.45'), 'volume_24h': Decimal('1200000000'), 'market_cap': Decimal('27654321000')},
            {'symbol': 'ADA', 'name': 'Cardano', 'current_price': Decimal('0.4567'), 'price_change_24h': Decimal('3.21'), 'volume_24h': Decimal('650000000'), 'market_cap': Decimal('16234567890')},
            {'symbol': 'DOGE', 'name': 'Dogecoin', 'current_price': Decimal('0.0823'), 'price_change_24h': Decimal('1.45'), 'volume_24h': Decimal('450000000'), 'market_cap': Decimal('11567890000')},
            {'symbol': 'DOT', 'name': 'Polkadot', 'current_price': Decimal('7.23'), 'price_change_24h': Decimal('-2.34'), 'volume_24h': Decimal('320000000'), 'market_cap': Decimal('9234567890')},
        ]
        
        for asset_info in assets_data:
            Asset.objects.update_or_create(
                symbol=asset_info['symbol'],
                defaults=asset_info
            )
        
        assets = Asset.objects.all()[:8]
        trades = Trade.objects.filter(portfolio=portfolio).order_by('-executed_at')[:10]
        
        # Get or create demo agents
        agents_data = [
            {'name': 'PPO Alpha Trader', 'agent_type': 'ppo', 'status': 'running', 'trading_pair': 'BTC/USD', 'win_rate': Decimal('72.5'), 'total_profit': Decimal('2847.32'), 'total_trades': 156},
            {'name': 'DQN Momentum', 'agent_type': 'dqn', 'status': 'running', 'trading_pair': 'ETH/USD', 'win_rate': Decimal('65.8'), 'total_profit': Decimal('1523.45'), 'total_trades': 89},
            {'name': 'LSTM Predictor', 'agent_type': 'lstm', 'status': 'running', 'trading_pair': 'SOL/USD', 'win_rate': Decimal('68.2'), 'total_profit': Decimal('956.78'), 'total_trades': 67},
            {'name': 'A3C Multi-Asset', 'agent_type': 'a3c', 'status': 'idle', 'trading_pair': 'MULTI', 'win_rate': Decimal('58.9'), 'total_profit': Decimal('456.12'), 'total_trades': 34},
        ]
        
        for agent_info in agents_data:
            TradingAgent.objects.get_or_create(
                name=agent_info['name'],
                defaults=agent_info
            )
        
        agents = TradingAgent.objects.all()
        running_agents = agents.filter(status='running').count()
        
        # Calculate metrics
        total_value = float(portfolio.current_balance)
        initial = float(portfolio.initial_balance)
        total_return = total_value - initial
        return_percentage = (total_return / initial * 100) if initial > 0 else 0
        
        # Generate AI insights
        btc_prices = generate_price_history(float(assets_data[0]['current_price']), 50)
        lstm_predictor = LSTMPredictor('BTC')
        btc_prediction = lstm_predictor.predict_price(btc_prices['close'], periods_ahead=24)
        
        # Get trading signals for top assets
        signals = []
        for asset in list(assets)[:4]:
            price_data = generate_price_history(float(asset.current_price), 50)
            signal = signal_generator.generate_comprehensive_signal(asset.symbol, price_data)
            signals.append({
                'symbol': asset.symbol,
                'signal': signal['signal'],
                'confidence': signal['confidence'],
                'rsi': signal['indicators']['rsi']['value']
            })
        
        data = {
            'portfolio': {
                'id': str(portfolio.id),
                'name': portfolio.name,
                'total_value': total_value,
                'initial_balance': initial,
                'total_return': total_return,
                'return_percentage': round(return_percentage, 2),
                'is_paper_trading': portfolio.is_paper_trading,
            },
            'market_stats': {
                'active_agents': running_agents,
                'total_trades_today': Trade.objects.filter(
                    executed_at__date=timezone.now().date()
                ).count() + random.randint(5, 15),
                'win_rate': 67.5,
                'sharpe_ratio': 1.85,
                'max_drawdown': -8.3,
                'total_pnl_24h': round(random.uniform(-500, 800), 2),
            },
            'assets': AssetSerializer(assets, many=True).data,
            'agents': TradingAgentSerializer(agents, many=True).data,
            'recent_trades': TradeSerializer(trades, many=True).data,
            'performance_data': self._generate_performance_data(),
            'ai_insights': {
                'btc_prediction': {
                    'direction': btc_prediction['direction'],
                    'confidence': btc_prediction['confidence'],
                    'predicted_change': btc_prediction['predicted_change_percent'],
                },
                'trading_signals': signals,
                'market_sentiment': SentimentAnalyzer.get_market_sentiment('CRYPTO'),
                'risk_level': 'medium',
            }
        }
        
        return Response(data)
    
    def _generate_performance_data(self):
        """Generate sample performance data for charts"""
        data = []
        base_value = 10000
        now = timezone.now()
        
        for i in range(30):
            date = now - timedelta(days=29-i)
            change = random.uniform(-0.02, 0.035)
            base_value = base_value * (1 + change)
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'value': round(base_value, 2),
            })
        
        return data


class MarketDataView(APIView):
    """Real-time market data endpoint"""
    
    def get(self, request):
        assets = Asset.objects.all()
        
        # Simulate real-time price updates
        for asset in assets:
            change = Decimal(str(random.uniform(-0.005, 0.005)))
            asset.current_price = asset.current_price * (1 + change)
            asset.price_change_24h = Decimal(str(random.uniform(-5, 5)))
            asset.save()
        
        return Response({
            'assets': AssetSerializer(assets, many=True).data,
            'timestamp': timezone.now().isoformat(),
            'market_status': 'open',
            'global_metrics': {
                'total_market_cap': '$1.82T',
                'btc_dominance': '52.3%',
                '24h_volume': '$87.5B',
                'fear_greed_index': random.randint(25, 75)
            }
        })


class AIAnalysisView(APIView):
    """AI-powered market analysis"""
    
    def get(self, request):
        symbol = request.query_params.get('symbol', 'BTC')
        
        try:
            asset = Asset.objects.get(symbol=symbol)
            base_price = float(asset.current_price)
        except Asset.DoesNotExist:
            base_price = 43000
        
        # Generate price history
        price_data = generate_price_history(base_price, 100)
        
        # Get comprehensive signal
        signal = signal_generator.generate_comprehensive_signal(symbol, price_data)
        
        # LSTM prediction
        lstm = LSTMPredictor(symbol)
        prediction = lstm.predict_price(price_data['close'], periods_ahead=24)
        
        # Sentiment analysis
        sentiment = SentimentAnalyzer.get_market_sentiment(symbol)
        
        # Technical indicators
        indicators = TechnicalIndicators()
        
        return Response({
            'symbol': symbol,
            'current_price': price_data['close'][-1],
            'trading_signal': signal,
            'lstm_prediction': prediction,
            'sentiment': sentiment,
            'technical_summary': {
                'rsi': indicators.calculate_rsi(price_data['close']),
                'macd': indicators.calculate_macd(price_data['close']),
                'bollinger_bands': indicators.calculate_bollinger_bands(price_data['close']),
                'sma_20': round(np.mean(price_data['close'][-20:]), 2),
                'sma_50': round(np.mean(price_data['close'][-50:]), 2),
                'atr': indicators.calculate_atr(price_data['high'], price_data['low'], price_data['close']),
                'stochastic': indicators.calculate_stochastic(price_data['high'], price_data['low'], price_data['close'])
            },
            'price_history': {
                'labels': [(timezone.now() - timedelta(days=99-i)).strftime('%m/%d') for i in range(100)],
                'prices': [round(p, 2) for p in price_data['close']],
                'volumes': [round(v, 0) for v in price_data['volume']]
            },
            'timestamp': timezone.now().isoformat()
        })


class PredictionView(APIView):
    """LSTM Price Predictions"""
    
    def get(self, request):
        symbol = request.query_params.get('symbol', 'BTC')
        periods = int(request.query_params.get('periods', 24))
        
        try:
            asset = Asset.objects.get(symbol=symbol)
            base_price = float(asset.current_price)
        except Asset.DoesNotExist:
            base_price = 43000
        
        # Generate price history
        price_data = generate_price_history(base_price, 60)
        
        # Get LSTM prediction
        lstm = LSTMPredictor(symbol)
        prediction = lstm.predict_price(price_data['close'], periods_ahead=periods)
        trading_signal = lstm.get_trading_signal(price_data['close'])
        
        return Response({
            'symbol': symbol,
            'prediction': prediction,
            'trading_signal': trading_signal,
            'model_info': {
                'type': 'LSTM',
                'layers': [64, 32, 16],
                'training_epochs': 100,
                'validation_accuracy': round(random.uniform(0.72, 0.88), 2),
                'last_trained': timezone.now().isoformat()
            },
            'timestamp': timezone.now().isoformat()
        })
    
    def post(self, request):
        """Retrain the model with new data"""
        symbol = request.data.get('symbol', 'BTC')
        
        return Response({
            'success': True,
            'message': f'Model retraining initiated for {symbol}',
            'estimated_time': '5-10 minutes',
            'job_id': f'train_{symbol}_{int(timezone.now().timestamp())}'
        })


class RiskAnalysisView(APIView):
    """Portfolio and Trade Risk Analysis"""
    
    def get(self, request):
        portfolio_id = request.query_params.get('portfolio_id')
        
        # Get demo positions
        positions = [
            {'symbol': 'BTC', 'value': 5000, 'weight': 0.4},
            {'symbol': 'ETH', 'value': 3000, 'weight': 0.24},
            {'symbol': 'SOL', 'value': 2000, 'weight': 0.16},
            {'symbol': 'Others', 'value': 2500, 'weight': 0.2},
        ]
        
        # Calculate risk metrics
        portfolio_risk = RiskAssessment.portfolio_risk_metrics(positions, {})
        
        # Generate equity curve for drawdown calculation
        equity_curve = [10000]
        for _ in range(99):
            equity_curve.append(equity_curve[-1] * (1 + random.uniform(-0.03, 0.035)))
        
        max_drawdown = RiskAssessment.calculate_max_drawdown(equity_curve)
        returns = [(equity_curve[i] - equity_curve[i-1]) / equity_curve[i-1] for i in range(1, len(equity_curve))]
        sharpe = RiskAssessment.calculate_sharpe_ratio(returns)
        var_95 = RiskAssessment.calculate_var(returns)
        
        return Response({
            'portfolio_risk': portfolio_risk,
            'risk_metrics': {
                'value_at_risk_95': var_95,
                'sharpe_ratio': sharpe,
                'max_drawdown': max_drawdown,
                'sortino_ratio': round(random.uniform(1.0, 2.5), 2),
                'calmar_ratio': round(random.uniform(0.5, 1.5), 2),
            },
            'position_analysis': positions,
            'risk_alerts': [
                {'type': 'warning', 'message': 'BTC position exceeds 40% of portfolio'},
                {'type': 'info', 'message': 'Consider diversifying into more assets'},
            ],
            'recommendation': 'Portfolio risk is moderate. Consider rebalancing to reduce concentration.',
            'timestamp': timezone.now().isoformat()
        })
    
    def post(self, request):
        """Analyze risk for a potential trade"""
        entry_price = float(request.data.get('entry_price', 43000))
        position_size = float(request.data.get('position_size', 0.1))
        portfolio_value = float(request.data.get('portfolio_value', 10000))
        
        volatility = random.uniform(0.02, 0.05)
        
        risk_assessment = RiskAssessment.assess_trade_risk(
            entry_price, position_size, portfolio_value, volatility
        )
        
        return Response({
            'trade_risk': risk_assessment,
            'timestamp': timezone.now().isoformat()
        })


class PortfolioOptimizationView(APIView):
    """Portfolio Optimization using AI"""
    
    def get(self, request):
        risk_tolerance = request.query_params.get('risk_tolerance', 'medium')
        
        # Get current assets
        assets = [
            {'symbol': 'BTC', 'volatility': 0.35, 'expected_return': 0.15},
            {'symbol': 'ETH', 'volatility': 0.45, 'expected_return': 0.20},
            {'symbol': 'SOL', 'volatility': 0.55, 'expected_return': 0.25},
            {'symbol': 'BNB', 'volatility': 0.30, 'expected_return': 0.10},
            {'symbol': 'ADA', 'volatility': 0.50, 'expected_return': 0.12},
        ]
        
        optimization = PortfolioOptimizer.optimize_allocation(assets, risk_tolerance)
        
        return Response({
            'optimization': optimization,
            'efficient_frontier': self._generate_efficient_frontier(),
            'current_vs_optimal': {
                'current_return': round(random.uniform(10, 20), 2),
                'optimal_return': optimization['expected_portfolio_return'],
                'current_risk': round(random.uniform(25, 35), 2),
                'optimal_risk': optimization['expected_portfolio_volatility']
            },
            'timestamp': timezone.now().isoformat()
        })
    
    def _generate_efficient_frontier(self):
        """Generate efficient frontier data points"""
        points = []
        for i in range(20):
            risk = 10 + i * 2
            ret = 5 + risk * 0.4 + random.uniform(-2, 2)
            points.append({'risk': risk, 'return': round(ret, 2)})
        return points
    
    def post(self, request):
        """Get rebalancing suggestions"""
        current_allocation = request.data.get('current_allocation', [])
        target_allocation = request.data.get('target_allocation', [])
        
        if not current_allocation:
            current_allocation = [
                {'symbol': 'BTC', 'weight': 0.5},
                {'symbol': 'ETH', 'weight': 0.3},
                {'symbol': 'SOL', 'weight': 0.2},
            ]
        
        if not target_allocation:
            target_allocation = [
                {'symbol': 'BTC', 'weight': 0.4},
                {'symbol': 'ETH', 'weight': 0.35},
                {'symbol': 'SOL', 'weight': 0.25},
            ]
        
        suggestions = PortfolioOptimizer.suggest_rebalancing(current_allocation, target_allocation)
        
        return Response({
            'rebalancing_suggestions': suggestions,
            'estimated_trading_cost': round(random.uniform(10, 50), 2),
            'timestamp': timezone.now().isoformat()
        })


@method_decorator(csrf_exempt, name='dispatch')
class TradeExecutionView(APIView):
    """Execute trades with AI recommendations"""
    
    def post(self, request):
        portfolio_id = request.data.get('portfolio_id')
        asset_symbol = request.data.get('asset')
        trade_type = request.data.get('type')
        quantity = Decimal(str(request.data.get('quantity', 0)))
        
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
            asset = Asset.objects.get(symbol=asset_symbol)
        except (Portfolio.DoesNotExist, Asset.DoesNotExist):
            # Create demo portfolio and asset if not exist
            portfolio, _ = Portfolio.objects.get_or_create(
                name='Demo Portfolio',
                defaults={'initial_balance': Decimal('10000'), 'current_balance': Decimal('10000')}
            )
            asset, _ = Asset.objects.get_or_create(
                symbol=asset_symbol,
                defaults={'name': asset_symbol, 'current_price': Decimal('1000')}
            )
        
        # Get AI recommendation before executing
        price_data = generate_price_history(float(asset.current_price), 50)
        signal = signal_generator.generate_comprehensive_signal(asset_symbol, price_data)
        
        total_value = quantity * asset.current_price
        fee = total_value * Decimal('0.001')
        
        if trade_type == 'buy':
            if portfolio.current_balance < total_value + fee:
                return Response({'error': 'Insufficient balance'}, status=400)
            portfolio.current_balance -= total_value + fee
        else:
            portfolio.current_balance += total_value - fee
        
        portfolio.save()
        
        trade = Trade.objects.create(
            portfolio=portfolio,
            asset=asset,
            trade_type=trade_type,
            quantity=quantity,
            price=asset.current_price,
            total_value=total_value,
            fee=fee,
            status='executed',
        )
        
        return Response({
            'success': True,
            'trade': TradeSerializer(trade).data,
            'new_balance': float(portfolio.current_balance),
            'ai_recommendation': {
                'signal': signal['signal'],
                'confidence': signal['confidence'],
                'aligned_with_ai': (trade_type == 'buy' and 'buy' in signal['signal']) or 
                                   (trade_type == 'sell' and 'sell' in signal['signal'])
            }
        })


@method_decorator(csrf_exempt, name='dispatch')
class BacktestView(APIView):
    """Run backtests with AI strategies"""
    
    def post(self, request):
        agent_type = request.data.get('agent_type', 'ppo')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        initial_capital = Decimal(str(request.data.get('initial_capital', 10000)))
        
        # Simulate detailed backtest results
        total_return = Decimal(str(random.uniform(-20, 50)))
        final_capital = initial_capital * (1 + total_return / 100)
        
        # Get or create agent
        agent, _ = TradingAgent.objects.get_or_create(
            name=f'{agent_type.upper()} Backtest Agent',
            defaults={
                'agent_type': agent_type,
                'status': 'idle',
            }
        )
        
        result = BacktestResult.objects.create(
            agent=agent,
            start_date=start_date or (timezone.now().date() - timedelta(days=365)),
            end_date=end_date or timezone.now().date(),
            initial_capital=initial_capital,
            final_capital=final_capital,
            total_return=total_return,
            sharpe_ratio=Decimal(str(random.uniform(0.5, 2.5))),
            max_drawdown=Decimal(str(random.uniform(-30, -5))),
            win_rate=Decimal(str(random.uniform(45, 75))),
            total_trades=random.randint(50, 500),
        )
        
        # Generate detailed trade log
        trades_log = []
        for i in range(min(20, result.total_trades)):
            trades_log.append({
                'date': (timezone.now() - timedelta(days=random.randint(1, 365))).strftime('%Y-%m-%d'),
                'type': random.choice(['buy', 'sell']),
                'asset': random.choice(['BTC', 'ETH', 'SOL']),
                'price': round(random.uniform(100, 50000), 2),
                'quantity': round(random.uniform(0.01, 1), 4),
                'pnl': round(random.uniform(-500, 1000), 2)
            })
        
        # Generate equity curve
        equity_curve = []
        value = float(initial_capital)
        for i in range(365):
            value *= (1 + random.uniform(-0.02, 0.025))
            if i % 7 == 0:  # Weekly data points
                equity_curve.append({
                    'date': (timezone.now() - timedelta(days=365-i)).strftime('%Y-%m-%d'),
                    'value': round(value, 2)
                })
        
        return Response({
            'success': True,
            'result': BacktestResultSerializer(result).data,
            'detailed_metrics': {
                'total_return_pct': float(total_return),
                'annualized_return': round(float(total_return) * 1.2, 2),
                'sharpe_ratio': float(result.sharpe_ratio),
                'sortino_ratio': round(random.uniform(1.0, 2.5), 2),
                'max_drawdown': float(result.max_drawdown),
                'win_rate': float(result.win_rate),
                'profit_factor': round(random.uniform(1.1, 2.5), 2),
                'avg_win': round(random.uniform(100, 500), 2),
                'avg_loss': round(random.uniform(-300, -50), 2),
                'largest_win': round(random.uniform(500, 2000), 2),
                'largest_loss': round(random.uniform(-1500, -200), 2),
                'avg_trade_duration': f"{random.randint(1, 48)}h",
                'total_trades': result.total_trades,
                'winning_trades': int(result.total_trades * float(result.win_rate) / 100),
                'losing_trades': int(result.total_trades * (1 - float(result.win_rate) / 100)),
            },
            'trades_log': trades_log,
            'equity_curve': equity_curve,
            'monthly_returns': [
                {'month': f'2025-{i:02d}', 'return': round(random.uniform(-10, 15), 2)}
                for i in range(1, 13)
            ]
        })


@method_decorator(csrf_exempt, name='dispatch')
class AgentTrainingView(APIView):
    """Train RL agents"""
    
    def post(self, request):
        agent_type = request.data.get('agent_type', 'ppo')
        trading_pair = request.data.get('trading_pair', 'BTC/USD')
        episodes = request.data.get('episodes', 1000)
        learning_rate = request.data.get('learning_rate', 0.0003)
        
        agent = TradingAgent.objects.create(
            name=f'{agent_type.upper()} Agent - {trading_pair}',
            agent_type=agent_type,
            trading_pair=trading_pair,
            status='training',
            config={
                'episodes': episodes,
                'learning_rate': learning_rate,
                'gamma': 0.99,
                'batch_size': 64,
                'network_architecture': [256, 128, 64],
                'reward_function': 'sharpe_ratio',
            }
        )
        
        # Simulate training completion
        agent.status = 'idle'
        agent.win_rate = Decimal(str(random.uniform(55, 80)))
        agent.total_profit = Decimal(str(random.uniform(-1000, 5000)))
        agent.total_trades = random.randint(100, 500)
        agent.save()
        
        return Response({
            'success': True,
            'agent': TradingAgentSerializer(agent).data,
            'training_metrics': {
                'episodes_completed': episodes,
                'final_reward': round(random.uniform(500, 2000), 2),
                'training_time': f"{random.randint(5, 30)} minutes",
                'convergence_epoch': random.randint(500, episodes),
                'validation_sharpe': round(random.uniform(1.0, 2.5), 2),
            },
            'message': f'Agent training completed with {episodes} episodes',
        })
    
    def get(self, request):
        """Get training status and available configurations"""
        return Response({
            'available_agents': [
                {
                    'type': 'ppo',
                    'name': 'Proximal Policy Optimization',
                    'description': 'Stable policy gradient method for continuous action spaces',
                    'recommended_for': ['portfolio_management', 'position_sizing']
                },
                {
                    'type': 'dqn',
                    'name': 'Deep Q-Network',
                    'description': 'Value-based RL for discrete trading actions',
                    'recommended_for': ['buy_sell_decisions', 'market_making']
                },
                {
                    'type': 'a3c',
                    'name': 'Asynchronous Advantage Actor-Critic',
                    'description': 'Parallel training for faster convergence',
                    'recommended_for': ['multi_asset_trading', 'high_frequency']
                },
                {
                    'type': 'lstm',
                    'name': 'LSTM Neural Network',
                    'description': 'Time series prediction for price forecasting',
                    'recommended_for': ['price_prediction', 'trend_following']
                }
            ],
            'default_config': {
                'episodes': 1000,
                'learning_rate': 0.0003,
                'gamma': 0.99,
                'batch_size': 64,
            }
        })


@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '2.0.0',
        'ai_services': 'active',
        'models_loaded': True,
    })


@api_view(['GET'])
def api_overview(request):
    """API overview and documentation"""
    return Response({
        'name': 'AI Trading Platform API',
        'version': '2.0.0',
        'description': 'Advanced AI-Powered Algorithmic Trading Platform',
        'endpoints': {
            'dashboard': '/api/dashboard/',
            'portfolios': '/api/portfolios/',
            'assets': '/api/assets/',
            'trades': '/api/trades/',
            'agents': '/api/agents/',
            'backtests': '/api/backtests/',
            'market_data': '/api/market-data/',
            'ai_analysis': '/api/ai-analysis/',
            'predictions': '/api/predictions/',
            'risk_analysis': '/api/risk-analysis/',
            'portfolio_optimization': '/api/portfolio-optimization/',
            'execute_trade': '/api/execute-trade/',
            'run_backtest': '/api/run-backtest/',
            'train_agent': '/api/train-agent/',
            'health': '/api/health/',
        },
        'ai_features': [
            'LSTM Price Predictions',
            'Technical Indicator Analysis',
            'Risk Assessment',
            'Portfolio Optimization',
            'Sentiment Analysis',
            'Trading Signal Generation',
            'Reinforcement Learning Agents (PPO, DQN, A3C)',
        ],
        'documentation': 'https://github.com/Mostafa-Anwar-Sagor/Full-Stack-AI-Trading-Platform',
    })
