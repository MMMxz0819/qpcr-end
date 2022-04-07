module.exports = function (db, callback) {
  // 用户模型
  db.define(
    'StaticModel',
    {
      static_id: { type: 'serial', key: true },
      user_id: Number,
      static_number: String,
      static_price: Number,
      static_chip: [1, 2, 3],
      test_name: ['个人', '公司'],
      static_path: String,
      // order_fapiao_content : String,
      consignee_addr: String,
      pay_status: ['0', '1'],
      create_time: Number,
      update_time: Number,
      is_del: ['0', '1'], // 0: 正常 , 1: 删除
      delete_time: Number,
    },
    {
      table: 'sp_statics',
    }
  )
  return callback()
}
