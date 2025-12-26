'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bank_info', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      account_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the account holder',
      },
      bank_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the bank',
      },
      account_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Bank account number',
      },
      branch: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Bank branch name',
      },
      ifsc_code: {
        type: Sequelize.STRING(11),
        allowNull: false,
        comment: 'IFSC code of the bank branch',
      },
      account_type: {
        type: Sequelize.ENUM('savings', 'current', 'salary', 'other'),
        defaultValue: 'savings',
        allowNull: false,
        comment: 'Type of bank account',
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether this is the primary bank account',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'closed'),
        defaultValue: 'active',
        allowNull: false,
        comment: 'Status of the bank account',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: 'Stores bank account information',
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('bank_info', ['account_number'], {
      name: 'idx_bank_info_account_number',
      using: 'BTREE',
    });

    await queryInterface.addIndex('bank_info', ['ifsc_code'], {
      name: 'idx_bank_info_ifsc_code',
      using: 'BTREE',
    });

    await queryInterface.addIndex('bank_info', ['status'], {
      name: 'idx_bank_info_status',
      using: 'BTREE',
    });

    await queryInterface.addIndex('bank_info', ['is_primary'], {
      name: 'idx_bank_info_is_primary',
      using: 'BTREE',
    });

    await queryInterface.addIndex('bank_info', ['created_at'], {
      name: 'idx_bank_info_created_at',
      using: 'BTREE',
    });

    // Composite index for common queries
    await queryInterface.addIndex('bank_info', ['status', 'is_primary'], {
      name: 'idx_bank_info_status_primary',
      using: 'BTREE',
    });

    // Full-text search index for search functionality (optional, for MySQL)
    // Uncomment if you need full-text search capabilities
    /*
    await queryInterface.sequelize.query(`
        ALTER TABLE bank_info 
        ADD FULLTEXT INDEX idx_bank_info_search (account_name, bank_name, branch)
    `);
    */
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('bank_info', 'idx_bank_info_status_primary');
    await queryInterface.removeIndex('bank_info', 'idx_bank_info_created_at');
    await queryInterface.removeIndex('bank_info', 'idx_bank_info_is_primary');
    await queryInterface.removeIndex('bank_info', 'idx_bank_info_status');
    await queryInterface.removeIndex('bank_info', 'idx_bank_info_ifsc_code');
    await queryInterface.removeIndex('bank_info', 'idx_bank_info_account_number');

    // Drop the table
    await queryInterface.dropTable('bank_info');
  }
};