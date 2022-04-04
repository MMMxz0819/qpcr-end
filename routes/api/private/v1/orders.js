var express = require('express')
var router = express.Router()
var path = require('path')

// 获取验证模块
var authorization = require(path.join(process.cwd(), '/modules/authorization'))

// 通过验证模块获取分类管理
var orderServ = authorization.getService('OrderService')

// 订单列表
router.get(
  '/',
  // 参数验证
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
    if (req.query.create_time) {
      conditions['create_time'] = req.query.create_time
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
    if (req.query.pay_status) {
      conditions['pay_status'] = req.query.pay_status
    }
    if (req.query.test_name) {
      conditions['test_name'] = req.query.test_name
    }
    if (req.query.static_path) {
      conditions['static_path'] = req.query.static_path
    }
    // if (req.query.order_fapiao_content) {
    //   conditions['order_fapiao_content'] = req.query.order_fapiao_content
    // }
    if (req.query.consignee_addr) {
      conditions['consignee_addr'] = req.query.consignee_addr
    }
    if (req.query.chart) {
      conditions['chart'] = req.query.chart
    }

    orderServ.getAllOrders(conditions, function (err, result) {
      if (err) return res.sendResult(null, 400, err)
      res.sendResult(result, 200, '获取成功')
    })(req, res, next)
  }
)

// 添加订单
router.post(
  '/',
  // 参数验证
  function (req, res, next) {
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var params = req.body
    orderServ.createOrder(params, function (err, newOrder) {
      if (err) return res.sendResult(null, 400, err)
      return res.sendResult(newOrder, 201, '创建订单成功')
    })(req, res, next)
  }
)

// 更新订单发送状态
router.put(
  '/:id',
  // 参数验证
  function (req, res, next) {
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var params = req.body
    orderServ.updateOrder(req.params.id, params, function (err, newOrder) {
      if (err) return res.sendResult(null, 400, err)
      return res.sendResult(newOrder, 201, '更新订单成功')
    })(req, res, next)
  }
)

router.get('/:id', function (req, res, next) {
  orderServ.getOrder(req.params.id, function (err, result) {
    if (err) return res.sendResult(null, 400, err)

    return res.sendResult(result, 200, '获取成功')
  })(req, res, next)
})

router.post(
  '/download',
  // 参数验证
  function (req, res, next) {
    next()
  },
  // 业务逻辑
  function (req, res, next) {
    var params = req.body
    orderServ.dowanloadOrder(params, function (err, newOrder) {
      if (err) return res.sendResult(null, 400, err)
      return res.sendResult('111', 201, 'get')
    })(req, res, next)
    // return res.sendResult('111', 201, 'get')
  }
)

router.delete("/:id",
	// 参数验证
	function(req,res,next) {
		if(!req.params.id) {
			return res.sendResult(null,400,"检测ID不能为空");
		}
		if(isNaN(parseInt(req.params.id))) return res.sendResult(null,400,"检测ID必须是数字");
		next();
	},
	// 业务逻辑
	function(req,res,next) {
		orderServ.deleteStatic(req.params.id,function(err){
			if(err)
				return res.sendResult(null,400,"删除失败");
			else
				return res.sendResult(null,200,"删除成功");
		})(req,res,next);
	}
);

module.exports = router
