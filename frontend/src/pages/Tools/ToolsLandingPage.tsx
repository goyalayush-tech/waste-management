import React from 'react';
import { Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import styles from './ToolsLandingPage.module.css';

const { Title, Paragraph } = Typography;

const ToolsLandingPage: React.FC = () => {
  return (
    <div>
      <Title level={2}>All Tools</Title>
      <Paragraph>
        This is the landing page for all available tools. Please select a tool to get started.
      </Paragraph>
      <div className={styles.toolGrid}>
        <Card title="Waste Analysis" className={styles.toolCard}>
          <p>Analyze waste composition and characteristics.</p>
          <Link to="/tools/waste-analysis">Go to Waste Analysis</Link>
        </Card>
        <Card title="Contamination Detection" className={styles.toolCard}>
          <p>Detect contaminants in waste streams.</p>
          <Link to="/tools/contamination-detection">Go to Contamination Detection</Link>
        </Card>
        <Card title="Dashboard" className={styles.toolCard}>
          <p>View key metrics and system status.</p>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Card>
        <Card title="EPR Document Upload" className={styles.toolCard}>
          <p>Upload invoices and weighbridge slips for OCR and compliance.</p>
          <Link to="/epr/upload">Go to EPR Upload</Link>
        </Card>
      </div>
    </div>
  );
};

export default ToolsLandingPage;
