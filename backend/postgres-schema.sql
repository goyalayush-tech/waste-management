-- PostgreSQL Schema for Waste Management System
-- User Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('vendor', 'buyer', 'admin', 'epr-client', 'auditor')),
    name VARCHAR(100) NOT NULL,
    organization VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WasteSubmission Table
CREATE TABLE waste_submissions (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES users(id),
    waste_type VARCHAR(20) NOT NULL CHECK (waste_type IN ('plastic', 'paper', 'metal', 'glass', 'organic', 'mixed')),
    sub_type VARCHAR(100),
    quantity NUMERIC(12,2) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    address VARCHAR(255),
    accuracy NUMERIC(6,2),
    image_metadata JSONB,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WasteCredit Table
CREATE TABLE waste_credits (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER UNIQUE REFERENCES waste_submissions(id),
    vendor_id INTEGER REFERENCES users(id),
    credit_id VARCHAR(20) UNIQUE NOT NULL,
    waste_type VARCHAR(20) NOT NULL CHECK (waste_type IN ('plastic', 'paper', 'metal', 'glass', 'organic', 'mixed')),
    sub_type VARCHAR(100),
    quantity NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BlockchainTransaction Table
CREATE TABLE blockchain_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('waste_submission', 'waste_credit', 'user_registration', 'credit_transfer', 'audit_record')),
    entity_id INTEGER NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IPFSMetadata Table
CREATE TABLE ipfs_metadata (
    id SERIAL PRIMARY KEY,
    ipfs_hash VARCHAR(46) UNIQUE NOT NULL,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('waste_image', 'document', 'certificate', 'qr_code', 'avatar', 'report')),
    entity_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
