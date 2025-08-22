import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, Card, Row, Col } from 'antd';
import {
  DownloadOutlined,
  MobileOutlined,
  WifiOutlined,
  BellOutlined,
  CloseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSupported, setInstallSupported] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check if running as PWA
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }

      // Check if user has dismissed the prompt recently
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      if (lastDismissed) {
        const dismissedTime = parseInt(lastDismissed);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return; // Don't show for 7 days after dismissal
        }
      }

      setInstallSupported(true);
    };

    checkInstallStatus();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show our custom install prompt after a delay
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 30000); // Show after 30 seconds
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      
      if (onInstall) {
        onInstall();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      showManualInstallInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    
    if (onDismiss) {
      onDismiss();
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    if (isIOS) {
      instructions = 'Tap the Share button and then "Add to Home Screen"';
    } else if (isAndroid) {
      instructions = 'Tap the menu button and select "Add to Home Screen" or "Install App"';
    } else {
      instructions = 'Look for the install button in your browser\'s address bar or menu';
    }

    Modal.info({
      title: 'Install Waste Management App',
      content: (
        <div>
          <Paragraph>
            To install this app on your device:
          </Paragraph>
          <Paragraph strong>
            {instructions}
          </Paragraph>
          <Paragraph>
            Once installed, you'll be able to access the app offline and receive notifications.
          </Paragraph>
        </div>
      ),
      okText: 'Got it',
    });
  };

  if (isInstalled || !installSupported) {
    return null;
  }

  return (
    <Modal
      open={showPrompt}
      onCancel={handleDismiss}
      footer={null}
      width={500}
      centered
      closable={false}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          🌱
        </div>
        
        <Title level={3} style={{ marginBottom: '8px' }}>
          Install Waste Management App
        </Title>
        
        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
          Get the full app experience with offline access and notifications
        </Text>

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', border: 'none' }}>
              <WifiOutlined style={{ fontSize: '24px', color: '#00b96b', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>Works Offline</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', border: 'none' }}>
              <BellOutlined style={{ fontSize: '24px', color: '#00b96b', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>Push Notifications</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', border: 'none' }}>
              <MobileOutlined style={{ fontSize: '24px', color: '#00b96b', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>App-like Experience</div>
            </Card>
          </Col>
        </Row>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleInstallClick}
            style={{ width: '100%', height: '48px', fontSize: '16px' }}
          >
            Install App
          </Button>
          
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleDismiss}
            style={{ color: '#8c8c8c' }}
          >
            Maybe Later
          </Button>
        </Space>

        <div style={{ marginTop: '16px', fontSize: '12px', color: '#8c8c8c' }}>
          Free • No app store required • Instant updates
        </div>
      </div>
    </Modal>
  );
};

export default InstallPrompt;