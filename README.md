# Delhi Waste Management System

A comprehensive waste management system for Delhi that tracks waste from production to disposal, featuring real-time monitoring, AI/ML predictions, and blockchain-based transparency.

## 🚀 Features

- **Real-time Waste Tracking**: Monitor waste bins across Delhi with live fill levels
- **Multi-type Waste Management**: Track organic, plastic, paper, metal, and e-waste
- **AI-Powered Predictions**: ML models for waste generation forecasting and route optimization
- **Blockchain Integration**: Immutable waste tracking records on Polygon Mumbai Testnet
- **Interactive Dashboard**: Comprehensive analytics and monitoring interface
- **User Management**: Role-based access for citizens, businesses, collectors, and admins
- **Alert System**: Automated notifications for bin fullness and collection needs
- **Route Optimization**: Efficient collection routes based on real-time data

## 🛠️ Tech Stack

- **Backend**: Flask/Python with PostgreSQL
- **Frontend**: React with TypeScript
- **Blockchain**: Polygon Mumbai Testnet
- **ML/AI**: TensorFlow, Scikit-learn
- **Maps**: OpenStreetMap
- **Deployment**: Render (backend), Vercel (frontend)
- **Real-time**: WebSockets for live updates

## 📁 Project Structure

```
waste-management-system/
├── backend/              # Flask API backend
├── frontend/             # React TypeScript frontend
├── iot-simulator/        # IoT device simulation
├── ml-models/            # Machine learning models
├── blockchain/           # Smart contracts
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 13+
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
flask db init
flask db migrate
flask db upgrade
flask run
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm start
```

### IoT Simulator

```bash
cd iot-simulator
python simulator.py
```

## 📊 Database Schema

- **Users**: Citizens, businesses, collectors, admins
- **WasteBins**: Bin locations, capacity, current levels
- **WasteEntries**: Waste disposal records
- **Collections**: Collection routes and history
- **Zones**: Delhi zone management
- **Vehicles**: Waste collection vehicles

## 🌍 Delhi Zones

The system covers 5 major zones of Delhi:
1. North Delhi
2. South Delhi
3. East Delhi
4. West Delhi
5. Central Delhi

## 📈 API Documentation

API documentation available at: `http://localhost:5000/api/docs`

## 🚀 Deployment

### Backend (Render)
1. Push to GitHub
2. Connect to Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Configure build settings
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Delhi Municipal Corporation for zone data
- OpenStreetMap contributors
- Polygon for blockchain infrastructure