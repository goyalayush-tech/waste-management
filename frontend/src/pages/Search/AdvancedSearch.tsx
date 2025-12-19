import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Slider,
  Switch
} from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined, SaveOutlined, HistoryOutlined } from '@ant-design/icons';
import styles from './AdvancedSearch.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AdvancedSearchFilters {
  query: string;
  exactPhrase: string;
  anyWords: string;
  excludeWords: string;
  category: string[];
  type: string[];
  dateRange: [Date, Date] | null;
  author: string;
  tags: string[];
  relevanceThreshold: number;
  includeArchived: boolean;
  language: string;
  fileType: string[];
}

const AdvancedSearch: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [savedSearches, setSavedSearches] = useState<Array<{
    id: string;
    name: string;
    filters: Partial<AdvancedSearchFilters>;
    createdAt: Date;
  }>>([
    {
      id: '1',
      name: 'AI Tools Search',
      filters: {
        query: 'artificial intelligence',
        category: ['tool'],
        type: ['ai', 'machine-learning'],
      },
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Recent Documentation',
      filters: {
        category: ['documentation'],
        dateRange: [new Date('2024-01-01'), new Date()],
      },
      createdAt: new Date('2024-01-10'),
    },
  ]);

  const categoryOptions = [
    { label: 'Tools', value: 'tool' },
    { label: 'Data Records', value: 'data' },
    { label: 'Documentation', value: 'documentation' },
    { label: 'Users', value: 'user' },
    { label: 'Reports', value: 'report' },
  ];

  const typeOptions = [
    { label: 'AI/ML', value: 'ai' },
    { label: 'Blockchain', value: 'blockchain' },
    { label: 'Analytics', value: 'analytics' },
    { label: 'Detection', value: 'detection' },
    { label: 'Processing', value: 'processing' },
    { label: 'Certification', value: 'certification' },
  ];

  const fileTypeOptions = [
    { label: 'PDF', value: 'pdf' },
    { label: 'Word Document', value: 'doc' },
    { label: 'Excel', value: 'xls' },
    { label: 'PowerPoint', value: 'ppt' },
    { label: 'Image', value: 'img' },
    { label: 'Video', value: 'video' },
  ];

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Chinese', value: 'zh' },
  ];

  const handleSearch = (values: any) => {
    // Build search query from advanced filters
    const searchParams = new URLSearchParams();
    
    // Build complex query string
    const queryParts = [];
    if (values.query) queryParts.push(values.query);
    if (values.exactPhrase) queryParts.push(`"${values.exactPhrase}"`);
    if (values.anyWords) queryParts.push(`(${values.anyWords.split(' ').join(' OR ')})`);
    if (values.excludeWords) queryParts.push(`-${values.excludeWords.split(' ').join(' -')}`);
    
    const finalQuery = queryParts.join(' ');
    if (finalQuery) searchParams.set('q', finalQuery);
    
    // Add other filters
    if (values.category?.length) searchParams.set('category', values.category.join(','));
    if (values.type?.length) searchParams.set('type', values.type.join(','));
    if (values.author) searchParams.set('author', values.author);
    if (values.tags?.length) searchParams.set('tags', values.tags.join(','));
    if (values.relevanceThreshold) searchParams.set('relevance', values.relevanceThreshold.toString());
    if (values.includeArchived) searchParams.set('archived', 'true');
    if (values.language) searchParams.set('lang', values.language);
    if (values.fileType?.length) searchParams.set('filetype', values.fileType.join(','));
    if (values.dateRange) {
      searchParams.set('from', values.dateRange[0].toISOString());
      searchParams.set('to', values.dateRange[1].toISOString());
    }
    
    // Navigate to search results
    navigate(`/app/search?${searchParams.toString()}`);
  };

  const handleClear = () => {
    form.resetFields();
  };

  const handleSaveSearch = () => {
    const values = form.getFieldsValue();
    const searchName = prompt('Enter a name for this search:');
    
    if (searchName) {
      const newSearch = {
        id: Date.now().toString(),
        name: searchName,
        filters: values,
        createdAt: new Date(),
      };
      
      setSavedSearches(prev => [newSearch, ...prev]);
    }
  };

  const handleLoadSavedSearch = (savedSearch: any) => {
    form.setFieldsValue(savedSearch.filters);
  };

  const handleDeleteSavedSearch = (id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  };

  return (
    <div className={styles.advancedSearchPage}>
      <div className={styles.header}>
        <Title level={2}>
          <FilterOutlined /> Advanced Search
        </Title>
        <Text type="secondary">
          Use advanced filters to find exactly what you're looking for
        </Text>
      </div>

      <Row gutter={24}>
        <Col span={18}>
          <Card title="Search Filters">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSearch}
              initialValues={{
                relevanceThreshold: 70,
                includeArchived: false,
                language: 'en',
              }}
            >
              {/* Basic Search Fields */}
              <Title level={4}>Basic Search</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="query"
                    label="Search Terms"
                    tooltip="Enter keywords to search for"
                  >
                    <Input placeholder="Enter search terms..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="exactPhrase"
                    label="Exact Phrase"
                    tooltip="Search for an exact phrase"
                  >
                    <Input placeholder="Enter exact phrase..." />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="anyWords"
                    label="Any of These Words"
                    tooltip="Find results containing any of these words"
                  >
                    <Input placeholder="word1 word2 word3..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="excludeWords"
                    label="Exclude Words"
                    tooltip="Exclude results containing these words"
                  >
                    <Input placeholder="exclude1 exclude2..." />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              {/* Category and Type Filters */}
              <Title level={4}>Content Filters</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="Categories"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select categories..."
                      options={categoryOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Content Types"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select types..."
                      options={typeOptions}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="author"
                    label="Author/Creator"
                  >
                    <Input placeholder="Enter author name..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="tags"
                    label="Tags"
                  >
                    <Select
                      mode="tags"
                      placeholder="Enter or select tags..."
                      options={[
                        { label: 'AI', value: 'ai' },
                        { label: 'Machine Learning', value: 'ml' },
                        { label: 'Blockchain', value: 'blockchain' },
                        { label: 'Analytics', value: 'analytics' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              {/* Date and Quality Filters */}
              <Title level={4}>Date & Quality Filters</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="dateRange"
                    label="Date Range"
                  >
                    <RangePicker className={styles.fullWidth} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="relevanceThreshold"
                    label="Minimum Relevance (%)"
                  >
                    <Slider
                      min={0}
                      max={100}
                      marks={{
                        0: '0%',
                        50: '50%',
                        100: '100%',
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="language"
                    label="Language"
                  >
                    <Select options={languageOptions} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="fileType"
                    label="File Types"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select file types..."
                      options={fileTypeOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="includeArchived"
                    label="Include Archived"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    htmlType="submit"
                    size="large"
                  >
                    Search
                  </Button>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    size="large"
                  >
                    Clear All
                  </Button>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={handleSaveSearch}
                    size="large"
                  >
                    Save Search
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            title={
              <Space>
                <HistoryOutlined />
                Saved Searches
              </Space>
            }
            size="small"
          >
            {savedSearches.length === 0 ? (
              <Text type="secondary">No saved searches</Text>
            ) : (
              <div>
                {savedSearches.map(search => (
                  <div
                    key={search.id}
                    className={styles.savedSearchItem}
                  >
                    <div className={styles.savedSearchHeader}>
                      <Text strong className={styles.savedSearchName}>
                        {search.name}
                      </Text>
                      <Button
                        type="text"
                        size="small"
                        danger
                        onClick={() => handleDeleteSavedSearch(search.id)}
                      >
                        ×
                      </Button>
                    </div>
                    <Text type="secondary" className={styles.savedSearchDate}>
                      {search.createdAt.toLocaleDateString()}
                    </Text>
                    <div className={styles.savedSearchActions}>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleLoadSavedSearch(search)}
                        className={styles.loadButton}
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Search Tips */}
          <Card title="Search Tips" size="small" className={styles.searchTipsCard}>
            <div className={styles.searchTips}>
              <div className={styles.searchTipItem}>
                <Text strong>Boolean Operators:</Text>
                <br />
                <Text code>AND</Text>, <Text code>OR</Text>, <Text code>NOT</Text>
              </div>
              <div className={styles.searchTipItem}>
                <Text strong>Wildcards:</Text>
                <br />
                <Text code>*</Text> for multiple characters
                <br />
                <Text code>?</Text> for single character
              </div>
              <div>
                <Text strong>Exact Phrases:</Text>
                <br />
                Use quotes: <Text code>"exact phrase"</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdvancedSearch;