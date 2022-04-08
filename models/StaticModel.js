module.exports = function (db, callback) {
  // 用户模型
  db.define(
    'StaticModel',
    {
      static_id: { type: 'serial', key: true },
      user_id: Number,
      static_number: String,
      static_chip: [1, 2, 3],
      test_name: String,
      static_path: String,
      create_time: Number,
      update_time: Number,
      is_del: ['0', '1'], // 0: 正常 , 1: 删除
      delete_time: Number,
      positive: ['0', '1'], // 0: 阴 , 1: 阳
    },
    {
      table: 'sp_statics',
    }
  )
  return callback()
}
