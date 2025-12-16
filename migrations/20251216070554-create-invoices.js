'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },

      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      selected_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      platform_charge_type: Sequelize.STRING(50),

      platform_charge: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      wallet_recharge: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      setup_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      customization_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      additional_fee: {
        type: Sequelize.JSON,
        defaultValue: [],
      },

      sub_total: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      discount: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },

      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      amount_after_discount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      GST: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      GST_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      total: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      quotation_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      quotation_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      quotation_valid_until_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      quotation_invoice_pdf_url: Sequelize.STRING(500),

      proforma_invoice: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      proforma_number: {
        type: Sequelize.STRING(50),
        unique: true,
      },

      proforma_date: Sequelize.DATEONLY,
      proforma_valid_until_date: Sequelize.DATEONLY,

      payment_url: Sequelize.JSON,

      proforma_invoice_pdf_url: Sequelize.STRING(500),

      payment_receipt: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      payment_status: {
        type: Sequelize.ENUM('unpaid', 'paid', 'expired'),
        defaultValue: 'unpaid',
      },

      payment_id: Sequelize.STRING(255),
      razorpay_payment_id: Sequelize.STRING(255),
      payment_method: Sequelize.STRING(50),
      razorpay_signature: Sequelize.TEXT,

      paid_at: Sequelize.DATE,
      payment_metadata: Sequelize.JSON,
      payment_invoice_pdf_url: Sequelize.STRING(500),

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ),
      },
    });

    // indexes (explicit, safe)
    await queryInterface.addIndex('invoices', ['quotation_number']);
    await queryInterface.addIndex('invoices', ['proforma_number']);
    await queryInterface.addIndex('invoices', ['payment_id']);
    await queryInterface.addIndex('invoices', ['email']);
    await queryInterface.addIndex('invoices', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
  },
};
