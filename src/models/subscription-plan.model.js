const { DataTypes, Model } = require('sequelize');

class SubscriptionPlan extends Model {
    static initModel(sequelize) {
        SubscriptionPlan.init(
            {
                id: {
                    type: DataTypes.BIGINT.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                },
                uuid: {
                    type: DataTypes.CHAR(50),
                    allowNull: false,
                    unique: true,
                },
                name: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                price: {
                    type: DataTypes.DECIMAL(23, 2),
                    allowNull: false,
                },
                period: {
                    type: DataTypes.ENUM('monthly', 'yearly'),
                    allowNull: false,
                },
                metadata: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    get() {
                        const rawValue = this.getDataValue('metadata');
                        try {
                            return rawValue ? JSON.parse(rawValue) : {};
                        } catch (e) {
                            return rawValue;
                        }
                    },
                    set(value) {
                        this.setDataValue('metadata', typeof value === 'string' ? value : JSON.stringify(value));
                    }
                },
                status: {
                    type: DataTypes.ENUM('active', 'inactive', 'deleted'),
                    allowNull: false,
                    defaultValue: 'active',
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                deleted_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: 'SubscriptionPlan',
                tableName: 'subscription_plans',
                timestamps: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                deletedAt: 'deleted_at',
                paranoid: true, // Enables soft deletes with deleted_at
                underscored: true,
                freezeTableName: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
            }
        );

        return SubscriptionPlan;
    }

    // Helper method to check if plan is active
    isActive() {
        return this.status === 'active';
    }

    // Helper method to get formatted price
    getFormattedPrice() {
        return `$${parseFloat(this.price).toFixed(2)}`;
    }
}

module.exports = SubscriptionPlan;