import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClaimCleanLandingPage.module.css';

// NOTE: This component now uses the same vibrant gradient design theme as the main landing page
// with ClaimClean branding and EPR-focused content

const ClaimCleanLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'EPR Verification',
      body: 'Automated verification of Extended Producer Responsibility compliance with blockchain-backed transparency.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-white">
          <path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"/>
        </svg>
      )
    },
    {
      title: 'Smart Audits',
      body: 'AI-powered field audits and automated claim processing for faster, more accurate compliance tracking.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-white">
          <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V88H40ZM40,200V104H216v96H40Zm32-80a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,120Zm0,32a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,152Zm0,32a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,184Z"/>
        </svg>
      )
    },
    {
      title: 'Real-time Reports',
      body: 'Generate compliance reports instantly with integrated CPCB/SPCB submission workflows.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-white">
          <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"/>
        </svg>
      )
    },
    {
      title: 'AI Processing',
      body: 'Advanced OCR and document processing for seamless digitization of compliance documents.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256" className="text-white">
          <path d="M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128H40a16,16,0,0,1-16-16V72A16,16,0,0,1,40,56H216a16,16,0,0,1,16,16v16A16,16,0,0,1,216,104ZM40,88H216V72H40ZM208,128v72a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V128a8,8,0,0,1,16,0v72H192V128a8,8,0,0,1,16,0Z"/>
        </svg>
      )
    }
  ];

  const metrics = [
    { label: 'Claims Verified', value: '2,847', change: '+25%', icon: '📋' },
    { label: 'Processing Time', value: '2.3 hrs', change: '-65%', icon: '⚡' },
    { label: 'Compliance Rate', value: '98.5%', change: '+12%', icon: '✅' },
  ];

  return (
    <div className={styles.container}>
      {/* Animated Background Elements */}
      <div className={styles.floatingCircle1} />
      <div className={styles.floatingCircle2} />
      <div className={styles.floatingCircle3} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoIcon}>
              🌱
            </div>
            <h2 className={styles.logoText}>
              ClaimClean
            </h2>
          </div>
          <div className={styles.navWrapper}>
            <nav className={styles.nav}>
              <a
                href="#features"
                className={styles.navLink}
              >
                Features
              </a>
              <a
                href="#metrics"
                className={styles.navLink}
              >
                Metrics
              </a>
              <a
                href="#dashboard"
                className={styles.navLink}
                onClick={(e) => { e.preventDefault(); navigate('/app/claimclean/dashboard'); }}
              >
                Dashboard
              </a>
            </nav>
            <button
              onClick={() => navigate('/auth/login')}
              className={styles.ctaButton}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>
            🌱 ClaimClean Revolution
          </h1>

          <p className={styles.heroSubtitle}>
            EPR Verification • Blockchain-Powered • AI-Driven
          </p>

          <p className={styles.heroDescription}>
            Transform EPR compliance with India's first blockchain-powered verification platform,
            featuring AI-driven audits, automated processing, and real-time regulatory reporting.
          </p>

          <div className={styles.heroButtons}>
            <button
              onClick={() => navigate('/auth/login')}
              className={styles.primaryButton}
            >
              🔐 Sign In
            </button>
            <button
              onClick={() => navigate('/auth/signup')}
              className={styles.secondaryButton}
            >
              📝 Create Account
            </button>
          </div>

          {/* Key Stats */}
          <div className={styles.statsGrid}>
            {metrics.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statValue}>
                  {stat.value}
                </div>
                <div className={styles.statLabel}>
                  {stat.label}
                </div>
                <div className={styles.statChange}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            🛠️ Powerful EPR Features
          </h2>
          <p className={styles.sectionDescription}>
            Advanced technology meets regulatory compliance for seamless EPR verification
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={styles.featureCard}
            >
              <div className={styles.featureIconWrapper}>
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>
                {feature.title}
              </h3>
              <p className={styles.featureDescription}>
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className={styles.benefitsSection}>
        <div className={styles.benefitsCard}>
          <div className={styles.benefitsHeader}>
            <h2 className={styles.benefitsTitle}>
              ✨ Why Choose ClaimClean?
            </h2>
            <p className={styles.benefitsSubtitle}>
              Experience the future of EPR compliance management
            </p>
          </div>

          <div className={styles.benefitsGrid}>
            {[
              '95% reduction in processing time',
              'Blockchain-secured verification',
              'Real-time compliance tracking',
              'Multi-stakeholder collaboration',
              'Advanced analytics dashboard',
              'Environmental impact metrics',
            ].map((benefit, index) => (
              <div key={index} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>
                  ✓
                </div>
                <span className={styles.benefitText}>
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to Transform Your EPR Compliance?
          </h2>
          <p className={styles.ctaDescription}>
            Join the future of waste management compliance with ClaimClean's innovative platform
          </p>
          <div className={styles.ctaButtons}>
            <button
              onClick={() => navigate('/app/claimclean/dashboard')}
              className={styles.ctaPrimaryButton}
            >
              Start Your Journey
            </button>
            <button
              onClick={() => navigate('/app/claimclean/claims/new')}
              className={styles.ctaSecondaryButton}
            >
              Submit New Claim
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerIcon}>
              🌱
            </div>
            <h3 className={styles.footerTitle}>
              ClaimClean
            </h3>
          </div>
          <p className={styles.footerTagline}>
            Transforming EPR compliance through technology and transparency
          </p>
          <div className={styles.footerLinks}>
            <a
              href="#privacy"
              className={styles.footerLink}
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className={styles.footerLink}
            >
              Terms of Service
            </a>
          </div>
          <div className={styles.copyright}>
            © 2025 ClaimClean. Building a cleaner, greener future.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimCleanLandingPage;