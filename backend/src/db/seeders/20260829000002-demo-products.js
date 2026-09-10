'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'products',
      [
        {
          id: 1,
          code: 'SP-001',
          name: 'Cà phê Robusta Đậm Đà',
          categoryId: 1,
          sellingPrice: 29000,
          costPrice: 8500,
          unit: 'ly',
          status: 'Đang kinh doanh',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV',
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          code: 'SP-002',
          name: 'Cà phê Arabica Thơm Nhẹ',
          categoryId: 1,
          sellingPrice: 35000,
          costPrice: 11200,
          unit: 'ly',
          status: 'Đang kinh doanh',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBqEoSpO7sabLc4VV632hOk0CGaeFX1Cg501iVi1Ar2nqAafWnOjymGymigHF_hBts_uw-3tGp-wXoB4vaFm5DIzZVVXr6T3ZWgFlq4aD5nRl5qZnUUBNC4_VOQEmypnM-p08qPrBOJ9rfrAnA24KUrfZE0HyR4KSwkatSIT5_mWD8b2MaBxqqKHFTtup3Q9oUxb0ApPGPcbRNqgVgTjAF7cF8I2SZG52NOUJFL9C2LleJ0Wm1InJvB',
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          code: 'SP-003',
          name: 'Bạc xỉu Sài Gòn',
          categoryId: 1,
          sellingPrice: 32000,
          costPrice: 9800,
          unit: 'ly',
          status: 'Đang kinh doanh',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuB5s3vZRGHW-l9un_Pku9yhvejdxLJD-OPfHm88Lc0T2AN7J6Os0hUMTGwyEIsYWrXV2BRsx0QeEy1vBfkKG4Mx8WSlQ00T_yhtFDukz-1LSmzY566Oum2kVS2Hl0b_ZQ_kOW0NbJx7c0MfdZkoGMZKdnW_Hsxp3GolG21jiq5uOA8-hVgLYaoRT3O1xtw1gEFUY3yB1jxBkPXnzvI-CFwBu3Ngx7OT8_SKrA4yzA_cYxiBBS5DM9aV',
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          code: 'SP-004',
          name: 'Trà Đào Cam Sả 500ml',
          categoryId: 2,
          sellingPrice: 39000,
          costPrice: 12000,
          unit: 'ly',
          status: 'Đang kinh doanh',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAEtTm6pTGbLow16KABXdZLsrIwGzBRg4tmDvFE1rgWFsLEYX1mcgn-Oy0kaBXX2dE6pZSDnoLLhJT4sgkqRY96E8Bk-72tMP-dEdf6hzqIF162y_5gOxXp5dPWaIh-_VzL0iRW4fskgiuQNC_FcO4557wktZUMOVCTNRscpMAhmA7kL6ZTo4qJ9Lg6naecRht5RdpFki-9oJZgpfzyuEIqGJn-WYxozNQapNFPPyEANR4v4JDcWehF',
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 5,
          code: 'SP-005',
          name: 'Matcha Latte Thượng Hạng',
          categoryId: 2,
          sellingPrice: 45000,
          costPrice: 15500,
          unit: 'ly',
          status: 'Tạm ngừng',
          imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBSWAbRm_EQsNzK83sJ9di8hFEK-Updg1TJJTlYEVySdSDxA0xIcT6GJVMUBE3urK0iBwXu4VRQCFNjQiPmEypHoa1uZfXspNczwUXOnMvryvPD7tPMEP_dW7CGj__ZR2PcEs1k-iShPtGftXRhtcIEWVrKdSBmowp55hL2bri-KYNmaHGTEgxtWvhfTaTSRQZxYgAB9btYosrNFj8KaqHMB-q1cktZknQl3GsaDGvFYMQi5Z9uXs2p',
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {})
  },
}
