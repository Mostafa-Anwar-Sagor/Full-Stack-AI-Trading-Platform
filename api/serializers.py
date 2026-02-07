"""
API Serializers for Trading Platform
"""
from rest_framework import serializers
from .models import Portfolio, Asset, Position, Trade, TradingAgent, BacktestResult, PriceHistory, Alert


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'


class PositionSerializer(serializers.ModelSerializer):
    asset = AssetSerializer(read_only=True)
    current_value = serializers.FloatField(read_only=True)
    profit_loss = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Position
        fields = '__all__'


class TradeSerializer(serializers.ModelSerializer):
    asset = AssetSerializer(read_only=True)
    
    class Meta:
        model = Trade
        fields = '__all__'


class PortfolioSerializer(serializers.ModelSerializer):
    positions = PositionSerializer(many=True, read_only=True)
    total_return = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Portfolio
        fields = '__all__'


class TradingAgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradingAgent
        fields = '__all__'


class BacktestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = BacktestResult
        fields = '__all__'


class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = '__all__'


class AlertSerializer(serializers.ModelSerializer):
    asset = AssetSerializer(read_only=True)
    
    class Meta:
        model = Alert
        fields = '__all__'


class DashboardSerializer(serializers.Serializer):
    """Dashboard summary data"""
    total_portfolio_value = serializers.FloatField()
    total_return = serializers.FloatField()
    total_return_percentage = serializers.FloatField()
    active_agents = serializers.IntegerField()
    total_trades_today = serializers.IntegerField()
    win_rate = serializers.FloatField()
    top_performers = AssetSerializer(many=True)
    recent_trades = TradeSerializer(many=True)
