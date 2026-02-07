"""
AI/ML Services for Trading Platform
Includes: LSTM Predictions, Technical Indicators, Risk Assessment, Portfolio Optimization
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import random
import math


class TechnicalIndicators:
    """Calculate technical indicators for trading signals"""
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int = 20) -> List[float]:
        """Simple Moving Average"""
        if len(prices) < period:
            return [np.mean(prices)] * len(prices)
        
        sma = []
        for i in range(len(prices)):
            if i < period - 1:
                sma.append(np.mean(prices[:i+1]))
            else:
                sma.append(np.mean(prices[i-period+1:i+1]))
        return sma
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int = 20) -> List[float]:
        """Exponential Moving Average"""
        if len(prices) == 0:
            return []
        
        multiplier = 2 / (period + 1)
        ema = [prices[0]]
        
        for i in range(1, len(prices)):
            ema.append((prices[i] * multiplier) + (ema[-1] * (1 - multiplier)))
        return ema
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> float:
        """Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas[-period:]]
        losses = [-d if d < 0 else 0 for d in deltas[-period:]]
        
        avg_gain = np.mean(gains) if gains else 0
        avg_loss = np.mean(losses) if losses else 0
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return round(rsi, 2)
    
    @staticmethod
    def calculate_macd(prices: List[float]) -> Dict[str, float]:
        """MACD - Moving Average Convergence Divergence"""
        if len(prices) < 26:
            return {'macd': 0, 'signal': 0, 'histogram': 0}
        
        ema12 = TechnicalIndicators.calculate_ema(prices, 12)
        ema26 = TechnicalIndicators.calculate_ema(prices, 26)
        
        macd_line = [ema12[i] - ema26[i] for i in range(len(prices))]
        signal_line = TechnicalIndicators.calculate_ema(macd_line, 9)
        
        return {
            'macd': round(macd_line[-1], 4),
            'signal': round(signal_line[-1], 4),
            'histogram': round(macd_line[-1] - signal_line[-1], 4)
        }
    
    @staticmethod
    def calculate_bollinger_bands(prices: List[float], period: int = 20) -> Dict[str, float]:
        """Bollinger Bands"""
        if len(prices) < period:
            current_price = prices[-1] if prices else 0
            return {'upper': current_price * 1.02, 'middle': current_price, 'lower': current_price * 0.98}
        
        sma = np.mean(prices[-period:])
        std = np.std(prices[-period:])
        
        return {
            'upper': round(sma + (2 * std), 2),
            'middle': round(sma, 2),
            'lower': round(sma - (2 * std), 2)
        }
    
    @staticmethod
    def calculate_atr(high: List[float], low: List[float], close: List[float], period: int = 14) -> float:
        """Average True Range - Volatility indicator"""
        if len(high) < 2:
            return 0
        
        tr_list = []
        for i in range(1, len(high)):
            tr = max(
                high[i] - low[i],
                abs(high[i] - close[i-1]),
                abs(low[i] - close[i-1])
            )
            tr_list.append(tr)
        
        return round(np.mean(tr_list[-period:]), 4) if tr_list else 0
    
    @staticmethod
    def calculate_stochastic(high: List[float], low: List[float], close: List[float], period: int = 14) -> Dict[str, float]:
        """Stochastic Oscillator"""
        if len(close) < period:
            return {'k': 50, 'd': 50}
        
        lowest_low = min(low[-period:])
        highest_high = max(high[-period:])
        
        if highest_high == lowest_low:
            k = 50
        else:
            k = ((close[-1] - lowest_low) / (highest_high - lowest_low)) * 100
        
        return {'k': round(k, 2), 'd': round(k, 2)}  # Simplified, d would be SMA of k


