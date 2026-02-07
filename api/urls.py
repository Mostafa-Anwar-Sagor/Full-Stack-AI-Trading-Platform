"""
API URL Configuration - Full AI Trading Platform
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'portfolios', views.PortfolioViewSet)
router.register(r'assets', views.AssetViewSet)
router.register(r'positions', views.PositionViewSet)
router.register(r'trades', views.TradeViewSet)
router.register(r'agents', views.TradingAgentViewSet)
router.register(r'backtests', views.BacktestResultViewSet)
router.register(r'alerts', views.AlertViewSet)

urlpatterns = [
    path('', views.api_overview, name='api-overview'),
    path('', include(router.urls)),
    
    # Dashboard & Market Data
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('market-data/', views.MarketDataView.as_view(), name='market-data'),
    
    # AI Features
    path('ai-analysis/', views.AIAnalysisView.as_view(), name='ai-analysis'),
    path('predictions/', views.PredictionView.as_view(), name='predictions'),
    path('risk-analysis/', views.RiskAnalysisView.as_view(), name='risk-analysis'),
    path('portfolio-optimization/', views.PortfolioOptimizationView.as_view(), name='portfolio-optimization'),
    
    # Trading
    path('execute-trade/', views.TradeExecutionView.as_view(), name='execute-trade'),
    path('run-backtest/', views.BacktestView.as_view(), name='run-backtest'),
    path('train-agent/', views.AgentTrainingView.as_view(), name='train-agent'),
    
    # Health
    path('health/', views.health_check, name='health-check'),
]
