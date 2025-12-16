const { DataTypes, Model } = require('sequelize');

class Invoice extends Model {
    toJSON() {
        const values = { ...this.get() };
        return values;
    }

    static initModel(sequelize) {
        Invoice.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4, // auto-generates UUID v4
                    primaryKey: true,
                    allowNull: false,
                },
                company_name: {
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'Company name is required' },
                    },
                },
                contact_person: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'Contact person is required' },
                    },
                },
                phone: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'Phone is required' },
                    },
                },
                email: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    validate: {
                        isEmail: { msg: 'Please provide a valid email' },
                        notEmpty: { msg: 'Email is required' },
                    },
                },
                address: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                selected_plan_id: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                platform_charge_type: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                platform_charge: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                wallet_recharge: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                setup_fee: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                customization_fee: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                // additional_fee: {
                //     type: DataTypes.JSON,
                //     defaultValue: [],
                // },
                additional_fee: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    defaultValue: null,
                }
                ,
                sub_total: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                discount: {
                    type: DataTypes.DECIMAL(5, 2),
                    defaultValue: 0,
                },
                discount_amount: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                amount_after_discount: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                // GST: {
                //     type: DataTypes.DECIMAL(10, 2),
                //     defaultValue: 0,
                // },
                // GST_amount: {
                //     type: DataTypes.DECIMAL(10, 2),
                //     defaultValue: 0,
                // },
                GST: {
                    type: DataTypes.DECIMAL(10, 2),
                    field: 'GST',
                    defaultValue: 0,
                },

                GST_amount: {
                    type: DataTypes.DECIMAL(10, 2),
                    field: 'GST_amount',
                    defaultValue: 0,
                },

                total: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0,
                },
                quotation_number: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    unique: true,
                },
                quotation_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
                },
                quotation_valid_until_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
                },
                quotation_invoice_pdf_url: {
                    type: DataTypes.STRING(500),
                    allowNull: true,
                },
                proforma_invoice: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                proforma_number: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    unique: true,
                },
                proforma_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                },
                proforma_valid_until_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                },
                payment_url: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                proforma_invoice_pdf_url: {
                    type: DataTypes.STRING(500),
                    allowNull: true,
                },
                payment_receipt: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                // payment_receipt_number: {
                //     type: DataTypes.STRING(50),
                //     allowNull: true,
                // },
                // payment_reference_number: {
                //     type: DataTypes.STRING(100),
                //     allowNull: true,
                // },
                // payment_receipt_date: {
                //     type: DataTypes.DATEONLY,
                //     allowNull: true,
                // },
                // payment_method: {
                //     type: DataTypes.STRING(50),
                //     allowNull: true,
                // },
                // payment_amount: {
                //     type: DataTypes.DECIMAL(10, 2),
                //     defaultValue: 0,
                // },
                payment_status: {
                    type: DataTypes.ENUM('unpaid', 'paid', 'expired'),
                    defaultValue: 'unpaid',
                },
                payment_id: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                razorpay_payment_id: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                payment_method: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                razorpay_signature: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                paid_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                payment_metadata: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                payment_invoice_pdf_url: {
                    type: DataTypes.STRING(500),
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: 'Invoice',
                tableName: 'invoices',
                timestamps: true,
                underscored: true,
                indexes: [
                    { fields: ['quotation_number'] },
                    { fields: ['proforma_number'] },
                    { fields: ['payment_id'] },
                    { fields: ['email'] },
                    { fields: ['created_at'] },
                ],
            }
        );
        return Invoice;
    }
}

module.exports = Invoice;