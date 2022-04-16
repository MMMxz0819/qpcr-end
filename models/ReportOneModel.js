module.exports = function (db, callback) {
  // 报表模型1
  db.define(
    'ReportOneModel',
    {
      id: { type: 'serial', key: true },
      rp1_total: String,
      rp1_month: String,
      rp1_date: { type: 'date', time: false },
      rp2_total: String,
      rp2_month: String,
      rp3_total: String,
      rp3_month: String,
    },
    {
      table: 'sp_report_1',
    }
  )
  return callback()
}
