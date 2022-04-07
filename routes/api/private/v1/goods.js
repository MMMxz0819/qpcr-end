var express = require('express')
var router = express.Router()
var path = require('path')
var logger = require('../../../../modules/logger.js').logger()

// 获取验证模块
var authorization = require(path.join(process.cwd(), '/modules/authorization'))

// 通过验证模块获取分类管理
var chipServ = authorization.getService('GoodService')

// 芯片列表
router.get(
  '/',
  // 验证参数
  function (req, res, next) {
    // 参数验证
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

    if (req.query.query) {
      conditions['query'] = req.query.query
    }
    chipServ.getAllChips(conditions, function (err, result) {
      if (err) return res.sendResult(null, 400, err)
      res.sendResult(result, 200, '获取成功')
    })(req, res, next)
  }
)

// 添加芯片
router.post(
  '/',
  // 参数验证
  function (req, res, next) {
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var params = req.body
    chipServ.createChip(params, function (err, newGood) {
      if (err) return res.sendResult(null, 400, err)
      res.sendResult(newGood, 201, '创建芯片成功')
    })(req, res, next)
  }
)

// 更新芯片
router.put(
  '/:id',
  // 参数验证
  function (req, res, next) {
    if (!req.params.id) {
      return res.sendResult(null, 400, '芯片ID不能为空')
    }
    if (isNaN(parseInt(req.params.id)))
      return res.sendResult(null, 400, '芯片ID必须是数字')
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var params = req.body
    chipServ.updateChip(req.params.id, params, function (err, newGood) {
      if (err) return res.sendResult(null, 400, err)
      res.sendResult(newGood, 200, '创建芯片成功')
    })(req, res, next)
  }
)

// 获取芯片详情
router.get(
  '/:id',
  // 参数验证
  function (req, res, next) {
    if (!req.params.id) {
      return res.sendResult(null, 400, '芯片ID不能为空')
    }
    if (isNaN(parseInt(req.params.id)))
      return res.sendResult(null, 400, '芯片ID必须是数字')
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    chipServ.getChipById(req.params.id, function (err, good) {
      if (err) return res.sendResult(null, 400, err)
      return res.sendResult(good, 200, '获取成功')
    })(req, res, next)
  }
)

// 删除芯片
router.delete(
  '/:id',
  // 参数验证
  function (req, res, next) {
    if (!req.params.id) {
      return res.sendResult(null, 400, '芯片ID不能为空')
    }
    if (isNaN(parseInt(req.params.id)))
      return res.sendResult(null, 400, '芯片ID必须是数字')
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    chipServ.deleteChip(req.params.id, function (err) {
      if (err) {
        logger.debug(`删除芯片错误:${err}`)
        return res.sendResult(null, 400, '删除失败')
      } else {
        logger.debug(`删除芯片: id${req.params.id}`)
        return res.sendResult(null, 200, '删除成功')
      }
    })(req, res, next)
  }
)

// 更新芯片的图片
router.put(
  '/:id/pics',
  // 参数验证
  function (req, res, next) {
    if (!req.params.id) {
      return res.sendResult(null, 400, '芯片ID不能为空')
    }
    if (isNaN(parseInt(req.params.id)))
      return res.sendResult(null, 400, '芯片ID必须是数字')
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    chipServ.updateChipPics(req.params.id, req.body, function (err, good) {
      if (err) return res.sendResult(null, 400, err)
      res.sendResult(good, 200, '更新成功')
    })(req, res, next)
  }
)

module.exports = router
