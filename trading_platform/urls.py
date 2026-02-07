"""
URL configuration for AI Trading Platform.
Complete routing with authentication and all pages.
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.views.generic import TemplateView
from api import page_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    # Public pages
    path('', page_views.home_page, name='home'),
    path('features/', page_views.features_page, name='features'),
    path('pricing/', page_views.pricing_page, name='pricing'),
    path('about/', page_views.about_page, name='about'),
    
    # Authentication
    path('login/', page_views.login_page, name='login'),
    path('register/', page_views.register_page, name='register'),
    path('logout/', page_views.logout_view, name='logout'),
    
    # Dashboard & Trading (protected)
    path('dashboard/', page_views.dashboard_page, name='dashboard'),
    path('portfolio/', page_views.portfolio_page, name='portfolio'),
    path('trading/', page_views.trading_page, name='trading'),
    path('market/', page_views.market_page, name='market'),
    path('agents/', page_views.agents_page, name='agents'),
    path('predictions/', page_views.predictions_page, name='predictions'),
    path('backtest/', page_views.backtest_page, name='backtest'),
    path('risk/', page_views.risk_page, name='risk'),
    path('settings/', page_views.settings_page, name='settings'),
]
