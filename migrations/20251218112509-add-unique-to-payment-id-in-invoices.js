'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('invoices', ['payment_id'], {
      unique: true,
      name: 'uniq_invoices_payment_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('invoices', 'uniq_invoices_payment_id');
  }
};
