module.exports = function (db, callback) {
  // 用户模型
  db.define(
    'ChipPicModel',
    {
      pics_id: { type: 'serial', key: true },
      chip_id: Number,
      pics_big: String,
      pics_mid: String,
      pics_sma: String,
    },
    {
      table: 'sp_chip_pics',
    }
  )
  return callback()
}
