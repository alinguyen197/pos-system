'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()
    await queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Nguyễn Văn Admin',
          email: 'admin@skycoffee.vn',
          password: '123123',
          role: 'admin',
          status: 'active',
          avatarUrl: 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png',
          otpEnabled: false,
          otpVerified: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Trần Thị Quản Lý',
          email: 'manager@skycoffee.vn',
          password: '123123',
          role: 'manager',
          status: 'active',
          avatarUrl: 'https://primefaces.org/cdn/primevue/images/avatar/asiyahyellip.png',
          otpEnabled: false,
          otpVerified: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Lê Thu Ngân',
          email: 'staff@skycoffee.vn',
          password: '123123',
          role: 'staff',
          status: 'active',
          avatarUrl: 'https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png',
          otpEnabled: false,
          otpVerified: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Phạm Người Xem',
          email: 'viewer@skycoffee.vn',
          password: '123123',
          role: 'viewer',
          status: 'active',
          avatarUrl: 'https://primefaces.org/cdn/primevue/images/avatar/ionibowcher.png',
          otpEnabled: false,
          otpVerified: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { ignoreDuplicates: true }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {})
  },
}
