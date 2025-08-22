import React, { useState, useEffect } from 'react';
import { Tour, Button, Space, Typography, Progress, Card } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  nextButtonProps?: any;
  prevButtonProps?: any;
  type?: 'primary' | 'default';
  cover?: React.ReactNode;
}

export interface GuidedTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
  userRole?: 'operator' | 'manager' | 'analyst';
  showProgress?: boolean;
  allowSkip?: boolean;
}

const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  open,
  onClose,
  onFinish,
  userRole = 'operator',
  showProgress = true,
  allowSkip = true,
}) => {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setCurrent(0);
      setCompletedSteps([]);
      setIsPlaying(true);
    }
  }, [open]);

  const handleStepChange = (stepIndex: number) => {
    setCurrent(stepIndex);
    
    // Mark previous steps as completed
    if (stepIndex > current) {
      setCompletedSteps(prev => {
        const newCompleted = [...prev];
        for (let i = current; i < stepIndex; i++) {
          if (!newCompleted.includes(i)) {
            newCompleted.push(i);
          }
        }
        return newCompleted;
      });
    }
  };

  const handleNext = () => {
    if (current < steps.length - 1) {
      handleStepChange(current + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      handleStepChange(current - 1);
    }
  };

  const handleFinish = () => {
    setCompletedSteps(steps.map((_, index) => index));
    onFinish();
  };

  const handleSkip = () => {
    onClose();
  };

  const getRoleSpecificMessage = () => {
    switch (userRole) {
      case 'manager':
        return 'As a manager, you\'ll have access to analytics, reports, and system oversight tools.';
      case 'analyst':
        return 'As an analyst, you\'ll primarily work with data analysis, contamination detection, and reporting tools.';
      default:
        return 'As an operator, you\'ll mainly use the waste analysis and processing tools for daily operations.';
    }
  };

  const tourSteps = steps.map((step, index) => ({
    ...step,
    target: () => {
      const element = document.querySelector(step.target);
      return element as HTMLElement;
    },
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {completedSteps.includes(index) ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : (
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
        )}
        <span>{step.title}</span>
        {showProgress && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ({index + 1}/{steps.length})
          </Text>
        )}
      </div>
    ),
    description: (
      <div>
        <div style={{ marginBottom: '12px' }}>
          {step.description}
        </div>
        {index === 0 && (
          <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Text style={{ fontSize: '12px' }}>
              <InfoCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
              {getRoleSpecificMessage()}
            </Text>
          </Card>
        )}
      </div>
    ),
  }));

  const customRenderPanel = (props: any, { current: currentStep, total }: any) => {
    const { prev, next } = props;
    
    return (
      <div style={{ padding: '16px' }}>
        {showProgress && (
          <div style={{ marginBottom: '16px' }}>
            <Progress
              percent={Math.round(((currentStep + 1) / total) * 100)}
              size="small"
              status={currentStep === total - 1 ? 'success' : 'active'}
              format={(percent) => `${currentStep + 1}/${total}`}
            />
          </div>
        )}
        
        <div style={{ marginBottom: '16px' }}>
          {tourSteps[currentStep]?.description}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {allowSkip && (
              <Button
                type="text"
                size="small"
                onClick={handleSkip}
                icon={<CloseOutlined />}
              >
                Skip Tour
              </Button>
            )}
          </div>
          
          <Space>
            <Button
              size="small"
              onClick={prev}
              disabled={currentStep === 0}
              icon={<StepBackwardOutlined />}
            >
              Previous
            </Button>
            
            {currentStep < total - 1 ? (
              <Button
                type="primary"
                size="small"
                onClick={next}
                icon={<StepForwardOutlined />}
              >
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                size="small"
                onClick={handleFinish}
                icon={<CheckCircleOutlined />}
              >
                Finish Tour
              </Button>
            )}
          </Space>
        </div>
      </div>
    );
  };

  return (
    <Tour
      open={open}
      onClose={onClose}
      steps={tourSteps}
      current={current}
      onChange={handleStepChange}
      type="primary"
      arrow={true}
      placement="bottom"
      mask={{
        style: {
          boxShadow: 'inset 0 0 15px #333',
        },
      }}
      renderPanel={customRenderPanel}
    />
  );
};

export default GuidedTour;