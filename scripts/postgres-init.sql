-- PostgreSQL initialization script for EPR Compliance System

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS epr_compliance;

-- Connect to the database
\c epr_compliance;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'client', 'auditor', 'upload-only', 'view-only');
CREATE TYPE subscription_tier AS ENUM ('basic', 'professional', 'enterprise');
CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'processed', 'failed');
CREATE TYPE audit_status AS ENUM ('pending', 'in_progress', 'completed', 'flagged');
CREATE TYPE finding_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    subscription_tier subscription_tier DEFAULT 'basic',
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    address JSONB,
    billing_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'client',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create recycler_master table
CREATE TABLE recycler_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    gst_number VARCHAR(15) UNIQUE NOT NULL,
    cpcb_id VARCHAR(50),
    spcb_id VARCHAR(50),
    address JSONB,
    certifications JSONB,
    risk_profile VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_submissions table
CREATE TABLE document_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id),
    status document_status DEFAULT 'uploaded',
    total_documents INTEGER DEFAULT 0,
    processed_documents INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES document_submissions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(50),
    status document_status DEFAULT 'uploaded',
    ocr_data JSONB,
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_results table
CREATE TABLE audit_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES document_submissions(id) ON DELETE CASCADE,
    status audit_status DEFAULT 'pending',
    overall_score DECIMAL(5,2),
    findings JSONB,
    recommendations JSONB,
    processed_by VARCHAR(50),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create claim_clean_scores table
CREATE TABLE claim_clean_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_result_id UUID REFERENCES audit_results(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,2) NOT NULL,
    vendor_credibility DECIMAL(5,2),
    document_consistency DECIMAL(5,2),
    traceability_score DECIMAL(5,2),
    compliance_score DECIMAL(5,2),
    score_breakdown JSONB,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_trail table
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES document_submissions(id),
    report_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(100),
    file_path VARCHAR(500),
    file_size BIGINT,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false
);

-- Create billing_records table
CREATE TABLE billing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subscription_tier subscription_tier NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    usage_charges DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',
    invoice_number VARCHAR(50) UNIQUE,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_clients_company_name ON clients(company_name);
CREATE INDEX idx_clients_subscription_tier ON clients(subscription_tier);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_recycler_master_gst ON recycler_master(gst_number);
CREATE INDEX idx_recycler_master_name ON recycler_master USING gin(name gin_trgm_ops);
CREATE INDEX idx_documents_submission_id ON documents(submission_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_audit_results_submission_id ON audit_results(submission_id);
CREATE INDEX idx_audit_results_status ON audit_results(status);
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX idx_reports_client_id ON reports(client_id);
CREATE INDEX idx_billing_records_client_id ON billing_records(client_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recycler_master_updated_at BEFORE UPDATE ON recycler_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_submissions_updated_at BEFORE UPDATE ON document_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_results_updated_at BEFORE UPDATE ON audit_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO clients (company_name, industry, subscription_tier, contact_email) VALUES
('Green Corp Ltd', 'Manufacturing', 'professional', 'admin@greencorp.com'),
('EcoTech Solutions', 'Technology', 'enterprise', 'compliance@ecotech.com'),
('Sustainable Industries', 'Packaging', 'basic', 'contact@sustainable.com');

INSERT INTO users (client_id, email, password_hash, role, first_name, last_name) VALUES
((SELECT id FROM clients WHERE company_name = 'Green Corp Ltd'), 'admin@greencorp.com', '$2b$10$example', 'admin', 'Admin', 'User'),
((SELECT id FROM clients WHERE company_name = 'EcoTech Solutions'), 'compliance@ecotech.com', '$2b$10$example', 'client', 'Compliance', 'Manager');

-- Insert sample recycler data
INSERT INTO recycler_master (name, gst_number, cpcb_id, address) VALUES
('Delhi Recycling Co', '07ABCDE1234F1Z5', 'CPCB001', '{"city": "Delhi", "state": "Delhi", "pincode": "110001"}'),
('Mumbai Waste Solutions', '27FGHIJ5678K2L6', 'CPCB002', '{"city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}'),
('Bangalore Green Tech', '29MNOPQ9012R3S7', 'CPCB003', '{"city": "Bangalore", "state": "Karnataka", "pincode": "560001"}');

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Log successful initialization
SELECT 'EPR Compliance Database initialized successfully' AS status;