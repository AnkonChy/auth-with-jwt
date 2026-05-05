"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "firstName", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("users", "lastName", {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "firstName");
    await queryInterface.removeColumn("users", "lastName");
  },
};
