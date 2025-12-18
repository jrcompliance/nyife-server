'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // 1️⃣ Add columns as NULLABLE first (safe for existing prod data)
    await queryInterface.addColumn('invoices', 'signature', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('invoices', 'designation', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    // 2️⃣ Populate existing rows with default values
    await queryInterface.sequelize.query(`
      UPDATE invoices
      SET 
        signature = 'Abhishek Anand',
        designation = 'Business Manager'
      WHERE signature IS NULL OR designation IS NULL
    `);

    // 3️⃣ Alter columns to NOT NULL
    await queryInterface.changeColumn('invoices', 'signature', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    await queryInterface.changeColumn('invoices', 'designation', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback support
    await queryInterface.removeColumn('invoices', 'signature');
    await queryInterface.removeColumn('invoices', 'designation');
  }
};
