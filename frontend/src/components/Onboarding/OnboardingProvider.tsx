import React, { createContext, useContext, useState, useEffect } from 'react';
import { Button, Modal, Card, Space, Typography, Row, Col, Avatar } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  CloseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import GuidedTour, { TourStep } from './GuidedTour';

const { Title, Text, Paragraph } = Typography;

export interface OnboardingContextType {
  isFirstVisit: boolean;
  userRole: 'operator' | 'manager' | 'analyst';
  showWelcome: boolean;
  showTour: boolean;
  completedSteps: string[];
  startTour: (role?: 'operator' | 'manager' | 'analyst') => void;
  skipOnboarding: () => void;
  markStepCompleted: (stepId: string) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [userRole, setUserRole] = useState<'operator' | 'manager' | 'analyst'>('operator');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('waste-management-visited');
    const savedRole = localStorage.getItem('waste-management-user-role') as 'operator' | 'manager' | 'analyst';
    const savedCompletedSteps = JSON.parse(localStorage.getItem('waste-management-completed-steps') || '[]');

    if (!hasVisited) {
      setIsFirstVisit(true);
      setShowWelcome(true);
    }

    if (savedRole) {
      setUserRole(savedRole);
    }

    setCompletedSteps(savedCompletedSteps);
  }, []);

  const getTourSteps = (role: 'operator' | 'manager' | 'analyst'): TourStep[] => {
    const commonSteps: TourStep[] = [
      {
        target: '.desktop-sidebar',
        title: 'Navigation Menu',
        description: 'Use this sidebar to navigate between different tools and sections of the waste management system.',
        placement: 'right',
      },
      {
        target: '.ant-input-affix-wrapper',
        title: 'Global Search',
        description: 'Search for tools, data, documentation, and more across the entire system. Use Ctrl+K for quick access.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="notifications"]',
        title: 'Notifications',
        description: 'Stay updated with real-time alerts, system status changes, and important notifications.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="connection-status"]',
        title: 'Connection Status',
        description: 'Monitor your real-time connection status and system health indicators.',
        placement: 'bottom',
      },
    ];

    const roleSpecificSteps: Record<string, TourStep[]> = {
      operator: [
        {
          target: '[href="/waste-analysis"]',
          title: 'Waste Analysis Tool',
          description: 'Your primary tool for analyzing waste samples using AI-powered multi-modal sensors.',
          placement: 'right',
        },
        {
          target: '[href="/contamination-detection"]',
          title: 'Contamination Detection',
          description: 'Detect and flag contaminated waste batches with real-time analysis.',
          placement: 'right',
        },
      ],
      manager: [
        {
          target: '[href="/dashboard"]',
          title: 'Management Dashboard',
          description: 'Monitor system performance, efficiency metrics, and overall operations.',
          placement: 'right',
        },
        {
          target: '[href="/analytics"]',
          title: 'Analytics & Reports',
          description: 'Access comprehensive analytics, generate reports, and track KPIs.',
          placement: 'right',
        },
        {
          target: '[href="/blockchain"]',
          title: 'Blockchain Certificates',
          description: 'Manage NFT certificates and track environmental impact credentials.',
          placement: 'right',
        },
      ],
      analyst: [
        {
          target: '[href="/analytics"]',
          title: 'Data Analytics',
          description: 'Analyze waste processing data, trends, and generate insights.',
          placement: 'right',
        },
        {
          target: '[href="/contamination-detection"]',
          title: 'Quality Analysis',
          description: 'Review contamination patterns and quality control metrics.',
          placement: 'right',
        },
        {
          target: '[href="/blockchain"]',
          title: 'Certification Data',
          description: 'Access blockchain data for compliance and certification analysis.',
          placement: 'right',
        },
      ],
    };

    return [...commonSteps, ...roleSpecificSteps[role]];
  };

  const startTour = (role: 'operator' | 'manager' | 'analyst' = userRole) => {
    setUserRole(role);
    setShowWelcome(false);
    setShowTour(true);
    localStorage.setItem('waste-management-user-role', role);
  };

  const skipOnboarding = () => {
    setShowWelcome(false);
    setShowTour(false);
    localStorage.setItem('waste-management-visited', 'true');
    setIsFirstVisit(false);
  };

  const markStepCompleted = (stepId: string) => {
    const newCompletedSteps = [...completedSteps, stepId];
    setCompletedSteps(newCompletedSteps);
    localStorage.setItem('waste-management-completed-steps', JSON.stringify(newCompletedSteps));
  };

  const resetOnboarding = () => {
    localStorage.removeItem('waste-management-visited');
    localStorage.removeItem('waste-management-user-role');
    localStorage.removeItem('waste-management-completed-steps');
    setIsFirstVisit(true);
    setShowWelcome(true);
    setCompletedSteps([]);
  };

  const handleTourFinish = () => {
    setShowTour(false);
    localStorage.setItem('waste-management-visited', 'true');
    setIsFirstVisit(false);
    
    // Show completion message
    Modal.success({
      title: 'Welcome Tour Completed!',
      content: (
        <div>
          <Paragraph>
            Great! You've completed the welcome tour. You're now ready to start using the 
            Advanced Waste Management System.
          </Paragraph>
          <Paragraph>
            Remember, you can always access help and documentation from the navigation menu 
            or by pressing F1 for contextual help.
          </Paragraph>
        </div>
      ),
      okText: 'Get Started',
    });
  };

  const contextValue: OnboardingContextType = {
    isFirstVisit,
    userRole,
    showWelcome,
    showTour,
    completedSteps,
    startTour,
    skipOnboarding,
    markStepCompleted,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      
      {/* Welcome Modal */}
      <Modal
        open={showWelcome}
        onCancel={skipOnboarding}
        footer={null}
        width={600}
        centered
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            🌱
          </div>
          <Title level={2}>Welcome to the Advanced Waste Management System</Title>
          <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
            Let's get you started with a quick tour based on your role in the organization.
          </Paragraph>
          
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={8}>
              <Card
                hoverable
                onClick={() => startTour('operator')}
                style={{ textAlign: 'center' }}
              >
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', marginBottom: '12px' }} />
                <Title level={4}>Operator</Title>
                <Text type="secondary">
                  Daily waste processing and analysis operations
                </Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card
                hoverable
                onClick={() => startTour('manager')}
                style={{ textAlign: 'center' }}
              >
                <Avatar size={48} icon={<SettingOutlined />} style={{ backgroundColor: '#52c41a', marginBottom: '12px' }} />
                <Title level={4}>Manager</Title>
                <Text type="secondary">
                  System oversight, analytics, and reporting
                </Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card
                hoverable
                onClick={() => startTour('analyst')}
                style={{ textAlign: 'center' }}
              >
                <Avatar size={48} icon={<BarChartOutlined />} style={{ backgroundColor: '#722ed1', marginBottom: '12px' }} />
                <Title level={4}>Analyst</Title>
                <Text type="secondary">
                  Data analysis, quality control, and insights
                </Text>
              </Card>
            </Col>
          </Row>
          
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => startTour()}
            >
              Start Tour
            </Button>
            <Button
              size="large"
              icon={<CloseOutlined />}
              onClick={skipOnboarding}
            >
              Skip for Now
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Guided Tour */}
      <GuidedTour
        steps={getTourSteps(userRole)}
        open={showTour}
        onClose={() => setShowTour(false)}
        onFinish={handleTourFinish}
        userRole={userRole}
        showProgress={true}
        allowSkip={true}
      />
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;