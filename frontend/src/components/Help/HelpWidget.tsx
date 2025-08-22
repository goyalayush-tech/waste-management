import React, { useState, useEffect } from 'react';
import { FloatButton, Badge, Tooltip } from 'antd';
import { QuestionCircleOutlined, MessageOutlined, BookOutlined } from '@ant-design/icons';
import HelpPanel from './HelpPanel';

interface HelpWidgetProps {
  context?: string;
  position?: {
    bottom?: number;
    right?: number;
    left?: number;
    top?: number;
  };
  showBadge?: boolean;
  badgeCount?: number;
}

const HelpWidget: React.FC<HelpWidgetProps> = ({
  context = 'general',
  position = { bottom: 24, right: 24 },
  showBadge = false,
  badgeCount = 0,
}) => {
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [hasNewHelp, setHasNewHelp] = useState(false);

  useEffect(() => {
    // Check for new help content based on context
    const checkForNewHelp = () => {
      // In real app, this would check for new help articles or updates
      // For demo, we'll simulate new help availability
      const lastHelpCheck = localStorage.getItem(`help-last-check-${context}`);
      const now = Date.now();
      
      if (!lastHelpCheck || now - parseInt(lastHelpCheck) > 24 * 60 * 60 * 1000) {
        setHasNewHelp(true);
      }
    };

    checkForNewHelp();
  }, [context]);

  const handleHelpOpen = () => {
    setHelpPanelOpen(true);
    setHasNewHelp(false);
    localStorage.setItem(`help-last-check-${context}`, Date.now().toString());
  };

  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    // F1 key opens help
    if (event.key === 'F1') {
      event.preventDefault();
      handleHelpOpen();
    }
    
    // Ctrl/Cmd + ? opens help
    if ((event.ctrlKey || event.metaKey) && event.key === '?') {
      event.preventDefault();
      handleHelpOpen();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

  return (
    <>
      <div style={{ position: 'fixed', ...position, zIndex: 1000 }}>
        <FloatButton.Group
          trigger="hover"
          type="primary"
          style={{ right: 0 }}
          icon={
            <Badge dot={hasNewHelp || showBadge} count={badgeCount}>
              <QuestionCircleOutlined />
            </Badge>
          }
          tooltip={
            <div>
              <div>Help & Support</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                Press F1 or Ctrl+? for quick access
              </div>
            </div>
          }
        >
          <FloatButton
            icon={<BookOutlined />}
            tooltip="Documentation"
            onClick={handleHelpOpen}
          />
          <FloatButton
            icon={<MessageOutlined />}
            tooltip="Chat Support"
            onClick={() => {
              // In real app, this would open a chat widget
              console.log('Open chat support');
            }}
          />
        </FloatButton.Group>
      </div>

      <HelpPanel
        open={helpPanelOpen}
        onClose={() => setHelpPanelOpen(false)}
        context={context}
      />
    </>
  );
};

export default HelpWidget;