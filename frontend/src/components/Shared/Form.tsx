import React from 'react';
import { Form as AntForm, FormProps as AntFormProps, FormItemProps, Input, Select, DatePicker, Switch, InputNumber } from 'antd';

export interface SharedFormProps extends AntFormProps {
  variant?: 'default' | 'inline' | 'vertical';
  spacing?: 'compact' | 'default' | 'comfortable';
}

export interface FormFieldProps extends FormItemProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'date' | 'switch' | 'textarea';
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  rows?: number;
}

const Form: React.FC<SharedFormProps> = ({
  variant = 'default',
  spacing = 'default',
  children,
  layout,
  ...props
}) => {
  const getFormLayout = () => {
    switch (variant) {
      case 'inline':
        return 'inline';
      case 'vertical':
        return 'vertical';
      default:
        return layout || 'vertical';
    }
  };

  const getFormStyle = () => {
    const baseStyle: React.CSSProperties = {};

    switch (spacing) {
      case 'compact':
        return {
          ...baseStyle,
          '.ant-form-item': {
            marginBottom: '12px',
          },
        };
      case 'comfortable':
        return {
          ...baseStyle,
          '.ant-form-item': {
            marginBottom: '32px',
          },
        };
      default:
        return baseStyle;
    }
  };

  return (
    <AntForm
      layout={getFormLayout()}
      style={getFormStyle()}
      {...props}
    >
      {children}
    </AntForm>
  );
};

export const FormField: React.FC<FormFieldProps> = ({
  type = 'text',
  options = [],
  placeholder,
  rows = 4,
  children,
  ...props
}) => {
  const renderField = () => {
    switch (type) {
      case 'email':
        return <Input type="email" placeholder={placeholder} />;
      case 'password':
        return <Input.Password placeholder={placeholder} />;
      case 'number':
        return <InputNumber placeholder={placeholder} style={{ width: '100%' }} />;
      case 'select':
        return (
          <Select placeholder={placeholder}>
            {options.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case 'date':
        return <DatePicker placeholder={placeholder} style={{ width: '100%' }} />;
      case 'switch':
        return <Switch />;
      case 'textarea':
        return <Input.TextArea rows={rows} placeholder={placeholder} />;
      default:
        return <Input placeholder={placeholder} />;
    }
  };

  return (
    <AntForm.Item {...props}>
      {children || renderField()}
    </AntForm.Item>
  );
};

Form.Item = AntForm.Item;
Form.List = AntForm.List;
Form.useForm = AntForm.useForm;

export default Form;