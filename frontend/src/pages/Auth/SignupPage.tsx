import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Spin, Card, Select, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, GoogleOutlined, LinkedinOutlined } from '@ant-design/icons';
import styles from './SignupPage.module.css';

const SignupPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSignup = async (values: any) => {
    if (!agreeTerms) {
      message.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock account creation
      const token = `mock_token_${Date.now()}`;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', values.email);
      localStorage.setItem('userName', values.fullName);

      message.success('Account created successfully!');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/app/claimclean/dashboard', { replace: true });
      }, 500);
    } catch (error) {
      message.error('Signup failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    message.info(`${provider} signup coming soon!`);
  };

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.backgroundAnimation}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>🌱</div>
          <h1 className={styles.brand}>ClaimClean</h1>
          <p className={styles.tagline}>Join EPR Leaders</p>
        </div>

        {/* Signup Form Card */}
        <Card className={styles.signupCard} bordered={false}>
          <Spin spinning={loading} tip="Creating account...">
            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>Create Account</h2>
              <p className={styles.formSubtitle}>
                Sign up to start managing your EPR compliance
              </p>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSignup}
                autoComplete="off"
                className={styles.form}
              >
                <Form.Item
                  name="fullName"
                  label="Full Name"
                  rules={[
                    { required: true, message: 'Please enter your full name' },
                    { min: 2, message: 'Name must be at least 2 characters' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your full name"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter your email"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[
                    { required: true, message: 'Please enter your phone number' },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Enter your phone number"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="company"
                  label="Company Name"
                  rules={[
                    { required: true, message: 'Please enter your company name' },
                  ]}
                >
                  <Input
                    placeholder="Enter your company name"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Role"
                  rules={[
                    { required: true, message: 'Please select your role' },
                  ]}
                >
                  <Select
                    placeholder="Select your role"
                    size="large"
                    options={[
                      { label: 'EPR Manager', value: 'epr_manager' },
                      { label: 'Compliance Officer', value: 'compliance' },
                      { label: 'Operations Manager', value: 'operations' },
                      { label: 'Executive', value: 'executive' },
                      { label: 'Other', value: 'other' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter your password' },
                    { min: 8, message: 'Password must be at least 8 characters' },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and numbers',
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Create a strong password"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  rules={[
                    { required: true, message: 'Please confirm your password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Confirm your password"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <div className={styles.termsSection}>
                  <Checkbox
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  >
                    I agree to the{' '}
                    <a href="#terms" className={styles.termsLink}>
                      Terms & Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#privacy" className={styles.termsLink}>
                      Privacy Policy
                    </a>
                  </Checkbox>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    disabled={!agreeTerms}
                    className={styles.submitButton}
                    block
                  >
                    Create Account
                  </Button>
                </Form.Item>
              </Form>

              <Divider>OR</Divider>

              {/* Social Signup */}
              <div className={styles.socialSignup}>
                <Button
                  size="large"
                  icon={<GoogleOutlined />}
                  onClick={() => handleSocialSignup('Google')}
                  className={styles.socialButton}
                >
                  Google
                </Button>
                <Button
                  size="large"
                  icon={<LinkedinOutlined />}
                  onClick={() => handleSocialSignup('LinkedIn')}
                  className={styles.socialButton}
                >
                  LinkedIn
                </Button>
              </div>

              {/* Login Link */}
              <div className={styles.loginSection}>
                <p>
                  Already have an account?{' '}
                  <a href="/auth/login" className={styles.loginLink}>
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
          </Spin>
        </Card>
      </div>

      {/* Back to Landing */}
      <div className={styles.backButton}>
        <button
          onClick={() => navigate('/', { replace: true })}
          className={styles.backLink}
        >
          ← Back to Landing
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
