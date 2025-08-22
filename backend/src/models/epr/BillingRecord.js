/**
 * BillingRecord model for EPR compliance system
 * Handles subscription billing and usage tracking
 */

import { DataTypes, Model } from 'sequelize';

class BillingRecord extends Model {
  /**
   * Initialize the BillingRecord model
   */
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Invoice number is required'
          }
        }
      },
      
      billingPeriodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: 'Billing period start must be a valid date'
          }
        }
      },
      
      billingPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: 'Billing period end must be a valid date'
          },
          isAfterStart(value) {
            if (value <= this.billingPeriodStart) {
              throw new Error('Billing period end must be after start date');
            }
          }
        }
      },
      
      subscriptionDetails: {
        type: DataTypes.JSONB,
        defaultValue: {
          tier: 'basic',
          planName: null,
          planId: null,
          features: [],
          limits: {}
        }
      },
      
      subscriptionFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Subscription fee cannot be negative'
          }
        }
      },
      
      usageCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Usage charges cannot be negative'
          }
        }
      },
      
      usageDetails: {
        type: DataTypes.JSONB,
        defaultValue: {
          documentsProcessed: 0,
          tonnageAudited: 0,
          apiCalls: 0,
          reportsGenerated: 0,
          storageUsed: 0,
          additionalServices: []
        },
        validate: {
          isValidUsage(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Usage details must be a valid JSON object');
            }
          }
        }
      },
      
      usageRates: {
        type: DataTypes.JSONB,
        defaultValue: {
          perDocument: 0,
          perTonne: 0,
          perApiCall: 0,
          perReport: 0,
          perGBStorage: 0
        }
      },
      
      discounts: {
        type: DataTypes.JSONB,
        defaultValue: {
          applied: [],
          totalDiscount: 0,
          discountPercentage: 0
        }
      },
      
      taxes: {
        type: DataTypes.JSONB,
        defaultValue: {
          gst: 0,
          serviceTax: 0,
          otherTaxes: 0,
          totalTax: 0,
          taxBreakdown: []
        }
      },
      
      adjustments: {
        type: DataTypes.JSONB,
        defaultValue: {
          credits: 0,
          penalties: 0,
          refunds: 0,
          other: 0,
          details: []
        }
      },
      
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Subtotal cannot be negative'
          }
        }
      },
      
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: {
            args: 0,
            msg: 'Total amount cannot be negative'
          }
        }
      },
      
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
        validate: {
          isIn: {
            args: [['USD', 'EUR', 'INR', 'GBP', 'CAD', 'AUD']],
            msg: 'Invalid currency code'
          }
        }
      },
      
      exchangeRate: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: true,
        validate: {
          min: {
            args: 0,
            msg: 'Exchange rate cannot be negative'
          }
        }
      },
      
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled', 'refunded', 'disputed'),
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'paid', 'overdue', 'cancelled', 'refunded', 'disputed']],
            msg: 'Invalid payment status'
          }
        }
      },
      
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Payment method cannot exceed 100 characters'
          }
        }
      },
      
      paymentDetails: {
        type: DataTypes.JSONB,
        defaultValue: {
          transactionId: null,
          paymentGateway: null,
          paymentDate: null,
          paymentReference: null,
          cardLast4: null,
          bankDetails: {}
        }
      },
      
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: 'Due date must be a valid date'
          }
        }
      },
      
      remindersSent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: 'Reminders sent cannot be negative'
          }
        }
      },
      
      lastReminderSent: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      billingAddress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isValidAddress(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Billing address must be a valid JSON object');
            }
          }
        }
      },
      
      invoiceData: {
        type: DataTypes.JSONB,
        defaultValue: {
          lineItems: [],
          notes: null,
          terms: null,
          footer: null,
          customFields: {}
        }
      },
      
      generatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      viewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      downloadedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      reconciliationStatus: {
        type: DataTypes.ENUM('pending', 'reconciled', 'disputed', 'adjusted'),
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'reconciled', 'disputed', 'adjusted']],
            msg: 'Invalid reconciliation status'
          }
        }
      },
      
      reconciliationDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      reconciliationNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 1000],
            msg: 'Reconciliation notes cannot exceed 1000 characters'
          }
        }
      },
      
      auditInfo: {
        type: DataTypes.JSONB,
        defaultValue: {
          createdBy: null,
          approvedBy: null,
          approvedAt: null,
          auditTrail: []
        }
      },
      
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {
          source: 'system',
          version: '1.0',
          tags: [],
          customData: {}
        }
      },
      
      status: {
        type: DataTypes.ENUM('draft', 'generated', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'),
        defaultValue: 'draft',
        validate: {
          isIn: {
            args: [['draft', 'generated', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']],
            msg: 'Invalid status'
          }
        }
      },
      
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Notes cannot exceed 2000 characters'
          }
        }
      }
    }, {
      sequelize,
      modelName: 'BillingRecord',
      tableName: 'billing_records',
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft deletes
      indexes: [
        {
          fields: ['client_id']
        },
        {
          fields: ['invoice_number'],
          unique: true
        },
        {
          fields: ['payment_status']
        },
        {
          fields: ['status']
        },
        {
          fields: ['due_date']
        },
        {
          fields: ['billing_period_start', 'billing_period_end']
        },
        {
          fields: ['generated_at']
        },
        {
          fields: ['reconciliation_status']
        }
      ],
      hooks: {
        beforeCreate: (billingRecord) => {
          // Generate invoice number if not provided
          if (!billingRecord.invoiceNumber) {
            const timestamp = Date.now().toString();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            billingRecord.invoiceNumber = `INV-${timestamp}-${random}`;
          }
          
          // Calculate totals
          billingRecord.calculateTotals();
          
          // Set due date if not provided (default 30 days)
          if (!billingRecord.dueDate) {
            billingRecord.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
        },
        
        beforeUpdate: (billingRecord) => {
          // Recalculate totals if relevant fields changed
          if (billingRecord.changed('subscriptionFee') || 
              billingRecord.changed('usageCharges') || 
              billingRecord.changed('discounts') || 
              billingRecord.changed('taxes') || 
              billingRecord.changed('adjustments')) {
            billingRecord.calculateTotals();
          }
          
          // Update status based on payment status
          if (billingRecord.changed('paymentStatus')) {
            if (billingRecord.paymentStatus === 'paid') {
              billingRecord.status = 'paid';
              billingRecord.paymentDate = new Date();
            } else if (billingRecord.paymentStatus === 'overdue') {
              billingRecord.status = 'overdue';
            }
          }
        }
      }
    });
  }

  /**
   * Define associations
   */
  static associate(models) {
    // BillingRecord belongs to client
    this.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    
    // BillingRecord has many audit trails
    this.hasMany(models.AuditTrail, {
      foreignKey: 'entityId',
      as: 'auditTrails',
      scope: {
        entityType: 'billing_record'
      }
    });
  }

  /**
   * Instance method to calculate totals
   */
  calculateTotals() {
    // Calculate subtotal
    this.subtotal = parseFloat(this.subscriptionFee) + parseFloat(this.usageCharges);
    
    // Apply discounts
    const discounts = this.discounts || {};
    const discountAmount = discounts.totalDiscount || 0;
    const afterDiscount = this.subtotal - discountAmount;
    
    // Apply taxes
    const taxes = this.taxes || {};
    const taxAmount = taxes.totalTax || 0;
    
    // Apply adjustments
    const adjustments = this.adjustments || {};
    const adjustmentAmount = (adjustments.credits || 0) - 
                            (adjustments.penalties || 0) - 
                            (adjustments.refunds || 0) + 
                            (adjustments.other || 0);
    
    // Calculate total
    this.totalAmount = afterDiscount + taxAmount + adjustmentAmount;
    
    // Ensure total is not negative
    if (this.totalAmount < 0) {
      this.totalAmount = 0;
    }
  }

  /**
   * Instance method to calculate usage charges
   */
  calculateUsageCharges() {
    const usage = this.usageDetails || {};
    const rates = this.usageRates || {};
    
    let totalUsageCharges = 0;
    
    // Calculate charges for each usage type
    totalUsageCharges += (usage.documentsProcessed || 0) * (rates.perDocument || 0);
    totalUsageCharges += (usage.tonnageAudited || 0) * (rates.perTonne || 0);
    totalUsageCharges += (usage.apiCalls || 0) * (rates.perApiCall || 0);
    totalUsageCharges += (usage.reportsGenerated || 0) * (rates.perReport || 0);
    totalUsageCharges += (usage.storageUsed || 0) * (rates.perGBStorage || 0);
    
    // Add additional services
    if (usage.additionalServices && Array.isArray(usage.additionalServices)) {
      usage.additionalServices.forEach(service => {
        totalUsageCharges += service.amount || 0;
      });
    }
    
    this.usageCharges = totalUsageCharges;
    this.calculateTotals();
    
    return this.usageCharges;
  }

  /**
   * Instance method to apply discount
   */
  async applyDiscount(discountCode, discountAmount, discountPercentage = 0) {
    const discounts = this.discounts || { applied: [], totalDiscount: 0, discountPercentage: 0 };
    
    // Check if discount already applied
    if (discounts.applied.some(d => d.code === discountCode)) {
      throw new Error('Discount already applied');
    }
    
    let actualDiscount = discountAmount;
    if (discountPercentage > 0) {
      actualDiscount = this.subtotal * (discountPercentage / 100);
    }
    
    discounts.applied.push({
      code: discountCode,
      amount: actualDiscount,
      percentage: discountPercentage,
      appliedAt: new Date()
    });
    
    discounts.totalDiscount += actualDiscount;
    discounts.discountPercentage += discountPercentage;
    
    this.discounts = discounts;
    this.calculateTotals();
    
    return await this.save();
  }

  /**
   * Instance method to calculate taxes
   */
  calculateTaxes(gstRate = 18, serviceTaxRate = 0) {
    const taxableAmount = this.subtotal - (this.discounts.totalDiscount || 0);
    
    const gstAmount = taxableAmount * (gstRate / 100);
    const serviceTaxAmount = taxableAmount * (serviceTaxRate / 100);
    
    this.taxes = {
      gst: gstAmount,
      serviceTax: serviceTaxAmount,
      otherTaxes: 0,
      totalTax: gstAmount + serviceTaxAmount,
      taxBreakdown: [
        { type: 'GST', rate: gstRate, amount: gstAmount },
        { type: 'Service Tax', rate: serviceTaxRate, amount: serviceTaxAmount }
      ]
    };
    
    this.calculateTotals();
    return this.taxes;
  }

  /**
   * Instance method to mark as paid
   */
  async markAsPaid(paymentDetails) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    this.paymentDate = new Date();
    this.paymentDetails = { ...this.paymentDetails, ...paymentDetails };
    
    return await this.save();
  }

  /**
   * Instance method to mark as overdue
   */
  async markAsOverdue() {
    this.paymentStatus = 'overdue';
    this.status = 'overdue';
    
    return await this.save();
  }

  /**
   * Instance method to send reminder
   */
  async sendReminder() {
    this.remindersSent += 1;
    this.lastReminderSent = new Date();
    
    return await this.save();
  }

  /**
   * Instance method to generate invoice data
   */
  generateInvoiceData() {
    const lineItems = [];
    
    // Add subscription fee
    if (this.subscriptionFee > 0) {
      lineItems.push({
        description: `${this.subscriptionDetails.tier} Subscription`,
        period: `${this.billingPeriodStart.toDateString()} - ${this.billingPeriodEnd.toDateString()}`,
        quantity: 1,
        rate: this.subscriptionFee,
        amount: this.subscriptionFee
      });
    }
    
    // Add usage charges
    const usage = this.usageDetails || {};
    const rates = this.usageRates || {};
    
    if (usage.documentsProcessed > 0) {
      lineItems.push({
        description: 'Document Processing',
        quantity: usage.documentsProcessed,
        rate: rates.perDocument,
        amount: usage.documentsProcessed * rates.perDocument
      });
    }
    
    if (usage.tonnageAudited > 0) {
      lineItems.push({
        description: 'Tonnage Audited',
        quantity: usage.tonnageAudited,
        rate: rates.perTonne,
        amount: usage.tonnageAudited * rates.perTonne
      });
    }
    
    if (usage.apiCalls > 0) {
      lineItems.push({
        description: 'API Calls',
        quantity: usage.apiCalls,
        rate: rates.perApiCall,
        amount: usage.apiCalls * rates.perApiCall
      });
    }
    
    if (usage.reportsGenerated > 0) {
      lineItems.push({
        description: 'Reports Generated',
        quantity: usage.reportsGenerated,
        rate: rates.perReport,
        amount: usage.reportsGenerated * rates.perReport
      });
    }
    
    this.invoiceData = {
      ...this.invoiceData,
      lineItems,
      generatedAt: new Date()
    };
    
    return this.invoiceData;
  }

  /**
   * Static method to find by client
   */
  static findByClient(clientId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      startDate,
      endDate
    } = options;
    
    const where = { clientId };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      where.generatedAt = {};
      if (startDate) where.generatedAt[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.generatedAt[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const offset = (page - 1) * limit;
    
    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['generatedAt', 'DESC']],
      include: [
        {
          model: this.sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'name', 'organization']
        }
      ]
    });
  }

  /**
   * Static method to find overdue invoices
   */
  static findOverdue() {
    return this.findAll({
      where: {
        dueDate: {
          [this.sequelize.Op.lt]: new Date()
        },
        paymentStatus: ['pending', 'overdue']
      },
      order: [['dueDate', 'ASC']],
      include: [
        {
          model: this.sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'organization']
        }
      ]
    });
  }

  /**
   * Static method to get revenue statistics
   */
  static async getRevenueStatistics(options = {}) {
    const { startDate, endDate, clientId } = options;
    
    const where = {
      paymentStatus: 'paid'
    };
    
    if (clientId) where.clientId = clientId;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate[this.sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.paymentDate[this.sequelize.Op.lte] = new Date(endDate);
    }
    
    const revenueStats = await this.findAll({
      where,
      attributes: [
        [this.sequelize.fn('SUM', this.sequelize.col('total_amount')), 'totalRevenue'],
        [this.sequelize.fn('SUM', this.sequelize.col('subscription_fee')), 'subscriptionRevenue'],
        [this.sequelize.fn('SUM', this.sequelize.col('usage_charges')), 'usageRevenue'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'paidInvoices'],
        [this.sequelize.fn('AVG', this.sequelize.col('total_amount')), 'averageInvoiceAmount']
      ],
      raw: true
    });
    
    const monthlyStats = await this.findAll({
      where,
      attributes: [
        [this.sequelize.fn('DATE_TRUNC', 'month', this.sequelize.col('payment_date')), 'month'],
        [this.sequelize.fn('SUM', this.sequelize.col('total_amount')), 'revenue'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'invoices']
      ],
      group: [this.sequelize.fn('DATE_TRUNC', 'month', this.sequelize.col('payment_date'))],
      order: [[this.sequelize.fn('DATE_TRUNC', 'month', this.sequelize.col('payment_date')), 'ASC']],
      raw: true
    });
    
    return {
      overall: revenueStats[0],
      monthly: monthlyStats
    };
  }

  /**
   * Static method to generate monthly invoices
   */
  static async generateMonthlyInvoices(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Get all active clients
    const clients = await this.sequelize.models.Client.findAll({
      where: {
        status: 'active'
      }
    });
    
    const generatedInvoices = [];
    
    for (const client of clients) {
      // Check if invoice already exists for this period
      const existingInvoice = await this.findOne({
        where: {
          clientId: client.id,
          billingPeriodStart: startDate,
          billingPeriodEnd: endDate
        }
      });
      
      if (!existingInvoice) {
        // Calculate usage for the period
        const usage = await this.calculateClientUsage(client.id, startDate, endDate);
        
        // Create new invoice
        const invoice = await this.create({
          clientId: client.id,
          billingPeriodStart: startDate,
          billingPeriodEnd: endDate,
          subscriptionDetails: {
            tier: client.subscriptionTier,
            planName: `${client.subscriptionTier} Plan`,
            features: client.permissions,
            limits: client.limits
          },
          subscriptionFee: this.getSubscriptionFee(client.subscriptionTier),
          usageDetails: usage,
          usageRates: this.getUsageRates(client.subscriptionTier),
          billingAddress: client.contactInfo.address || {},
          currency: 'USD'
        });
        
        // Calculate usage charges and taxes
        invoice.calculateUsageCharges();
        invoice.calculateTaxes();
        invoice.generateInvoiceData();
        
        await invoice.save();
        generatedInvoices.push(invoice);
      }
    }
    
    return generatedInvoices;
  }

  /**
   * Static method to calculate client usage
   */
  static async calculateClientUsage(clientId, startDate, endDate) {
    // This would typically query various tables to calculate usage
    // For now, returning mock data
    return {
      documentsProcessed: 50,
      tonnageAudited: 100.5,
      apiCalls: 1500,
      reportsGenerated: 5,
      storageUsed: 2.5,
      additionalServices: []
    };
  }

  /**
   * Static method to get subscription fee
   */
  static getSubscriptionFee(tier) {
    const fees = {
      basic: 99,
      professional: 299,
      enterprise: 999
    };
    return fees[tier] || 0;
  }

  /**
   * Static method to get usage rates
   */
  static getUsageRates(tier) {
    const rates = {
      basic: {
        perDocument: 0.5,
        perTonne: 2.0,
        perApiCall: 0.01,
        perReport: 5.0,
        perGBStorage: 1.0
      },
      professional: {
        perDocument: 0.3,
        perTonne: 1.5,
        perApiCall: 0.005,
        perReport: 3.0,
        perGBStorage: 0.5
      },
      enterprise: {
        perDocument: 0.1,
        perTonne: 1.0,
        perApiCall: 0.001,
        perReport: 1.0,
        perGBStorage: 0.25
      }
    };
    return rates[tier] || rates.basic;
  }

  /**
   * Instance method to check if overdue
   */
  isOverdue() {
    return new Date() > this.dueDate && this.paymentStatus !== 'paid';
  }

  /**
   * Instance method to get days overdue
   */
  getDaysOverdue() {
    if (!this.isOverdue()) return 0;
    
    const diffTime = new Date() - this.dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Instance method to get formatted amount
   */
  getFormattedAmount() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.totalAmount);
  }
}

export default BillingRecord;