import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header style={{ padding: '20px', textAlign: 'center', backgroundColor: '#1f1f1f' }}>
        <h1 style={{ color: '#00b96b', margin: 0 }}>
          🌱 Advanced Waste Management System
        </h1>
        <p style={{ color: '#8c8c8c', margin: '10px 0' }}>
          AI-Powered • IoT-Connected • Quantum Enhanced
        </p>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: '#1f1f1f',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #303030'
          }}>
            <h3 style={{ color: '#1890ff', marginTop: 0 }}>🔬 Multi-Modal Analysis</h3>
            <p style={{ color: '#d9d9d9' }}>
              Advanced AI-powered waste classification using visual, spectral, weight, and chemical sensors
              achieving 98%+ accuracy through sensor fusion.
            </p>
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>✅ System Active</div>
          </div>

          <div style={{
            background: '#1f1f1f',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #303030'
          }}>
            <h3 style={{ color: '#52c41a', marginTop: 0 }}>🛡️ Contamination Detection</h3>
            <p style={{ color: '#d9d9d9' }}>
              Real-time contamination detection in recyclable streams with automated flagging
              and AI-powered remediation suggestions.
            </p>
            <div style={{ color: '#faad14', fontWeight: 'bold' }}>⚠️ 3 Batches Flagged</div>
          </div>

          <div style={{
            background: '#1f1f1f',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #303030'
          }}>
            <h3 style={{ color: '#faad14', marginTop: 0 }}>🤖 Autonomous Processing</h3>
            <p style={{ color: '#d9d9d9' }}>
              AI-controlled equipment with reinforcement learning agents optimizing
              processing parameters in real-time.
            </p>
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>🟢 12/15 Units Active</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            background: '#1f1f1f',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #303030'
          }}>
            <h3 style={{ color: '#722ed1', marginTop: 0 }}>📊 Analytics Dashboard</h3>
            <p style={{ color: '#d9d9d9' }}>
              Comprehensive waste processing analytics with detailed reporting
              of environmental impact and recycling achievements.
            </p>
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>📊 2,847 Reports Generated</div>
          </div>

          <div style={{
            background: '#1f1f1f',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #303030'
          }}>
            <h3 style={{ color: '#13c2c2', marginTop: 0 }}>💰 Cost Optimization</h3>
            <p style={{ color: '#d9d9d9' }}>
              Advanced cost analysis tools, resource allocation optimization,
              and predictive maintenance scheduling.
            </p>
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>💎 $2.4M Savings</div>
          </div>

          <div style={{
            background: '#1f1f1f',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #303030'
          }}>
            <h3 style={{ color: '#eb2f96', marginTop: 0 }}>🌐 Metaverse Integration</h3>
            <p style={{ color: '#d9d9d9' }}>
              Virtual waste management facilities with gamified experiences
              and educational content in immersive 3D environments.
            </p>
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>👥 1,234 Active Users</div>
          </div>
        </div>

        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: '#0f1419',
          borderRadius: '8px',
          border: '1px solid #303030'
        }}>
          <h2 style={{ color: '#00b96b', textAlign: 'center' }}>🚀 System Status</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>94.2%</div>
              <div style={{ color: '#8c8c8c' }}>System Efficiency</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>1,247 kg</div>
              <div style={{ color: '#8c8c8c' }}>Waste Processed Today</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>2.3%</div>
              <div style={{ color: '#8c8c8c' }}>Contamination Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>156.7 tons</div>
              <div style={{ color: '#8c8c8c' }}>CO₂ Credits Generated</div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #1f1f1f 0%, #0f1419 100%)',
          borderRadius: '8px',
          border: '1px solid #303030'
        }}>
          <h3 style={{ color: '#00b96b' }}>🔧 Installation Instructions</h3>
          <p style={{ color: '#d9d9d9', marginBottom: '20px' }}>
            To see the full Advanced Waste Management System with all features:
          </p>
          <div style={{
            background: '#000',
            padding: '15px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            textAlign: 'left',
            color: '#00ff00'
          }}>
            <div>cd frontend</div>
            <div>npm install</div>
            <div>npm run dev</div>
          </div>
          <p style={{ color: '#8c8c8c', marginTop: '15px', fontSize: '14px' }}>
            This will start the development server with the complete UI including contamination detection,
            waste analysis, analytics dashboard, cost optimization, and all advanced features.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;