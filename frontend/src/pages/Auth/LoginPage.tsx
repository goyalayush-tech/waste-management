import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Spin, Card, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, LinkedinOutlined } from '@ant-design/icons';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock authentication
      const token = `mock_token_${Date.now()}`;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', values.email);
      
      if (rememberMe) {
        localStorage.setItem('rememberEmail', values.email);
      }

      message.success('Login successful!');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/app/claimclean/dashboard', { replace: true });
      }, 500);
    } catch (error) {
      message.error('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    message.info(`${provider} login coming soon!`);
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
          <p className={styles.tagline}>EPR Compliance Made Simple</p>
        </div>

        {/* Login Form Card */}
        <Card className={styles.loginCard} bordered={false}>
          <Spin spinning={loading} tip="Logging in...">
            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>Welcome Back</h2>
              <p className={styles.formSubtitle}>
                Sign in to your account to continue
              </p>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleLogin}
                autoComplete="off"
                className={styles.form}
              >
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your email"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter your password' },
                    { min: 6, message: 'Password must be at least 6 characters' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter your password"
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <div className={styles.formFooter}>
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  >
                    Remember me
                  </Checkbox>
                  <a href="#" className={styles.forgotPassword}>
                    Forgot Password?
                  </a>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    className={styles.submitButton}
                    block
                  >
                    Sign In
                  </Button>
                </Form.Item>
              </Form>

              <Divider>OR</Divider>

              {/* Social Login */}
              <div className={styles.socialLogin}>
                <Button
                  size="large"
                  icon={<GoogleOutlined />}
                  onClick={() => handleSocialLogin('Google')}
                  className={styles.socialButton}
                >
                  Google
                </Button>
                <Button
                  size="large"
                  icon={<LinkedinOutlined />}
                  onClick={() => handleSocialLogin('LinkedIn')}
                  className={styles.socialButton}
                >
                  LinkedIn
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className={styles.signupSection}>
                <p>
                  Don't have an account?{' '}
                  <a href="#signup" className={styles.signupLink}>
                    Sign up here
                  </a>
                </p>
              </div>
            </div>
          </Spin>
        </Card>

        {/* Security Info */}
        <div className={styles.securityInfo}>
          <p>🔒 Your data is encrypted and secure</p>
        </div>
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

export default LoginPage;
