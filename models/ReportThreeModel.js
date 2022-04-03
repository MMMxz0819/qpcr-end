module.exports = function (db, callback) {
  // 报表模型1
  db.define(
    'ReportThreeModel',
    {
      id: { type: 'serial', key: true },
      rp3_1: Number,
      rp3_2: Number,
      rp3_3: Number,
      rp3_yinyang: Number,
      rp3_x: String,
      rp3_y: String,
      rp3_date: { type: 'date', time: false },
    },
    {
      table: 'sp_report_3',
    }
  )
  return callback()
}
