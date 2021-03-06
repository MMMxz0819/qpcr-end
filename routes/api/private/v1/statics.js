var express = require('express')
var router = express.Router()
var path = require('path')
var logger = require('../../../../modules/logger.js').logger()

// 获取验证模块
var authorization = require(path.join(process.cwd(), '/modules/authorization'))

// 通过验证模块获取分类管理
var staticServ = authorization.getService('StaticService')

// 检测数据列表
router.get(
  '/',

  function (req, res, next) {
    if (!req.query.pagenum || req.query.pagenum <= 0)
      return res.sendResult(null, 400, 'pagenum 参数错误')
    if (!req.query.pagesize || req.query.pagesize <= 0)
      return res.sendResult(null, 400, 'pagesize 参数错误')
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var conditions = {
      pagenum: req.query.pagenum,
      pagesize: req.query.pagesize,
    }
    if (req.query.create_time) {
      conditions['create_time'] = req.query.create_time
    }

    if (req.query.positive) {
      conditions['positive'] = req.query.positive
    }

    if (req.query.static_number) {
      conditions['static_number'] = req.query.static_number
    }

    if (req.query.static_id) {
      conditions['static_id'] = req.query.static_id
    }

    if (req.query.user_id) {
      conditions['user_id'] = req.query.user_id
    }
    if (req.query.test_name) {
      conditions['test_name'] = req.query.test_name
    }
    if (req.query.static_path) {
      conditions['static_path'] = req.query.static_path
    }
    if (req.query.static_chip) {
      conditions['static_chip'] = req.query.static_chip
    }
    if (req.query.chart) {
      conditions['chart'] = req.query.chart
    }

    staticServ.getAllStatics(conditions, function (err, result) {
      if (err) return res.sendResult(null, 400, err)
      res.sendResult(result, 200, '获取成功')
    })(req, res, next)
  }
)
// 添加检测数据
router.post(
  '/',

  function (req, res, next) {
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var params = req.body
    staticServ.createStatic(params, function (err, newStatic) {
      if (err) {
        logger.debug(`添加检测数据错误:${err}`)
        return res.sendResult(null, 400, err)
      }
      logger.debug(`添加检测数据: id${newStatic.static_id}`)
      return res.sendResult(newStatic, 201, '创建检测数据成功')
    })(req, res, next)
  }
)
// 更新检测数据
router.put(
  '/:id',

  function (req, res, next) {
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var params = req.body
    console.log(params)
    staticServ.updateStatic(req.params.id, params, function (err, newStatic) {
      if (err) {
        console.log(err)
        return res.sendResult(null, 400, err)
      }
      return res.sendResult(newStatic, 201, '更新检测数据成功')
    })(req, res, next)
  }
)
// 获取检测数据详情
router.get('/:id', function (req, res, next) {
  staticServ.getStatic(req.params.id, function (err, result) {
    if (err) return res.sendResult(null, 400, err)

    return res.sendResult(result, 200, '获取成功')
  })(req, res, next)
})
//删除检测数据
router.delete(
  '/:id',

  function (req, res, next) {
    if (!req.params.id) {
      return res.sendResult(null, 400, '检测ID不能为空')
    }
    if (isNaN(parseInt(req.params.id)))
      return res.sendResult(null, 400, '检测ID必须是数字')
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    staticServ.deleteStatic(req.params.id, function (err) {
      if (err) {
        logger.debug(`删除检测数据错误:${err}`)
        return res.sendResult(null, 400, '删除失败')
      } else {
        logger.debug(`删除检测数据: id${req.params.id}`)
        return res.sendResult(null, 200, '删除成功')
      }
    })(req, res, next)
  }
)

module.exports = router
