import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  DatePicker, 
  Select, 
  Input,
  Tooltip,
  Modal,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  EyeOutlined, 
  DownloadOutlined, 
  FilterOutlined,
  BarChartOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { RootState } from '../../store/store';
import { WasteAnalysisResult } from '../../store/slices/wasteAnalysisSlice';
import AnalysisResults from './AnalysisResults';
import styles from './AnalysisHistory.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AnalysisHistory: React.FC = () => {
  const { analysisHistory } = useSelector((state: RootState) => state.wasteAnalysis);
  
  const [selectedAnalysis, setSelectedAnalysis] = useState<WasteAnalysisResult | null>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    classification: '',
    confidenceRange: '',
    dateRange: null as any,
    searchTerm: ''
  });
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'green';
    if (confidence >= 0.7) return 'orange';
    return 'red';
  };
  
  const getConfidenceClassName = (confidence: number) => {
    if (confidence >= 0.9) return styles.confidenceHigh;
    if (confidence >= 0.7) return styles.confidenceMedium;
    return styles.confidenceLow;
  };
  
  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };
  
  const filteredHistory = analysisHistory.filter(analysis => {
    if (filters.classification && analysis.classification !== filters.classification) {
      return false;
    }
    
    if (filters.confidenceRange) {
      const [min, max] = filters.confidenceRange.split('-').map(Number);
      if (analysis.confidence < min || analysis.confidence > max) {
        return false;
      }
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      if (!analysis.classification.toLowerCase().includes(searchLower) &&
          !analysis.processingRecommendations.some(rec => rec.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    
    return true;
  });
  
  const columns = [
    {
      title: 'Timestamp',
      key: 'timestamp',
      render: (_, record: WasteAnalysisResult, index: number) => 
        new Date(Date.now() - (analysisHistory.length - index) * 60000).toLocaleString(),
      sorter: (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Classification',
      dataIndex: 'classification',
      key: 'classification',
      render: (classification: string) => (
        <Tag color="blue">{classification.replace(/_/g, ' ').toUpperCase()}</Tag>
      ),
      filters: [...new Set(analysisHistory.map(a => a.classification))].map(c => ({
        text: c.replace(/_/g, ' ').toUpperCase(),
        value: c
      })),
      onFilter: (value: any, record: WasteAnalysisResult) => record.classification === value,
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => (
        <Tag color={getConfidenceColor(confidence)}>
          {getConfidenceText(confidence)} ({(confidence * 100).toFixed(1)}%)
        </Tag>
      ),
      sorter: (a: WasteAnalysisResult, b: WasteAnalysisResult) => a.confidence - b.confidence,
    },
    {
      title: 'Value Estimate',
      dataIndex: 'valueEstimate',
      key: 'valueEstimate',
      render: (value: number) => `$${value.toFixed(2)}`,
      sorter: (a: WasteAnalysisResult, b: WasteAnalysisResult) => a.valueEstimate - b.valueEstimate,
    },
    {
      title: 'Quality Score',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      render: (score: number) => (
        <div>
          <Text>{Math.round(score)}/100</Text>
        </div>
      ),
      sorter: (a: WasteAnalysisResult, b: WasteAnalysisResult) => a.qualityScore - b.qualityScore,
    },
    {
      title: 'Carbon Footprint',
      dataIndex: 'carbonFootprint',
      key: 'carbonFootprint',
      render: (footprint: number) => `${footprint.toFixed(2)} kg CO₂`,
      sorter: (a: WasteAnalysisResult, b: WasteAnalysisResult) => a.carbonFootprint - b.carbonFootprint,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: WasteAnalysisResult) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedAnalysis(record);
                setDetailsModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Download Report">
            <Button type="text" icon={<DownloadOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  // Calculate summary statistics
  const totalAnalyses = filteredHistory.length;
  const avgConfidence = totalAnalyses > 0 ? 
    filteredHistory.reduce((sum, a) => sum + a.confidence, 0) / totalAnalyses : 0;
  const totalValue = filteredHistory.reduce((sum, a) => sum + a.valueEstimate, 0);
  const avgQualityScore = totalAnalyses > 0 ?
    filteredHistory.reduce((sum, a) => sum + a.qualityScore, 0) / totalAnalyses : 0;
  
  return (
    <div className={styles.analysisHistory}>
      <div className={styles.historyHeader}>
        <Title level={3}>Analysis History</Title>
        <Text type="secondary">
          View and analyze historical waste classification results
        </Text>
      </div>
      
      {/* Summary Statistics */}
      <Row gutter={16} className={styles.summaryRow}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Analyses"
              value={totalAnalyses}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Confidence"
              value={avgConfidence * 100}
              suffix="%"
              precision={1}
              className={getConfidenceClassName(avgConfidence)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={totalValue}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Quality"
              value={avgQualityScore}
              suffix="/100"
              precision={0}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Filters */}
      <Card title="Filters" className={styles.filtersCard}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="Search classifications..."
              prefix={<SearchOutlined />}
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Filter by classification"
              className={styles.fullWidth}
              value={filters.classification}
              onChange={(value) => setFilters({ ...filters, classification: value })}
              allowClear
            >
              {[...new Set(analysisHistory.map(a => a.classification))].map(classification => (
                <Option key={classification} value={classification}>
                  {classification.replace(/_/g, ' ').toUpperCase()}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="Confidence range"
              className={styles.fullWidth}
              value={filters.confidenceRange}
              onChange={(value) => setFilters({ ...filters, confidenceRange: value })}
              allowClear
            >
              <Option value="0.9-1.0">High (90-100%)</Option>
              <Option value="0.7-0.9">Medium (70-90%)</Option>
              <Option value="0.0-0.7">Low (0-70%)</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              className={styles.fullWidth}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
        </Row>
      </Card>
      
      {/* History Table */}
      <Card title={`Analysis Results (${filteredHistory.length} records)`}>
        <Table
          columns={columns}
          dataSource={filteredHistory.map((analysis, index) => ({
            ...analysis,
            key: index
          }))}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} analyses`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
      
      {/* Details Modal */}
      <Modal
        title="Analysis Details"
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            Download Report
          </Button>,
          <Button key="close" onClick={() => setDetailsModal(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedAnalysis && <AnalysisResults analysis={selectedAnalysis} />}
      </Modal>
    </div>
  );
};

export default AnalysisHistory;