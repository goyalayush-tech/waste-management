import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Tooltip, Modal, Form, Input, Select, Space, Tag, Divider } from 'antd';
import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  BlockOutlined,
  LineChartOutlined,
  SettingOutlined,
  PlusOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  DashboardOutlined,
  RobotOutlined,
  GlobalOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { addQuickAction, removeQuickAction, updateQuickAction, addWorkflowShortcut, removeWorkflowShortcut } from '../../store/slices/dashboardSlice';

const { Title, Text } = Typography;
const { Option } = Select;

export interface WorkflowStep {
  id: string;
  label: string;
  route: string;
  description: string;
  icon: string;
}

export interface WorkflowShortcut {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  category: string;
  estimatedTime: string;
  isPinned: boolean;
  usageCount: number;
}

const iconMap: Record<string, React.ReactNode> = {
  ExperimentOutlined: <ExperimentOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  BlockOutlined: <BlockOutlined />,
  LineChartOutlined: <LineChartOutlined />,
  PlayCircleOutlined: <PlayCircleOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  RobotOutlined: <RobotOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  DollarOutlined: <DollarOutlined />,
};

const QuickActionCenter: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { quickActions, workflowShortcuts, userPreferences } = useSelector((state: RootState) => state.dashboard);
  
  const [customizeModalVisible, setCustomizeModalVisible] = useState(false);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [editingAction, setEditingAction] = useState<any>(null);
  const [form] = Form.useForm();
  const [workflowForm] = Form.useForm();

  // Sort actions by usage frequency and pinned status
  const sortedActions = [...quickActions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.usageCount || 0) - (a.usageCount || 0);
  });

  // Sort workflows by usage and pinned status
  const sortedWorkflows = [...(workflowShortcuts || [])].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.usageCount - a.usageCount;
  });

  const handleActionClick = (action: any) => {
    // Track usage for learning system
    dispatch(updateQuickAction({ 
      id: action.id, 
      updates: { usageCount: (action.usageCount || 0) + 1 } 
    }));
    navigate(action.route);
  };

  const handleWorkflowStart = (workflow: WorkflowShortcut) => {
    // Track usage
    dispatch(updateWorkflowShortcut({ 
      id: workflow.id, 
      updates: { usageCount: workflow.usageCount + 1 } 
    }));
    
    // Navigate to first step
    if (workflow.steps.length > 0) {
      navigate(workflow.steps[0].route, { 
        state: { 
          workflow: workflow,
          currentStep: 0 
        }
      });
    }
  };

  const handlePinAction = (actionId: string, isPinned: boolean) => {
    dispatch(updateQuickAction({ 
      id: actionId, 
      updates: { isPinned: !isPinned } 
    }));
  };

  const handlePinWorkflow = (workflowId: string, isPinned: boolean) => {
    dispatch(updateWorkflowShortcut({ 
      id: workflowId, 
      updates: { isPinned: !isPinned } 
    }));
  };

  const handleCustomizeAction = () => {
    setEditingAction(null);
    form.resetFields();
    setCustomizeModalVisible(true);
  };

  const handleEditAction = (action: any) => {
    setEditingAction(action);
    form.setFieldsValue(action);
    setCustomizeModalVisible(true);
  };

  const handleSaveAction = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingAction) {
        dispatch(updateQuickAction({ id: editingAction.id, updates: values }));
      } else {
        const newAction = {
          ...values,
          id: `custom-${Date.now()}`,
          usageCount: 0,
          isPinned: false,
        };
        dispatch(addQuickAction(newAction));
      }
      
      setCustomizeModalVisible(false);
      setEditingAction(null);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleDeleteAction = (actionId: string) => {
    dispatch(removeQuickAction(actionId));
  };

  const handleCreateWorkflow = async () => {
    try {
      const values = await workflowForm.validateFields();
      
      const newWorkflow: WorkflowShortcut = {
        ...values,
        id: `workflow-${Date.now()}`,
        usageCount: 0,
        isPinned: false,
      };
      
      dispatch(addWorkflowShortcut(newWorkflow));
      setWorkflowModalVisible(false);
      workflowForm.resetFields();
    } catch (error) {
      console.error('Workflow form validation failed:', error);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>Quick Actions</Title>
        <Space>
          <Button 
            icon={<PlusOutlined />} 
            onClick={handleCustomizeAction}
            size="small"
          >
            Add Action
          </Button>
          <Button 
            icon={<SettingOutlined />} 
            onClick={() => setWorkflowModalVisible(true)}
            size="small"
          >
            Create Workflow
          </Button>
        </Space>
      </div>

      {/* Quick Action Buttons */}
      <Row gutter={[8, 8]} style={{ marginBottom: '24px' }}>
        {sortedActions.slice(0, 8).map((action) => (
          <Col key={action.id} xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card
              size="small"
              hoverable
              style={{ 
                textAlign: 'center',
                border: action.isPinned ? `2px solid ${action.color}` : undefined,
                position: 'relative'
              }}
              bodyStyle={{ padding: '12px 8px' }}
              onClick={() => handleActionClick(action)}
            >
              <div style={{ position: 'absolute', top: 4, right: 4 }}>
                <Button
                  type="text"
                  size="small"
                  icon={action.isPinned ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinAction(action.id, action.isPinned);
                  }}
                />
              </div>
              
              <div style={{ fontSize: '24px', color: action.color, marginBottom: '8px' }}>
                {iconMap[action.icon] || <DashboardOutlined />}
              </div>
              
              <Tooltip title={action.description}>
                <Text strong style={{ fontSize: '12px', display: 'block' }}>
                  {action.label}
                </Text>
              </Tooltip>
              
              {action.usageCount > 0 && (
                <Tag size="small" style={{ marginTop: '4px', fontSize: '10px' }}>
                  {action.usageCount} uses
                </Tag>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Workflow Shortcuts */}
      {sortedWorkflows.length > 0 && (
        <>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0 }}>Workflow Shortcuts</Title>
            <Text type="secondary">Multi-step guided processes</Text>
          </div>

          <Row gutter={[16, 16]}>
            {sortedWorkflows.slice(0, 4).map((workflow) => (
              <Col key={workflow.id} xs={24} sm={12} lg={6}>
                <Card
                  size="small"
                  hoverable
                  style={{ 
                    border: workflow.isPinned ? '2px solid #1890ff' : undefined,
                    position: 'relative'
                  }}
                  actions={[
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleWorkflowStart(workflow)}
                    >
                      Start
                    </Button>
                  ]}
                >
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={workflow.isPinned ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinWorkflow(workflow.id, workflow.isPinned);
                      }}
                    />
                  </div>
                  
                  <Title level={5} style={{ marginBottom: '8px' }}>
                    {workflow.name}
                  </Title>
                  
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                    {workflow.description}
                  </Text>
                  
                  <Space size="small" wrap>
                    <Tag color="blue">{workflow.category}</Tag>
                    <Tag color="green">{workflow.estimatedTime}</Tag>
                    <Tag>{workflow.steps.length} steps</Tag>
                  </Space>
                  
                  {workflow.usageCount > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Used {workflow.usageCount} times
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Customize Action Modal */}
      <Modal
        title={editingAction ? 'Edit Quick Action' : 'Add Quick Action'}
        open={customizeModalVisible}
        onOk={handleSaveAction}
        onCancel={() => {
          setCustomizeModalVisible(false);
          setEditingAction(null);
          form.resetFields();
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="label"
            label="Action Label"
            rules={[{ required: true, message: 'Please enter action label' }]}
          >
            <Input placeholder="e.g., Start Analysis" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea placeholder="Brief description of the action" rows={2} />
          </Form.Item>
          
          <Form.Item
            name="route"
            label="Navigation Route"
            rules={[{ required: true, message: 'Please enter route' }]}
          >
            <Input placeholder="e.g., /waste-analysis" />
          </Form.Item>
          
          <Form.Item
            name="icon"
            label="Icon"
            rules={[{ required: true, message: 'Please select an icon' }]}
          >
            <Select placeholder="Select an icon">
              {Object.keys(iconMap).map(iconName => (
                <Option key={iconName} value={iconName}>
                  <Space>
                    {iconMap[iconName]}
                    {iconName.replace('Outlined', '')}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="color"
            label="Color"
            rules={[{ required: true, message: 'Please enter color' }]}
          >
            <Select placeholder="Select a color">
              <Option value="#1890ff">Blue</Option>
              <Option value="#52c41a">Green</Option>
              <Option value="#722ed1">Purple</Option>
              <Option value="#13c2c2">Cyan</Option>
              <Option value="#faad14">Orange</Option>
              <Option value="#f5222d">Red</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Workflow Modal */}
      <Modal
        title="Create Workflow Shortcut"
        open={workflowModalVisible}
        onOk={handleCreateWorkflow}
        onCancel={() => {
          setWorkflowModalVisible(false);
          workflowForm.resetFields();
        }}
        width={600}
      >
        <Form form={workflowForm} layout="vertical">
          <Form.Item
            name="name"
            label="Workflow Name"
            rules={[{ required: true, message: 'Please enter workflow name' }]}
          >
            <Input placeholder="e.g., Complete Waste Analysis" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea placeholder="Brief description of the workflow" rows={2} />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category">
              <Option value="Analysis">Analysis</Option>
              <Option value="Detection">Detection</Option>
              <Option value="Certification">Certification</Option>
              <Option value="Reporting">Reporting</Option>
              <Option value="Maintenance">Maintenance</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="estimatedTime"
            label="Estimated Time"
            rules={[{ required: true, message: 'Please enter estimated time' }]}
          >
            <Input placeholder="e.g., 5-10 min" />
          </Form.Item>
          
          <Form.Item
            name="steps"
            label="Workflow Steps"
            rules={[{ required: true, message: 'Please add workflow steps' }]}
          >
            <Form.List name="steps">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'label']}
                        rules={[{ required: true, message: 'Missing step label' }]}
                      >
                        <Input placeholder="Step label" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'route']}
                        rules={[{ required: true, message: 'Missing route' }]}
                      >
                        <Input placeholder="Route" />
                      </Form.Item>
                      <DeleteOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Step
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuickActionCenter;