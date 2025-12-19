import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Row, 
  Col, 
  Empty,
  Pagination,
  Select
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  ToolOutlined,
  DatabaseOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { LoadingSpinner, ErrorDisplay } from '../../components/Shared';
import styles from './SearchResults.module.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface SearchResult {
  id: string;
  type: 'tool' | 'data' | 'documentation' | 'user' | 'report';
  title: string;
  description: string;
  url: string;
  relevanceScore: number;
  category: string;
  lastUpdated: Date;
  preview?: string;
  tags?: string[];
}

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sort') || 'relevance';

  // Mock search data - in real app, this would come from API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'tool',
      title: 'Waste Analysis System',
      description: 'Multi-modal AI-powered waste classification with 98%+ accuracy using sensor fusion technology.',
      url: '/waste-analysis',
      relevanceScore: 0.95,
      category: 'AI Tools',
      lastUpdated: new Date('2024-01-15'),
      preview: 'Advanced waste classification using visual, spectral, weight, and chemical sensors...',
      tags: ['AI', 'Machine Learning', 'Sensors', 'Classification'],
    },
    {
      id: '2',
      type: 'tool',
      title: 'Contamination Detection',
      description: 'Real-time contamination detection in recyclable streams with automated flagging.',
      url: '/contamination-detection',
      relevanceScore: 0.88,
      category: 'Detection Tools',
      lastUpdated: new Date('2024-01-10'),
      preview: 'Detect contamination in waste streams using computer vision and AI algorithms...',
      tags: ['Detection', 'Computer Vision', 'Quality Control'],
    },
    {
      id: '3',
      type: 'data',
      title: 'Waste Processing Records',
      description: 'Historical data of waste processing operations and efficiency metrics.',
      url: '/analytics/processing-records',
      relevanceScore: 0.82,
      category: 'Analytics Data',
      lastUpdated: new Date('2024-01-20'),
      preview: 'Comprehensive records of waste processing operations including throughput, efficiency...',
      tags: ['Data', 'Analytics', 'Processing', 'Metrics'],
    },
    {
      id: '4',
      type: 'documentation',
      title: 'API Documentation',
      description: 'Complete API reference for waste management system integration.',
      url: '/docs/api',
      relevanceScore: 0.75,
      category: 'Documentation',
      lastUpdated: new Date('2024-01-12'),
      preview: 'RESTful API endpoints for integrating with the waste management system...',
      tags: ['API', 'Documentation', 'Integration', 'REST'],
    },
    {
      id: '5',
      type: 'tool',
      title: 'Blockchain Certificates',
      description: 'NFT-based waste processing certificates with immutable proof.',
      url: '/blockchain/certificates',
      relevanceScore: 0.70,
      category: 'Blockchain Tools',
      lastUpdated: new Date('2024-01-18'),
      preview: 'Create and manage blockchain-based certificates for waste processing...',
      tags: ['Blockchain', 'NFT', 'Certificates', 'Immutable'],
    },
  ];

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, category, sortBy, currentPage, pageSize]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter and sort results based on query and filters
      let filteredResults = mockResults.filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(query.toLowerCase()) ||
                           result.description.toLowerCase().includes(query.toLowerCase()) ||
                           result.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        const matchesCategory = category === 'all' || result.type === category;
        
        return matchesQuery && matchesCategory;
      });

      // Sort results
      filteredResults.sort((a, b) => {
        switch (sortBy) {
          case 'relevance':
            return b.relevanceScore - a.relevanceScore;
          case 'date':
            return b.lastUpdated.getTime() - a.lastUpdated.getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return b.relevanceScore - a.relevanceScore;
        }
      });

      // Paginate results
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedResults = filteredResults.slice(startIndex, startIndex + pageSize);

      setResults(paginatedResults);
      setTotalResults(filteredResults.length);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'tool':
        return <ToolOutlined className={styles.resultIconTool} />;
      case 'data':
        return <DatabaseOutlined className={styles.resultIconData} />;
      case 'documentation':
        return <FileTextOutlined className={styles.resultIconDoc} />;
      case 'user':
        return <UserOutlined className={styles.resultIconUser} />;
      default:
        return <FileTextOutlined className={styles.resultIconDefault} />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, value);
    if (key !== 'page') {
      newParams.set('page', '1');
      setCurrentPage(1);
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
    handleFilterChange('page', page.toString());
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className={styles.highlight}>
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={styles.searchResultsPage}>
      <div className={styles.header}>
        <Title level={2}>
          <SearchOutlined /> Search Results
        </Title>
        {query && (
          <Text type="secondary">
            Showing results for "{query}" • {totalResults} results found
          </Text>
        )}
      </div>

      {/* Search Filters */}
      <Card className={styles.filtersCard}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Space>
              <FilterOutlined />
              <Text strong>Filters:</Text>
            </Space>
          </Col>
          <Col span={5}>
            <Select
              value={category}
              onChange={(value) => handleFilterChange('category', value)}
              className={styles.fullWidth}
            >
              <Option value="all">All Categories</Option>
              <Option value="tool">Tools</Option>
              <Option value="data">Data</Option>
              <Option value="documentation">Documentation</Option>
              <Option value="user">Users</Option>
              <Option value="report">Reports</Option>
            </Select>
          </Col>
          <Col span={5}>
            <Select
              value={sortBy}
              onChange={(value) => handleFilterChange('sort', value)}
              className={styles.fullWidth}
            >
              <Option value="relevance">Relevance</Option>
              <Option value="date">Date</Option>
              <Option value="title">Title</Option>
            </Select>
          </Col>
          <Col span={5}>
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                handleFilterChange('size', value.toString());
              }}
              className={styles.fullWidth}
            >
              <Option value={10}>10 per page</Option>
              <Option value={20}>20 per page</Option>
              <Option value={50}>50 per page</Option>
            </Select>
          </Col>
          <Col span={5}>
            <Button
              type="default"
              onClick={() => navigate('/app/search/advanced')}
              className={styles.fullWidth}
            >
              Advanced Search
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Search Results */}
      {loading ? (
        <LoadingSpinner text="Searching..." size="large" />
      ) : error ? (
        <ErrorDisplay
          type="custom"
          title="Search Error"
          message={error}
          onRetry={performSearch}
        />
      ) : results.length === 0 ? (
        <Empty
          description={
            <div>
              <div className={styles.emptyContainer}>
                No results found
              </div>
              <Text type="secondary">
                Try adjusting your search terms or filters
              </Text>
            </div>
          }
        />
      ) : (
        <>
          <List
            dataSource={results}
            renderItem={(result) => (
              <List.Item className={styles.listItem}>
                <Card
                  hoverable
                  className={styles.resultCard}
                  onClick={() => handleResultClick(result)}
                >
                  <div className={styles.resultContent}>
                    <div className={styles.iconContainer}>
                      {getResultIcon(result.type)}
                    </div>
                    
                    <div className={styles.resultDetails}>
                      <div className={styles.resultHeader}>
                        <div>
                          <Title level={4} className={styles.resultTitle}>
                            {highlightText(result.title, query)}
                          </Title>
                          <Text type="secondary" className={styles.resultCategory}>
                            {result.category} • {result.type.toUpperCase()}
                          </Text>
                        </div>
                        
                        <div className={styles.resultMeta}>
                          <div className={styles.resultDate}>
                            <ClockCircleOutlined /> {result.lastUpdated.toLocaleDateString()}
                          </div>
                          <Tag color="blue">
                            {Math.round(result.relevanceScore * 100)}% match
                          </Tag>
                        </div>
                      </div>
                      
                      <Paragraph className={styles.resultDescription}>
                        {highlightText(result.description, query)}
                      </Paragraph>
                      
                      {result.preview && (
                        <Paragraph 
                          ellipsis={{ rows: 2 }} 
                          className={styles.resultPreview}
                        >
                          {highlightText(result.preview, query)}
                        </Paragraph>
                      )}
                      
                      {result.tags && (
                        <div className={styles.tagsContainer}>
                          {result.tags.map(tag => (
                            <Tag key={tag}>
                              {highlightText(tag, query)}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
          
          {/* Pagination */}
          <div className={styles.paginationContainer}>
            <Pagination
              current={currentPage}
              total={totalResults}
              pageSize={pageSize}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `${range[0]}-${range[1]} of ${total} results`
              }
              onChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;