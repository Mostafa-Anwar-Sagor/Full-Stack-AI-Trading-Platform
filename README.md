# 📈 AI-Powered Full-Stack Algorithmic Trading Platform

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![Django](https://img.shields.io/badge/Django-5.0+-green.svg)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.0+-orange.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)
![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)

*Developed by Mostafa Anwar*

An advanced full-stack trading platform powered by Reinforcement Learning and Deep Learning algorithms. Train intelligent agents to make profitable trading decisions using state-of-the-art AI techniques including LSTM, Transformers, and Deep Q-Networks.

## 🎯 Key Features

- **Reinforcement Learning Trading Agents** - Train RL agents using PPO, A3C, and DQN algorithms
- **Real-Time Market Data Integration** - Live data feeds from multiple exchanges
- **Advanced Technical Indicators** - 50+ built-in indicators with custom strategy builder
- **Portfolio Management** - Multi-asset portfolio optimization with risk management
- **Backtesting Engine** - Test strategies on historical data with realistic simulation
- **Paper Trading** - Practice with virtual money before real deployment
- **Predictive Analytics** - LSTM & Transformer models for price prediction
- **Risk Assessment** - Real-time risk metrics and stop-loss automation
- **Beautiful Dashboard** - Modern UI with real-time charts and analytics


## 🚀 Installation

### Prerequisites
- Python 3.12+
- PostgreSQL or SQLite
- Redis (for real-time features)

### Quick Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/AI-Trading-Platform.git
cd AI-Trading-Platform

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

## 📊 Technologies Used

- **Backend**: Python, Django, Django REST Framework
- **AI/ML**: TensorFlow, PyTorch, Ray RLlib, Stable-Baselines3
- **Data Processing**: Pandas, NumPy, TA-Lib
- **Real-Time**: WebSockets, Redis, Celery
- **Database**: PostgreSQL / SQLite
- **Visualization**: Plotly, Chart.js, D3.js
- **APIs**: Binance API, Alpha Vantage, Yahoo Finance

## 🎓 Model Architecture

The platform uses multiple AI models working together:

1. **LSTM Networks** - Time series prediction for price forecasting
2. **Transformer Models** - Attention-based models for market trend analysis
3. **Deep Q-Networks (DQN)** - Reinforcement learning for trade execution
4. **PPO Agents** - Proximal Policy Optimization for portfolio management
5. **Ensemble Methods** - Combining multiple models for robust predictions

## 📈 Usage

### Training a Trading Agent

```python
from tensortrade import TradingEnvironment
from agents import PPOAgent

# Create environment
env = TradingEnvironment(exchange='binance', pair='BTC/USDT')

# Initialize agent
agent = PPOAgent(env)

# Train
agent.train(episodes=1000)

# Evaluate
results = agent.evaluate(test_data)
```

### Running Backtests

```python
from backtesting import Backtest
from strategies import LSTMStrategy

backtest = Backtest(
    strategy=LSTMStrategy(),
    data=historical_data,
    initial_capital=10000
)

results = backtest.run()
print(f"Total Return: {results['return']:.2%}")
```

## 📁 Project Structure

```
Trading-Platform/
├── agents/              # RL trading agents
├── strategies/          # Trading strategies
├── data/                # Data feeds and processors
├── models/              # Trained AI models
├── backtesting/         # Backtesting engine
├── api/                 # REST API
├── frontend/            # Dashboard UI
├── docs/                # Documentation
└── tests/               # Unit tests
```

## 🔮 Future Enhancements

- [ ] Multi-exchange arbitrage detection
- [ ] Sentiment analysis from social media
- [ ] Advanced order types (options, futures)
- [ ] Mobile app for iOS/Android
- [ ] Automated portfolio rebalancing
- [ ] News event impact analysis

## 📄 License

MIT License - Copyright (c) 2026 Mostafa Anwar

## 👤 Author

**Mostafa Anwar**
- Email: sagorahmed1400@gmail.com
- GitHub: [@Mostafa-Anwar-Sagor](https://github.com/Mostafa-Anwar-Sagor)

---

⭐ **Star this repository if you find it helpful!**

### Training
- [First Training](docs/tutorials/04-training/01-first-training.md) — Train with Ray RLlib
- [Ray RLlib Deep Dive](docs/tutorials/04-training/02-ray-rllib.md) — Configuration options
- [Optuna Optimization](docs/tutorials/04-training/03-optuna.md) — Hyperparameter tuning

### Advanced Topics
- [Overfitting](docs/tutorials/05-advanced/01-overfitting.md) — Detection and prevention
- [Commission Analysis](docs/tutorials/05-advanced/02-commission.md) — Key research findings
- [Walk-Forward Validation](docs/tutorials/05-advanced/03-walk-forward.md) — Proper evaluation

### Additional Resources
- [Experiments Log](docs/EXPERIMENTS.md) — Full research documentation
- [Environment Setup](docs/ENVIRONMENT_SETUP.md) — Detailed installation guide
- [API Reference](https://www.tensortrade.org/en/latest/)

---

## Research Findings

We conducted extensive experiments training PPO agents on BTC/USD. Key results:

| Configuration | Test P&L | vs Buy-and-Hold |
|---------------|----------|-----------------|
| Agent (0% commission) | +$239 | +$594 |
| Agent (0.1% commission) | -$650 | -$295 |
| Buy-and-Hold | -$355 | — |

The agent demonstrates directional prediction capability at zero commission. The primary challenge is trading frequency—commission costs currently exceed prediction profits. See [EXPERIMENTS.md](docs/EXPERIMENTS.md) for methodology and detailed analysis.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TradingEnv                               │
│                                                                 │
│   Observer ──────> Agent ──────> ActionScheme ──────> Portfolio │
│   (features)      (policy)      (BSH/Orders)        (wallets)  │
│       ^                                                  │      │
│       └──────────── RewardScheme <───────────────────────┘      │
│                        (PBR)                                    │
│                                                                 │
│   DataFeed ──────> Exchange ──────> Broker ──────> Trades       │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Purpose | Default |
|-----------|---------|---------|
| ActionScheme | Converts agent output to orders | BSH (Buy/Sell/Hold) |
| RewardScheme | Computes learning signal | PBR (Position-Based Returns) |
| Observer | Generates observations | Windowed features |
| Portfolio | Manages wallets and positions | USD + BTC |
| Exchange | Simulates execution | Configurable commission |

---

## Training Scripts

| Script | Description |
|--------|-------------|
| `examples/training/train_simple.py` | Basic demo with wallet tracking |
| `examples/training/train_ray_long.py` | Distributed training with Ray RLlib |
| `examples/training/train_optuna.py` | Hyperparameter optimization |
| `examples/training/train_best.py` | Best configuration from experiments |

---

## Installation

**Requirements:** Python 3.11 or 3.12

```bash
# Create environment
python3.12 -m venv tensortrade-env
source tensortrade-env/bin/activate  # Windows: tensortrade-env\Scripts\activate

# Install
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .

# Verify
pytest tests/tensortrade/unit -v

# Training dependencies (optional)
pip install -r examples/requirements.txt
```

See [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for platform-specific instructions and troubleshooting.

### Docker

```bash
make run-notebook  # Jupyter
make run-docs      # Documentation
make run-tests     # Test suite
```

---

## Project Structure

```
tensortrade/
├── tensortrade/           # Core library
│   ├── env/              # Trading environments
│   ├── feed/             # Data pipeline
│   ├── oms/              # Order management
│   └── data/             # Data fetching
├── examples/
│   ├── training/         # Training scripts
│   └── notebooks/        # Jupyter tutorials
├── docs/
│   ├── tutorials/        # Learning curriculum
│   └── EXPERIMENTS.md    # Research log
└── tests/
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No stream satisfies selector" | Update to v1.0.4-dev1+ |
| Ray installation fails | Run `pip install --upgrade pip` first |
| TensorFlow CUDA issues | `pip install tensorflow[and-cuda]==2.15.1` |
| NumPy version conflict | `pip install "numpy>=1.26.4,<2.0"` |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
1. Trading frequency reduction (position sizing, holding periods)
2. Commission-aware reward schemes
3. Alternative action spaces

---

## Community

- [Discord](https://discord.gg/ZZ7BGWh)
- [GitHub Issues](https://github.com/notadamking/tensortrade/issues)
- [Documentation](https://www.tensortrade.org/)

---

## License

[Apache 2.0](LICENSE)
