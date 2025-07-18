import React from 'react';
import { Card, List, Typography, Tag, Button, Space } from 'antd';
import { BulbOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface RemediationSuggestionsProps {
  suggestions: string[];
}

const RemediationSuggestions: React.FC<RemediationSuggestionsProps> = ({ suggestions }) => {
  return (
    <Card title="Remediation Suggestions" className="remediation-card">
      {suggestions.length > 0 ? (
        <>
          <Text type="secondary">
            Based on the detected contamination, the following remediation actions are recommended:
          </Text>
          
          <List
            itemLayout="horizontal"
            dataSource={suggestions}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<BulbOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                  title={`Suggestion ${index + 1}`}
                  description={item}
                />
              </List.Item>
            )}
            style={{ marginTop: '16px' }}
          />
          
          <div className="action-buttons" style={{ marginTop: '16px' }}>
            <Space>
              <Button type="primary" icon={<CheckCircleOutlined />}>
                Apply All Suggestions
              </Button>
              <Button>
                Request Custom Remediation
              </Button>
            </Space>
          </div>
          
          <div className="efficiency-indicator" style={{ marginTop: '16px' }}>
            <Tag color="green">98% Success Rate</Tag>
            <Text type="secondary">
              These remediation suggestions have a high success rate based on historical data
            </Text>
          </div>
        </>
      ) : (
        <div className="no-suggestions">
          <Text>No remediation suggestions available</Text>
        </div>
      )}
    </Card>
  );
};

export default RemediationSuggestions;