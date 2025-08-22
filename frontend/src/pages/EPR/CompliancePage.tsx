import React, { useEffect, useState } from 'react';
import { eprClient } from '@/services/api';
import { Card, Typography, List, Tag } from 'antd';

const { Title, Paragraph } = Typography;

const CompliancePage: React.FC = () => {
  const [score, setScore] = useState<any | null>(null);
  const clientId = 'client_1';

  useEffect(() => {
    const run = async () => {
      const client = eprClient();
      const res = await client.getComplianceScore(clientId);
      setScore(res);
    };
    run();
  }, []);

  return (
    <div>
      <Title level={3}>Compliance Score</Title>
      {score && (
        <Card>
          <Paragraph>
            Score: <Tag color={score.score > 80 ? 'green' : score.score > 60 ? 'gold' : 'red'}>{score.score}</Tag>
          </Paragraph>
          <List
            header={<div>Recommendations</div>}
            dataSource={score.recommendations}
            renderItem={(r: any) => <List.Item>{r.category}: {r.suggestion} ({r.impact})</List.Item>}
          />
        </Card>
      )}
    </div>
  );
};

export default CompliancePage;
