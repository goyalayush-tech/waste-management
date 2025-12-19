import React, { useState } from 'react';
import { Drawer, Input, List, Typography, Space, Tag, Collapse, Card, Button, Divider } from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  BookOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  BulbOutlined,
  CloseOutlined,
  LinkOutlined
} from '@ant-design/icons';
import styles from './HelpPanel.module.css';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface HelpItem {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'guide' | 'tutorial' | 'troubleshooting';
  tags: string[];
  type: 'text' | 'video' | 'link';
  url?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  context?: string; // Current page/feature context
}

const HelpPanel: React.FC<HelpPanelProps> = ({
  open,
  onClose,
  context = 'general',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock help data - in real app, this would come from API
  const helpItems: HelpItem[] = [
    {
      id: '1',
      title: 'How to start a waste analysis?',
      content: 'To start a waste analysis, navigate to the Waste Analysis tool, upload an image of your waste sample, and click the "Analyze Waste" button. The AI system will process the image using multi-modal sensors.',
      category: 'guide',
      tags: ['waste-analysis', 'getting-started', 'ai'],
      type: 'text',
      difficulty: 'beginner',
    },
    {
      id: '2',
      title: 'Understanding contamination detection results',
      content: 'Contamination detection results show the severity level, affected area percentage, and types of contamination found. Red indicators mean high contamination, while green means clean.',
      category: 'guide',
      tags: ['contamination', 'results', 'interpretation'],
      type: 'text',
      difficulty: 'intermediate',
    },
    {
      id: '3',
      title: 'Blockchain certificate creation tutorial',
      content: 'Learn how to create NFT certificates for waste processing with step-by-step instructions.',
      category: 'tutorial',
      tags: ['blockchain', 'nft', 'certificates'],
      type: 'video',
      url: '/tutorials/blockchain-certificates',
      difficulty: 'advanced',
    },
    {
      id: '4',
      title: 'Why is my sensor calibration failing?',
      content: 'Sensor calibration may fail due to environmental conditions, hardware issues, or incorrect setup. Check connections, clean sensors, and ensure proper environmental conditions.',
      category: 'troubleshooting',
      tags: ['sensors', 'calibration', 'hardware'],
      type: 'text',
      difficulty: 'intermediate',
    },
    {
      id: '5',
      title: 'System performance optimization',
      content: 'Tips and best practices for optimizing system performance and processing efficiency.',
      category: 'guide',
      tags: ['performance', 'optimization', 'efficiency'],
      type: 'link',
      url: '/docs/performance-guide',
      difficulty: 'advanced',
    },
  ];

  const faqItems = [
    {
      question: 'What file formats are supported for waste analysis?',
      answer: 'The system supports JPEG, PNG, and TIFF image formats. For best results, use high-resolution images with good lighting.',
    },
    {
      question: 'How accurate is the contamination detection?',
      answer: 'Our AI-powered contamination detection achieves 98%+ accuracy using multi-modal sensor fusion technology.',
    },
    {
      question: 'Can I export analysis results?',
      answer: 'Yes, you can export results in PDF, CSV, or JSON formats from the analysis results page.',
    },
    {
      question: 'How do I reset my dashboard layout?',
      answer: 'Go to Settings > Dashboard > Reset Layout, or use the customization panel to restore default widgets.',
    },
  ];

  const filteredItems = helpItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getItemIcon = (item: HelpItem) => {
    switch (item.type) {
      case 'video':
        return <VideoCameraOutlined style={{ color: '#f5222d' }} />;
      case 'link':
        return <LinkOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BookOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'green';
      case 'intermediate':
        return 'orange';
      case 'advanced':
        return 'red';
      default:
        return 'default';
    }
  };

  const handleItemClick = (item: HelpItem) => {
    if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <QuestionCircleOutlined />
          Help & Documentation
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={450}
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
        />
      }
      className={styles.drawer}
    >
      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <Input
          placeholder="Search help articles..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        
        <Space wrap>
          {['all', 'faq', 'guide', 'tutorial', 'troubleshooting'].map(category => (
            <Tag
              key={category}
              color={selectedCategory === category ? 'blue' : 'default'}
              className={styles.categoryTag}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Tag>
          ))}
        </Space>
      </div>

      {/* Context-specific help */}
      {context !== 'general' && (
        <Card size="small" className={styles.contextCard}>
          <Space>
            <BulbOutlined className={styles.contextIcon} />
            <Text strong>Context Help: {context}</Text>
          </Space>
          <Paragraph className={styles.contextDescription}>
            Showing help relevant to your current page. Use the search above to find more topics.
          </Paragraph>
        </Card>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Space direction="vertical" className={styles.actionButtons}>
          <Button
            type="primary"
            icon={<MessageOutlined />}
            block
            onClick={() => {
              // In real app, this would open a chat widget or support ticket
              console.log('Open chat support');
            }}
          >
            Chat with Support
          </Button>
          <Button
            icon={<VideoCameraOutlined />}
            block
            onClick={() => {
              window.open('/tutorials', '_blank');
            }}
          >
            Video Tutorials
          </Button>
        </Space>
      </div>

      <Divider />

      {/* FAQ Section */}
      <div className={styles.faqSection}>
        <Title level={4}>Frequently Asked Questions</Title>
        <Collapse size="small" ghost>
          {faqItems.map((faq, index) => (
            <Panel header={faq.question} key={index}>
              <Text>{faq.answer}</Text>
            </Panel>
          ))}
        </Collapse>
      </div>

      <Divider />

      {/* Help Articles */}
      <div className={styles.articlesSection}>
        <Title level={4}>Help Articles ({filteredItems.length})</Title>
        <List
          dataSource={filteredItems}
          renderItem={(item) => (
            <List.Item
              className={`${styles.articleItem} ${item.url ? styles.clickableItem : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <List.Item.Meta
                avatar={getItemIcon(item)}
                title={
                  <div className={styles.articleTitle}>
                    <Text strong className={styles.articleTitleText}>
                      {item.title}
                    </Text>
                    {item.difficulty && (
                      <Tag size="small" color={getDifficultyColor(item.difficulty)}>
                        {item.difficulty}
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div className={styles.articleDescription}>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      className={styles.articleContent}
                    >
                      {item.content}
                    </Paragraph>
                    <Space size={4} wrap>
                      {item.tags.map(tag => (
                        <Tag key={tag} size="small">
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {filteredItems.length === 0 && (
        <div className={styles.emptyState}>
          <QuestionCircleOutlined className={styles.emptyIcon} />
          <div className={styles.emptyText}>No help articles found</div>
          <Text type="secondary">Try adjusting your search terms</Text>
        </div>
      )}
    </Drawer>
  );
};

export default HelpPanel;