class LSTMPredictor:
    """
    LSTM-based Price Prediction Model
    Uses simulated predictions for demo (real implementation would use TensorFlow/PyTorch)
    """
    
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.model_confidence = random.uniform(0.65, 0.85)
        self.last_trained = datetime.now()
    
    def predict_price(self, historical_prices: List[float], periods_ahead: int = 24) -> Dict:
        """
        Predict future prices using LSTM-like pattern analysis
        Returns predictions with confidence intervals
        """
        if len(historical_prices) < 10:
            return {'error': 'Insufficient data for prediction'}
        
        current_price = historical_prices[-1]
        
        # Analyze recent trend
        short_trend = (historical_prices[-1] - historical_prices[-5]) / historical_prices[-5] if len(historical_prices) >= 5 else 0
        medium_trend = (historical_prices[-1] - historical_prices[-10]) / historical_prices[-10] if len(historical_prices) >= 10 else 0
        
        # Calculate volatility
        volatility = np.std(historical_prices[-20:]) / np.mean(historical_prices[-20:]) if len(historical_prices) >= 20 else 0.02
        
        # Generate predictions
        predictions = []
        confidence_intervals = []
        
        for i in range(1, periods_ahead + 1):
            # Combine trend analysis with mean reversion
            trend_factor = (short_trend * 0.6 + medium_trend * 0.4) / periods_ahead
            noise = random.gauss(0, volatility * 0.3)
            
            predicted_change = trend_factor + noise
            predicted_price = current_price * (1 + predicted_change * i * 0.1)
            
            # Calculate confidence interval
            ci_width = volatility * math.sqrt(i) * current_price
            
            predictions.append({
                'period': i,
                'predicted_price': round(predicted_price, 2),
                'lower_bound': round(predicted_price - ci_width, 2),
                'upper_bound': round(predicted_price + ci_width, 2)
            })
        
        # Determine overall direction
        final_prediction = predictions[-1]['predicted_price']
        direction = 'bullish' if final_prediction > current_price else 'bearish'
        price_change_pct = ((final_prediction - current_price) / current_price) * 100
        
        return {
            'symbol': self.symbol,
            'current_price': current_price,
            'predictions': predictions,
            'direction': direction,
            'predicted_change_percent': round(price_change_pct, 2),
            'confidence': round(self.model_confidence * 100, 1),
            'model_accuracy': round(random.uniform(72, 89), 1),
            'last_trained': self.last_trained.isoformat(),
            'periods_ahead': periods_ahead
        }
    
    def get_trading_signal(self, historical_prices: List[float]) -> Dict:
        """Generate buy/sell/hold signal based on LSTM prediction"""
        prediction = self.predict_price(historical_prices, periods_ahead=6)
        
        if 'error' in prediction:
            return {'signal': 'hold', 'reason': prediction['error'], 'confidence': 0}
        
        change_pct = prediction['predicted_change_percent']
        confidence = prediction['confidence']
        
        if change_pct > 2 and confidence > 70:
            signal = 'strong_buy'
            reason = f"Strong bullish prediction: +{change_pct}% expected"
        elif change_pct > 0.5:
            signal = 'buy'
            reason = f"Moderate bullish prediction: +{change_pct}% expected"
        elif change_pct < -2 and confidence > 70:
            signal = 'strong_sell'
            reason = f"Strong bearish prediction: {change_pct}% expected"
        elif change_pct < -0.5:
            signal = 'sell'
            reason = f"Moderate bearish prediction: {change_pct}% expected"
        else:
            signal = 'hold'
            reason = "Price expected to remain stable"
        
        return {
            'signal': signal,
            'reason': reason,
            'confidence': confidence,
            'predicted_change': change_pct,
            'analysis': prediction
        }


