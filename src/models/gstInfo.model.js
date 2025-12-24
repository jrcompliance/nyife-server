const { DataTypes, Model } = require('sequelize');

class GstInfo extends Model {
    toJSON() {
        const values = { ...this.get() };
        return values;
    }

    static initModel(sequelize) {
        GstInfo.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                gst_number: {
                    type: DataTypes.STRING(15),
                    allowNull: false,
                    unique: true,
                    validate: {
                        notEmpty: { msg: 'GST number is required' },
                        len: {
                            args: [15, 15],
                            msg: 'GST number must be exactly 15 characters',
                        },
                        is: {
                            args: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                            msg: 'Invalid GST number format',
                        },
                    },
                    set(value) {
                        this.setDataValue('gst_number', value.toUpperCase().trim());
                    },
                },
                status: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                    allowNull: false,
                },
                gst_data: {
                    type: DataTypes.JSON,
                    defaultValue: null,
                    allowNull: true,
                },
                requested_at: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW,
                },
                completed_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: 'GstInfo',
                tableName: 'gst_info',
                timestamps: true,
                underscored: true,
                indexes: [
                    { fields: ['gst_number'], unique: true },
                    { fields: ['status'] },
                    { fields: ['created_at'] },
                ],
            }
        );

        return GstInfo;
    }
}

module.exports = GstInfo;