"""
Database Models for AI Trading Platform
"""
from django.db import models
from django.contrib.auth.models import User
import uuid


class Portfolio(models.Model):
    """User's trading portfolio"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolios', null=True, blank=True)
    name = models.CharField(max_length=100, default='Main Portfolio')
    initial_balance = models.DecimalField(max_digits=15, decimal_places=2, default=10000.00)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=10000.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_paper_trading = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - ${self.current_balance}"
    
    @property
    def total_return(self):
        if self.initial_balance == 0:
            return 0
        return ((self.current_balance - self.initial_balance) / self.initial_balance) * 100


class Asset(models.Model):
    """Tradeable assets"""
    symbol = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    asset_type = models.CharField(max_length=20, choices=[
        ('crypto', 'Cryptocurrency'),
        ('stock', 'Stock'),
        ('forex', 'Forex'),
    ], default='crypto')
    current_price = models.DecimalField(max_digits=15, decimal_places=8, default=0)
    price_change_24h = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    volume_24h = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.symbol} - ${self.current_price}"


class Position(models.Model):
    """Current holdings in portfolio"""
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='positions')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=20, decimal_places=8)
    average_buy_price = models.DecimalField(max_digits=15, decimal_places=8)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['portfolio', 'asset']
    
    def __str__(self):
        return f"{self.asset.symbol}: {self.quantity}"
    
    @property
    def current_value(self):
        return float(self.quantity) * float(self.asset.current_price)
    
    @property
    def profit_loss(self):
        return self.current_value - (float(self.quantity) * float(self.average_buy_price))


class Trade(models.Model):
    """Trade execution history"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='trades')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    trade_type = models.CharField(max_length=10, choices=[
        ('buy', 'Buy'),
        ('sell', 'Sell'),
    ])
    quantity = models.DecimalField(max_digits=20, decimal_places=8)
    price = models.DecimalField(max_digits=15, decimal_places=8)
    total_value = models.DecimalField(max_digits=20, decimal_places=2)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    executed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('executed', 'Executed'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ], default='executed')
    
    class Meta:
        ordering = ['-executed_at']
    
    def __str__(self):
        return f"{self.trade_type.upper()} {self.quantity} {self.asset.symbol} @ ${self.price}"


class TradingAgent(models.Model):
    """RL Trading Agent configurations"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    agent_type = models.CharField(max_length=20, choices=[
        ('ppo', 'PPO'),
        ('dqn', 'DQN'),
        ('a3c', 'A3C'),
        ('lstm', 'LSTM'),
    ])
    status = models.CharField(max_length=20, choices=[
        ('idle', 'Idle'),
        ('training', 'Training'),
        ('running', 'Running'),
        ('stopped', 'Stopped'),
    ], default='idle')
    portfolio = models.ForeignKey(Portfolio, on_delete=models.SET_NULL, null=True, blank=True)
    trading_pair = models.CharField(max_length=20, default='BTC/USD')
    total_trades = models.IntegerField(default=0)
    win_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_action_at = models.DateTimeField(null=True, blank=True)
    config = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.name} ({self.agent_type.upper()})"


class BacktestResult(models.Model):
    """Backtesting results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(TradingAgent, on_delete=models.CASCADE, related_name='backtests')
    start_date = models.DateField()
    end_date = models.DateField()
    initial_capital = models.DecimalField(max_digits=15, decimal_places=2)
    final_capital = models.DecimalField(max_digits=15, decimal_places=2)
    total_return = models.DecimalField(max_digits=10, decimal_places=2)
    sharpe_ratio = models.DecimalField(max_digits=6, decimal_places=3, null=True)
    max_drawdown = models.DecimalField(max_digits=6, decimal_places=2, null=True)
    win_rate = models.DecimalField(max_digits=5, decimal_places=2)
    total_trades = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class PriceHistory(models.Model):
    """Historical price data"""
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='price_history')
    timestamp = models.DateTimeField()
    open_price = models.DecimalField(max_digits=15, decimal_places=8)
    high_price = models.DecimalField(max_digits=15, decimal_places=8)
    low_price = models.DecimalField(max_digits=15, decimal_places=8)
    close_price = models.DecimalField(max_digits=15, decimal_places=8)
    volume = models.DecimalField(max_digits=20, decimal_places=2)
    
    class Meta:
        ordering = ['-timestamp']
        unique_together = ['asset', 'timestamp']


class Alert(models.Model):
    """Price and trading alerts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts', null=True, blank=True)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    alert_type = models.CharField(max_length=20, choices=[
        ('price_above', 'Price Above'),
        ('price_below', 'Price Below'),
        ('percent_change', 'Percent Change'),
    ])
    target_value = models.DecimalField(max_digits=15, decimal_places=8)
    is_active = models.BooleanField(default=True)
    triggered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    triggered_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.alert_type}: {self.asset.symbol} @ ${self.target_value}"