class RiskAssessment:
    """Portfolio and Trade Risk Assessment"""
    
    @staticmethod
    def calculate_var(returns: List[float], confidence: float = 0.95) -> float:
        """Value at Risk calculation"""
        if len(returns) < 10:
            return 0.05  # Default 5% VaR
        
        sorted_returns = sorted(returns)
        index = int((1 - confidence) * len(sorted_returns))
        return round(abs(sorted_returns[index]) * 100, 2)
    
    @staticmethod
    def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Sharpe Ratio calculation"""
        if len(returns) < 2:
            return 0
        
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0
        
        sharpe = (mean_return - risk_free_rate/252) / std_return * math.sqrt(252)
        return round(sharpe, 2)
    
    @staticmethod
    def calculate_max_drawdown(equity_curve: List[float]) -> float:
        """Maximum Drawdown calculation"""
        if len(equity_curve) < 2:
            return 0
        
        peak = equity_curve[0]
        max_dd = 0
        
        for value in equity_curve:
            if value > peak:
                peak = value
            dd = (peak - value) / peak
            if dd > max_dd:
                max_dd = dd
        
        return round(max_dd * 100, 2)
    
    @staticmethod
    def assess_trade_risk(
        entry_price: float,
        position_size: float,
        portfolio_value: float,
        volatility: float
    ) -> Dict:
        """Assess risk of a potential trade"""
        position_value = entry_price * position_size
        position_pct = (position_value / portfolio_value) * 100
        
        # Risk metrics
        max_loss_1std = position_value * volatility
        max_loss_2std = position_value * volatility * 2
        
        # Risk score (1-10, higher is riskier)
        risk_score = min(10, max(1, position_pct / 5 + volatility * 20))
        
        # Recommended stop loss
        recommended_stop_loss = entry_price * (1 - volatility * 1.5)
        recommended_take_profit = entry_price * (1 + volatility * 2)
        
        risk_level = 'low' if risk_score < 4 else 'medium' if risk_score < 7 else 'high'
        
        return {
            'risk_score': round(risk_score, 1),
            'risk_level': risk_level,
            'position_percentage': round(position_pct, 2),
            'max_loss_1std': round(max_loss_1std, 2),
            'max_loss_2std': round(max_loss_2std, 2),
            'recommended_stop_loss': round(recommended_stop_loss, 2),
            'recommended_take_profit': round(recommended_take_profit, 2),
            'recommendation': 'Proceed with caution' if risk_score > 6 else 'Trade appears reasonable'
        }
    
    @staticmethod
    def portfolio_risk_metrics(positions: List[Dict], historical_data: Dict) -> Dict:
        """Calculate overall portfolio risk metrics"""
        if not positions:
            return {
                'total_risk_score': 0,
                'diversification_score': 0,
                'concentration_risk': 'N/A',
                'var_95': 0,
                'expected_volatility': 0
            }
        
        total_value = sum(p.get('value', 0) for p in positions)
        
        # Concentration risk
        max_position_pct = max((p.get('value', 0) / total_value * 100) for p in positions) if total_value > 0 else 0
        
        # Diversification score (1-10)
        diversification = min(10, len(positions) * 2)
        
        # Simulated volatility
        portfolio_volatility = random.uniform(0.15, 0.35)
        
        concentration_level = 'high' if max_position_pct > 50 else 'medium' if max_position_pct > 25 else 'low'
        
        return {
            'total_risk_score': round(random.uniform(4, 7), 1),
            'diversification_score': diversification,
            'concentration_risk': concentration_level,
            'max_position_percentage': round(max_position_pct, 2),
            'var_95': round(portfolio_volatility * 1.65 * 100, 2),
            'expected_volatility': round(portfolio_volatility * 100, 2),
            'beta': round(random.uniform(0.8, 1.3), 2),
            'correlation_to_market': round(random.uniform(0.6, 0.9), 2)
        }


class PortfolioOptimizer:
    """Portfolio Optimization using Modern Portfolio Theory concepts"""
    
    @staticmethod
    def optimize_allocation(
        assets: List[Dict],
        risk_tolerance: str = 'medium',
        target_return: Optional[float] = None
    ) -> Dict:
        """Optimize portfolio allocation based on risk tolerance"""
        
        if not assets:
            return {'error': 'No assets provided'}
        
        # Risk tolerance multipliers
        risk_multipliers = {
            'conservative': 0.3,
            'medium': 0.6,
            'aggressive': 0.9
        }
        
        risk_mult = risk_multipliers.get(risk_tolerance, 0.6)
        
        # Calculate optimal weights (simplified mean-variance optimization)
        optimal_weights = []
        total_weight = 0
        
        for asset in assets:
            # Higher weight for lower volatility assets in conservative portfolios
            volatility = asset.get('volatility', random.uniform(0.2, 0.5))
            expected_return = asset.get('expected_return', random.uniform(-0.1, 0.3))
            
            # Sharpe-like scoring
            score = expected_return / (volatility + 0.01)
            adjusted_score = score * risk_mult if score > 0 else score * (1 - risk_mult)
            
            weight = max(0.05, min(0.4, (adjusted_score + 1) / 4))
            optimal_weights.append({
                'symbol': asset.get('symbol'),
                'weight': weight,
                'expected_return': round(expected_return * 100, 2),
                'volatility': round(volatility * 100, 2)
            })
            total_weight += weight
        
        # Normalize weights to sum to 1
        for w in optimal_weights:
            w['weight'] = round(w['weight'] / total_weight, 4)
        
        # Calculate portfolio metrics
        portfolio_return = sum(w['weight'] * w['expected_return'] for w in optimal_weights)
        portfolio_volatility = sum(w['weight'] * w['volatility'] for w in optimal_weights) * 0.7  # Diversification benefit
        
        return {
            'optimal_allocation': optimal_weights,
            'expected_portfolio_return': round(portfolio_return, 2),
            'expected_portfolio_volatility': round(portfolio_volatility, 2),
            'sharpe_ratio': round(portfolio_return / (portfolio_volatility + 0.01), 2),
            'risk_tolerance': risk_tolerance,
            'rebalancing_needed': random.choice([True, False]),
            'recommendation': f"Portfolio optimized for {risk_tolerance} risk tolerance"
        }
    
    @staticmethod
    def suggest_rebalancing(current_allocation: List[Dict], target_allocation: List[Dict]) -> List[Dict]:
        """Suggest trades to rebalance portfolio"""
        suggestions = []
        
        current_dict = {a['symbol']: a['weight'] for a in current_allocation}
        target_dict = {a['symbol']: a['weight'] for a in target_allocation}
        
        all_symbols = set(current_dict.keys()) | set(target_dict.keys())
        
        for symbol in all_symbols:
            current_weight = current_dict.get(symbol, 0)
            target_weight = target_dict.get(symbol, 0)
            diff = target_weight - current_weight
            
            if abs(diff) > 0.01:  # Only suggest if difference > 1%
                action = 'buy' if diff > 0 else 'sell'
                suggestions.append({
                    'symbol': symbol,
                    'action': action,
                    'current_weight': round(current_weight * 100, 2),
                    'target_weight': round(target_weight * 100, 2),
                    'change_percentage': round(diff * 100, 2)
                })
        
        return suggestions


class TradingSignalGenerator:
    """Generate trading signals using multiple AI/ML models"""
    
    def __init__(self):
        self.indicators = TechnicalIndicators()
    
    def generate_comprehensive_signal(self, symbol: str, price_data: Dict) -> Dict:
        """Generate comprehensive trading signal using multiple indicators"""
        
        prices = price_data.get('close', [])
        high = price_data.get('high', prices)
        low = price_data.get('low', prices)
        
        if len(prices) < 20:
            return {'error': 'Insufficient price data', 'signal': 'hold'}
        
        # Calculate all indicators
        rsi = self.indicators.calculate_rsi(prices)
        macd = self.indicators.calculate_macd(prices)
        bollinger = self.indicators.calculate_bollinger_bands(prices)
        stochastic = self.indicators.calculate_stochastic(high, low, prices)
        sma_20 = self.indicators.calculate_sma(prices, 20)[-1]
        sma_50 = self.indicators.calculate_sma(prices, 50)[-1] if len(prices) >= 50 else sma_20
        ema_12 = self.indicators.calculate_ema(prices, 12)[-1]
        
        current_price = prices[-1]
        
        # Score each indicator (-1 to 1)
        scores = {
            'rsi': self._score_rsi(rsi),
            'macd': self._score_macd(macd),
            'bollinger': self._score_bollinger(current_price, bollinger),
            'stochastic': self._score_stochastic(stochastic),
            'moving_averages': self._score_ma(current_price, sma_20, sma_50, ema_12)
        }
        
        # LSTM prediction score
        lstm = LSTMPredictor(symbol)
        lstm_signal = lstm.get_trading_signal(prices)
        scores['lstm_prediction'] = self._score_lstm_signal(lstm_signal['signal'])
        
        # Calculate weighted average score
        weights = {
            'rsi': 0.15,
            'macd': 0.2,
            'bollinger': 0.1,
            'stochastic': 0.1,
            'moving_averages': 0.2,
            'lstm_prediction': 0.25
        }
        
        total_score = sum(scores[k] * weights[k] for k in scores)
        
        # Determine signal and confidence
        if total_score > 0.5:
            signal = 'strong_buy'
            confidence = min(95, 70 + total_score * 25)
        elif total_score > 0.2:
            signal = 'buy'
            confidence = min(85, 60 + total_score * 30)
        elif total_score < -0.5:
            signal = 'strong_sell'
            confidence = min(95, 70 + abs(total_score) * 25)
        elif total_score < -0.2:
            signal = 'sell'
            confidence = min(85, 60 + abs(total_score) * 30)
        else:
            signal = 'hold'
            confidence = 50 + abs(total_score) * 20
        
        return {
            'symbol': symbol,
            'signal': signal,
            'confidence': round(confidence, 1),
            'overall_score': round(total_score, 3),
            'indicators': {
                'rsi': {'value': rsi, 'signal': 'oversold' if rsi < 30 else 'overbought' if rsi > 70 else 'neutral'},
                'macd': macd,
                'bollinger_bands': bollinger,
                'stochastic': stochastic,
                'sma_20': round(sma_20, 2),
                'sma_50': round(sma_50, 2),
                'ema_12': round(ema_12, 2)
            },
            'indicator_scores': {k: round(v, 2) for k, v in scores.items()},
            'current_price': current_price,
            'lstm_analysis': lstm_signal,
            'timestamp': datetime.now().isoformat()
        }
    
    def _score_rsi(self, rsi: float) -> float:
        if rsi < 30: return 0.8  # Oversold - bullish
        if rsi < 40: return 0.4
        if rsi > 70: return -0.8  # Overbought - bearish
        if rsi > 60: return -0.4
        return 0
    
    def _score_macd(self, macd: Dict) -> float:
        histogram = macd['histogram']
        if histogram > 0.5: return 0.8
        if histogram > 0: return 0.3
        if histogram < -0.5: return -0.8
        if histogram < 0: return -0.3
        return 0
    
    def _score_bollinger(self, price: float, bb: Dict) -> float:
        range_pct = (price - bb['lower']) / (bb['upper'] - bb['lower']) if bb['upper'] != bb['lower'] else 0.5
        if range_pct < 0.2: return 0.7  # Near lower band - bullish
        if range_pct > 0.8: return -0.7  # Near upper band - bearish
        return 0
    
    def _score_stochastic(self, stoch: Dict) -> float:
        k = stoch['k']
        if k < 20: return 0.7
        if k > 80: return -0.7
        return 0
    
    def _score_ma(self, price: float, sma20: float, sma50: float, ema12: float) -> float:
        score = 0
        if price > sma20: score += 0.3
        else: score -= 0.3
        if price > sma50: score += 0.3
        else: score -= 0.3
        if sma20 > sma50: score += 0.4  # Golden cross pattern
        else: score -= 0.4
        return max(-1, min(1, score))
    
    def _score_lstm_signal(self, signal: str) -> float:
        signal_scores = {
            'strong_buy': 1.0,
            'buy': 0.5,
            'hold': 0,
            'sell': -0.5,
            'strong_sell': -1.0
        }
        return signal_scores.get(signal, 0)


class SentimentAnalyzer:
    """Analyze market sentiment from various sources"""
    
    @staticmethod
    def get_market_sentiment(symbol: str) -> Dict:
        """Get overall market sentiment for an asset"""
        
        # Simulated sentiment data (real implementation would use APIs)
        sentiment_score = random.uniform(-1, 1)
        
        # Simulate news sentiment
        news_sentiment = random.uniform(-1, 1)
        
        # Simulate social media sentiment
        social_sentiment = random.uniform(-1, 1)
        
        # Simulate trading volume sentiment
        volume_sentiment = random.uniform(-0.5, 0.5)
        
        overall = (sentiment_score * 0.3 + news_sentiment * 0.3 + 
                   social_sentiment * 0.25 + volume_sentiment * 0.15)
        
        if overall > 0.3:
            mood = 'bullish'
        elif overall < -0.3:
            mood = 'bearish'
        else:
            mood = 'neutral'
        
        return {
            'symbol': symbol,
            'overall_sentiment': round(overall, 2),
            'mood': mood,
            'components': {
                'market_sentiment': round(sentiment_score, 2),
                'news_sentiment': round(news_sentiment, 2),
                'social_sentiment': round(social_sentiment, 2),
                'volume_sentiment': round(volume_sentiment, 2)
            },
            'fear_greed_index': random.randint(20, 80),
            'trending_topics': [
                f'{symbol} price prediction',
                f'{symbol} technical analysis',
                'crypto market outlook'
            ],
            'news_impact': random.choice(['positive', 'negative', 'neutral']),
            'timestamp': datetime.now().isoformat()
        }


# Export all classes
__all__ = [
    'TechnicalIndicators',
    'LSTMPredictor', 
    'RiskAssessment',
    'PortfolioOptimizer',
    'TradingSignalGenerator',
    'SentimentAnalyzer'
]
