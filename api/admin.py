from django.contrib import admin
from .models import Portfolio, Asset, Position, Trade, TradingAgent, BacktestResult, PriceHistory, Alert

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ['name', 'current_balance', 'initial_balance', 'is_paper_trading', 'created_at']
    list_filter = ['is_paper_trading', 'created_at']
    search_fields = ['name']

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['symbol', 'name', 'asset_type', 'current_price', 'price_change_24h']
    list_filter = ['asset_type']
    search_fields = ['symbol', 'name']

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['portfolio', 'asset', 'quantity', 'average_buy_price']
    list_filter = ['asset']

@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ['asset', 'trade_type', 'quantity', 'price', 'total_value', 'status', 'executed_at']
    list_filter = ['trade_type', 'status', 'executed_at']
    search_fields = ['asset__symbol']

@admin.register(TradingAgent)
class TradingAgentAdmin(admin.ModelAdmin):
    list_display = ['name', 'agent_type', 'status', 'trading_pair', 'win_rate', 'total_profit']
    list_filter = ['agent_type', 'status']
    search_fields = ['name']

@admin.register(BacktestResult)
class BacktestResultAdmin(admin.ModelAdmin):
    list_display = ['agent', 'start_date', 'end_date', 'total_return', 'sharpe_ratio', 'win_rate']
    list_filter = ['created_at']

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['asset', 'alert_type', 'target_value', 'is_active', 'triggered']
    list_filter = ['alert_type', 'is_active', 'triggered']
