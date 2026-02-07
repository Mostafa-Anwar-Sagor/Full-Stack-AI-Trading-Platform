"""
Page Views for the Trading Platform
Handles all page rendering with authentication
"""
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse


def home_page(request):
    """Landing page - accessible to all users"""
    return render(request, 'pages/home.html')


def features_page(request):
    """Features page"""
    return render(request, 'pages/features.html')


def pricing_page(request):
    """Pricing page"""
    return render(request, 'pages/pricing.html')


def about_page(request):
    """About page"""
    return render(request, 'pages/about.html')


def login_page(request):
    """Login page with form handling"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, 'Welcome back!')
            return redirect('dashboard')
        else:
            messages.error(request, 'Invalid username or password')
    
    return render(request, 'pages/login.html')


def register_page(request):
    """Register page with form handling"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        
        if password != password2:
            messages.error(request, 'Passwords do not match')
        elif User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
        elif User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered')
        else:
            user = User.objects.create_user(username=username, email=email, password=password)
            login(request, user)
            messages.success(request, 'Account created successfully!')
            return redirect('dashboard')
    
    return render(request, 'pages/register.html')


def logout_view(request):
    """Logout user"""
    logout(request)
    messages.info(request, 'You have been logged out')
    return redirect('home')


@login_required
def dashboard_page(request):
    """Main dashboard"""
    return render(request, 'pages/dashboard.html')


@login_required
def portfolio_page(request):
    """Portfolio management"""
    return render(request, 'pages/portfolio.html')


@login_required
def trading_page(request):
    """Trading terminal"""
    return render(request, 'pages/trading.html')


@login_required
def market_page(request):
    """Market overview"""
    return render(request, 'pages/market.html')


@login_required
def agents_page(request):
    """AI Agents management"""
    return render(request, 'pages/agents.html')


@login_required
def predictions_page(request):
    """AI Predictions"""
    return render(request, 'pages/predictions.html')


@login_required
def backtest_page(request):
    """Backtesting"""
    return render(request, 'pages/backtest.html')


@login_required
def risk_page(request):
    """Risk analysis"""
    return render(request, 'pages/risk.html')


@login_required
def settings_page(request):
    """User settings"""
    return render(request, 'pages/settings.html')
