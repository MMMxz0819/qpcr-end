module.exports = function (db, callback) {
  // 用户模型
  db.define(
    'StaticChipModel',
    {
      id: { type: 'serial', key: true },
      static_id: Number,
      chip_id: Number,
      chip_price: Number,
      chip_number: Number,
      chip_total_price: Number,
    },
    {
      table: 'sp_static_chip',
    }
  )
  return callback()
}
