'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('gst_info', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      gst_number: {
        type: Sequelize.STRING(15),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      gst_data: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      requested_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('gst_info', ['gst_number'], {
      unique: true,
      name: 'idx_gst_number_unique',
    });

    await queryInterface.addIndex('gst_info', ['status'], {
      name: 'idx_gst_status',
    });

    await queryInterface.addIndex('gst_info', ['created_at'], {
      name: 'idx_gst_created_at',
    });

    console.log('✅ Table gst_info created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('gst_info');
    console.log('✅ Table gst_info dropped successfully');
  }
};
