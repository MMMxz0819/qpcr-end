var path = require('path')
daoModule = require('./DAO')
databaseModule = require(path.join(process.cwd(), 'modules/database'))

/**
 * 获取参数列表数据
 *
 * @param  {[type]}   start 开始时间
 * @param  {[type]}   end    结束时间
 * @param  {Function} cb     回调函数
 */

module.exports.timeList = function (start, end, pagesize, cb) {
  db = databaseModule.getDatabase()
  sqlcount =
    'SELECT COUNT(*) AS `c` FROM `sp_statics` WHERE `create_time` > ? AND `create_time`< ?'
  sql =
    'SELECT * FROM sp_statics WHERE `create_time` >= ? AND `create_time`<= ? '
  sqlDate = //
    'SELECT * FROM sp_statics WHERE `create_time` >= ? AND `create_time`<= ? group by FROM_UNIXTIME(create_time,"%Y%m%d");'
  // sql =
  //   'SELECT DATE(create_time) AS create_time, COUNT(*) AS num FROM sp_statics WHERE `create_time` > ? AND `create_time`< ? '
  database.driver.execQuery(sqlDate, [start, end], function (err, date) {
    console.log(err)
    if (err) return cb('查询执行出错')
    database.driver.execQuery(sql, [start, end], function (err, statics) {
      if (err) {
        console.log(err)
        return cb('查询执行出错')
      }
      // console.log(statics)
      cb(null, statics, date)
    })
  })
}
