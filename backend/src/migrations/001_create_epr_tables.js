/**
 * PostgreSQL migration for EPR compliance tables
 * Creates tables for clients, documents, audit results, recycler master, and compliance scores
 */

import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  // Create clients table for EPR client management
  await queryInterface.createTable('clients', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subscription_tier: {
      type: DataTypes.ENUM('basic', 'professional', 'enterprise'),
      defaultValue: 'basic'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Create documents table for EPR document storage
  await queryInterface.createTable('documents', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    document_type: {
      type: DataTypes.ENUM('invoice', 'weighbridge_slip', 'transport_document', 'certificate', 'other'),
      allowNull: false
    },
    ocr_status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    extracted_data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Create recycler_master table for recycler database
  await queryInterface.createTable('recycler_master', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    registration_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    gst_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_person: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    license_type: {
      type: DataTypes.ENUM('cpcb', 'spcb', 'both'),
      allowNull: false
    },
    license_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    license_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    capacity_tonnes_per_day: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    waste_types_accepted: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    risk_profile: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    verification_status: {
      type: DataTypes.ENUM('verified', 'pending', 'rejected'),
      defaultValue: 'pending'
    },
    last_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Create audit_results table for audit findings
  await queryInterface.createTable('audit_results', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'documents',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    audit_type: {
      type: DataTypes.ENUM('document_validation', 'recycler_verification', 'tonnage_check', 'date_consistency'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('passed', 'failed', 'warning', 'pending'),
      allowNull: false
    },
    findings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    recommendations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    auditor_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    auditor_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    confidence_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Create compliance_scores table for ClaimClean scoring
  await queryInterface.createTable('compliance_scores', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    overall_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    component_scores: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Breakdown of scores by component (documentation, recycler_quality, tonnage_accuracy, etc.)'
    },
    calculation_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    period_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    period_end: {
      type: DataTypes.DATE,
      allowNull: false
    },
    total_tonnage_audited: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    documents_processed: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    audit_findings_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    improvement_recommendations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    benchmark_comparison: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Create audit_trails table for immutable audit logging
  await queryInterface.createTable('audit_trails', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of entity being audited (client, document, audit_result, etc.)'
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of the entity being audited'
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'approve', 'reject', 'review'),
      allowNull: false
    },
    actor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of user who performed the action'
    },
    actor_type: {
      type: DataTypes.ENUM('client', 'auditor', 'admin', 'system'),
      allowNull: false
    },
    changes: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Details of what changed'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional context like IP address, user agent, etc.'
    },
    blockchain_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hash of blockchain transaction for immutable record'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Create billing_records table for subscription and usage tracking
  await queryInterface.createTable('billing_records', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    billing_period_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    billing_period_end: {
      type: DataTypes.DATE,
      allowNull: false
    },
    subscription_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    usage_charges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    usage_details: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Breakdown of usage charges (tonnage audited, API calls, etc.)'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'pending'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Add indexes for better performance
  await queryInterface.addIndex('documents', ['client_id']);
  await queryInterface.addIndex('documents', ['document_type']);
  await queryInterface.addIndex('documents', ['ocr_status']);
  await queryInterface.addIndex('audit_results', ['client_id']);
  await queryInterface.addIndex('audit_results', ['audit_type']);
  await queryInterface.addIndex('audit_results', ['status']);
  await queryInterface.addIndex('compliance_scores', ['client_id']);
  await queryInterface.addIndex('compliance_scores', ['calculation_date']);
  await queryInterface.addIndex('audit_trails', ['entity_type', 'entity_id']);
  await queryInterface.addIndex('audit_trails', ['actor_id']);
  await queryInterface.addIndex('recycler_master', ['registration_number']);
  await queryInterface.addIndex('recycler_master', ['gst_number']);
  await queryInterface.addIndex('recycler_master', ['verification_status']);
  await queryInterface.addIndex('billing_records', ['client_id']);
  await queryInterface.addIndex('billing_records', ['payment_status']);
};

export const down = async (queryInterface) => {
  // Drop tables in reverse order to handle foreign key constraints
  await queryInterface.dropTable('billing_records');
  await queryInterface.dropTable('audit_trails');
  await queryInterface.dropTable('compliance_scores');
  await queryInterface.dropTable('audit_results');
  await queryInterface.dropTable('documents');
  await queryInterface.dropTable('recycler_master');
  await queryInterface.dropTable('clients');
};