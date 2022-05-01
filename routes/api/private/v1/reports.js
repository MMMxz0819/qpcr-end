var express = require('express')
var router = express.Router()
var path = require('path')

// 获取验证模块
var authorization = require(path.join(process.cwd(), '/modules/authorization'))

// 通过验证模块获取用户管理服务
var reportsServ = authorization.getService('ReportsService')

// /:typeid
router.get(
  '/type',
  function (req, res, next) {
    if (!req.query.typeid) {
      return res.sendResult(null, 400, '报表类型不能为空')
    }
    if (isNaN(parseInt(req.query.typeid)))
      return res.sendResult(null, 400, '报表类型必须是数字')
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    if (req.query.chip) {
      console.log('hasChip')
      reportsServ.reports(
        req.query.typeid,
        function (err, result) {
          if (err) return res.sendResult(null, 400, err)
          res.sendResult(result, 200, '获取报表成功')
        },
        req.query.chip,
        req.query.create_time ? req.query.create_time[0] : null,
        req.query.create_time ? req.query.create_time[1] : null
      )(req, res, next)
    } else {
      reportsServ.reports(req.query.typeid, function (err, result) {
        if (err) return res.sendResult(null, 400, err)
        res.sendResult(result, 200, '获取报表成功')
      })(req, res, next)
    }
  }
)

module.exports = router
