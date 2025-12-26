const { DataTypes, Model } = require('sequelize');

class BankInfo extends Model {
    toJSON() {
        const values = { ...this.get() };
        return values;
    }

    static initModel(sequelize) {
        BankInfo.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                account_name: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'Account name is required' },
                        len: {
                            args: [2, 100],
                            msg: 'Account name must be between 2 and 100 characters',
                        },
                    },
                    set(value) {
                        this.setDataValue('account_name', value.trim());
                    },
                },
                bank_name: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'Bank name is required' },
                    },
                    set(value) {
                        this.setDataValue('bank_name', value.trim());
                    },
                },
                account_number: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'Account number is required' },
                        isNumeric: { msg: 'Account number must contain only digits' },
                        len: {
                            args: [9, 20],
                            msg: 'Account number must be between 9 and 20 digits',
                        },
                    },
                    set(value) {
                        this.setDataValue('account_number', value.trim());
                    },
                },
                branch: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'Branch is required' },
                    },
                    set(value) {
                        this.setDataValue('branch', value.trim());
                    },
                },
                ifsc_code: {
                    type: DataTypes.STRING(11),
                    allowNull: false,
                    validate: {
                        notEmpty: { msg: 'IFSC code is required' },
                        len: {
                            args: [11, 11],
                            msg: 'IFSC code must be exactly 11 characters',
                        },
                        is: {
                            args: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                            msg: 'Invalid IFSC code format',
                        },
                    },
                    set(value) {
                        this.setDataValue('ifsc_code', value.toUpperCase().trim());
                    },
                },
                account_type: {
                    type: DataTypes.ENUM('savings', 'current', 'salary', 'other'),
                    defaultValue: 'savings',
                    allowNull: false,
                },
                is_primary: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                    allowNull: false,
                },
                status: {
                    type: DataTypes.ENUM('active', 'inactive', 'closed'),
                    defaultValue: 'active',
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: 'BankInfo',
                tableName: 'bank_info',
                timestamps: true,
                underscored: true,
                indexes: [
                    { fields: ['account_number'] },
                    { fields: ['ifsc_code'] },
                    { fields: ['status'] },
                    { fields: ['is_primary'] },
                    { fields: ['created_at'] },
                ],
            }
        );

        return BankInfo;
    }
}

module.exports = BankInfo;