import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Card, 
  Tooltip, 
  Modal, 
  message 
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { RootState } from '../../store/store';
import { updateBatchStatus, ContaminationSeverity } from '../../store/slices/contaminationSlice';

const { Title, Text } = Typography;
const { confirm } = Modal;

const FlaggedBatchesList: React.FC = () => {
  const dispatch = useDispatch();
  const { flaggedBatches } = useSelector((state: RootState) => state.contamination);
  
  const handleUpdateStatus = (batchId: string, status: 'remediated' | 'rejected') => {
    confirm({
      title: `Are you sure you want to mark this batch as ${status}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This action will update the batch status in the system.',
      onOk() {
        dispatch(updateBatchStatus({ batchId, status }) as any);
        message.success(`Batch ${batchId} has been marked as ${status}`);
      },
    });
  };
  
  const getSeverityColor = (severity: ContaminationSeverity) => {
    switch (severity) {
      case ContaminationSeverity.NONE:
        return 'green';
      case ContaminationSeverity.LOW:
        return 'blue';
      case ContaminationSeverity.MEDIUM:
        return 'orange';
      case ContaminationSeverity.HIGH:
        return 'red';
      case ContaminationSeverity.CRITICAL:
        return 'purple';
      default:
        return 'default';
    }
  };
  
  const getSeverityText = (severity: ContaminationSeverity) => {
    switch (severity) {
      case ContaminationSeverity.NONE:
        return 'None';
      case ContaminationSeverity.LOW:
        return 'Low';
      case ContaminationSeverity.MEDIUM:
        return 'Medium';
      case ContaminationSeverity.HIGH:
        return 'High';
      case ContaminationSeverity.CRITICAL:
        return 'Critical';
      default:
        return 'Unknown';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'remediated':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'default';
    }
  };
  
  const columns = [
    {
      title: 'Batch ID',
      dataIndex: 'batchId',
      key: 'batchId',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: 'Severity',
      key: 'severity',
      render: (_, record: any) => (
        <Tag color={getSeverityColor(record.contaminationResult.severityLevel)}>
          {getSeverityText(record.contaminationResult.severityLevel)}
        </Tag>
      ),
    },
    {
      title: 'Contamination Types',
      key: 'contaminationTypes',
      render: (_, record: any) => (
        <>
          {record.contaminationResult.contaminationTypes.slice(0, 2).map((type: string) => (
            <Tag color="blue" key={type}>
              {type.replace(/_/g, ' ')}
            </Tag>
          ))}
          {record.contaminationResult.contaminationTypes.length > 2 && (
            <Tooltip title={record.contaminationResult.contaminationTypes.slice(2).join(', ')}>
              <Tag color="blue">+{record.contaminationResult.contaminationTypes.length - 2} more</Tag>
            </Tooltip>
          )}
        </>
      ),
    },
    {
      title: 'Affected Area',
      key: 'affectedArea',
      render: (_, record: any) => `${Math.round(record.contaminationResult.affectedAreaPercentage)}%`,
    },
    {
      title: 'Economic Impact',
      key: 'economicImpact',
      render: (_, record: any) => `$${record.contaminationResult.economicImpact.toFixed(2)}`,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record: any) => (
        <Tag color={getStatusColor(record.status)}>
          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} />
          </Tooltip>
          
          {record.status === 'pending' && (
            <>
              <Tooltip title="Mark as Remediated">
                <Button 
                  type="text" 
                  icon={<CheckCircleOutlined style={{ color: 'green' }} />} 
                  onClick={() => handleUpdateStatus(record.batchId, 'remediated')}
                />
              </Tooltip>
              
              <Tooltip title="Mark as Rejected">
                <Button 
                  type="text" 
                  icon={<CloseCircleOutlined style={{ color: 'red' }} />} 
                  onClick={() => handleUpdateStatus(record.batchId, 'rejected')}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];
  
  return (
    <Card title="Flagged Batches" className="flagged-batches-card">
      {flaggedBatches.length > 0 ? (
        <Table 
          columns={columns} 
          dataSource={flaggedBatches.map((batch, index) => ({ ...batch, key: index }))} 
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <div className="no-batches" style={{ textAlign: 'center', padding: '24px' }}>
          <Text>No flagged batches found</Text>
        </div>
      )}
    </Card>
  );
};

export default FlaggedBatchesList;