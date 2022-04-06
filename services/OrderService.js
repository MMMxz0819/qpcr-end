var _ = require('lodash')
var path = require('path')
var orm = require('orm')
var dao = require(path.join(process.cwd(), 'dao/DAO'))
var AttributeDao = require(path.join(process.cwd(), 'dao/AttributeDAO'))
var fs = require('fs')
var Promise = require('bluebird')
var uniqid = require('uniqid')
var http = require('http')

// 获取检测数据
function chartData(path) {
  let total_y = []
  let x = []
  let y = []

  const file = path

  // read contents of the file
  const data = fs.readFileSync(file, 'UTF-8')

  // split the contents by new line
  const lines = data.split(/\r?\n/)

  // print all lines
  lines.forEach((line) => {
    const each = line.split(',')
    x.push(each[0])
    let a = each.splice(1, each.length - 1)
    total_y.push(a)
  })

  let length = total_y[0].length

  for (let i = 0; i < length; i++) {
    let Y_one = total_y.map((v) => v[i])
    y.push(Y_one)
  }

  return {
    x: x,
    y: y,
  }
}

function doCheckOrderParams(params) {
  return new Promise(function (resolve, reject) {
    var info = {}
    if (params.static_id) info.static_id = params.static_id

    if (!params.static_id) {
      if (!params.user_id) return reject('用户ID不能为空')
      if (isNaN(parseInt(params.user_id))) return reject('用户ID必须是数字')
      info.user_id = params.user_id
    }

    if (!params.static_id) info.static_number = 'itcast-' + uniqid()

    if (!params.static_price) return reject('检测数据价格不能为空')
    if (isNaN(parseFloat(params.static_price)))
      return reject('检测数据价格必须为数字')
    info.static_price = params.static_price

    if (params.static_chip) {
      info.static_chip = params.static_chip
    } else {
      info.static_chip = '0'
    }

    if (params.test_name) {
      if (params.test_name != '个人' && params.test_name != '公司')
        return reject('发票抬头必须是 个人 或 公司')
      info.test_name = params.test_name
    } else {
      info.test_name = '个人'
    }

    if (params.static_path) {
      info.static_path = params.static_path
    } else {
      info.static_path = ''
    }

    // if (params.order_fapiao_content) {
    //   info.order_fapiao_content = params.order_fapiao_content
    // } else {
    //   info.order_fapiao_content = ''
    // }

    if (params.consignee_addr) {
      info.consignee_addr = params.consignee_addr
    } else {
      info.consignee_addr = ''
    }

    if (params.goods) {
      info.goods = params.goods
    }

    info.pay_status = '0'
    if (params.static_id) info.create_time = Date.parse(new Date()) / 1000
    info.update_time = Date.parse(new Date()) / 1000

    resolve(info)
  })
}

function doCreateOrder(info) {
  return new Promise(function (resolve, reject) {
    dao.create('OrderModel', _.clone(info), function (err, newOrder) {
      if (err) return reject('创建检测数据失败')
      info.order = newOrder
      resolve(info)
    })
  })
}

function doCreateOrderGood(orderGood) {
  return new Promise(function (resolve, reject) {
    dao.create('OrderGoodModel', orderGood, function (err, newOrderGood) {
      if (err) return reject('创建检测数据芯片失败')
      resolve(newOrderGood)
    })
  })
}

function doAddOrderGoods(info) {
  return new Promise(function (resolve, reject) {
    if (!info.order) return reject('检测数据对象未创建')

    var orderGoods = info.goods

    if (orderGoods && orderGoods.length > 0) {
      var fns = []
      var goods_total_price = _.sum(_.map(orderGoods, 'chip_price'))

      _(orderGoods).forEach(function (orderGood) {
        orderGood.static_id = info.order.static_id
        orderGood.goods_total_price = goods_total_price
        fns.push(doCreateOrderGood(orderGood))
      })
      Promise.all(fns)
        .then(function (results) {
          info.order.goods = results
          resolve(info)
        })
        .catch(function (error) {
          if (error) return reject(error)
        })
    } else {
      resolve(info)
    }
  })
}

function doGetAllOrderGoods(info) {
  return new Promise(function (resolve, reject) {
    if (!info.order) return reject('检测数据对象未创建')

    dao.list(
      'OrderGoodModel',
      { columns: { static_id: info.order.static_id } },
      function (err, orderGoods) {
        if (err) {
          console.log(err)
          return reject('获取检测数据芯片列表失败')
        }

        info.order.goods = orderGoods
        resolve(info)
      }
    )
  })
}

function doGetOrder(info) {
  return new Promise(function (resolve, reject) {
    dao.show('OrderModel', info.static_id, function (err, newOrder) {
      if (err) return reject('获取检测数据详情失败')
      if (!newOrder) return reject('检测数据ID不能存在')
      info.order = newOrder
      resolve(info)
    })
  })
}

function doUpdateOrder(info) {
  return new Promise(function (resolve, reject) {
    dao.update(
      'OrderModel',
      info.static_id,
      _.clone(info),
      function (err, newOrder) {
        if (err) return reject('更新失败')
        info.order = newOrder
        resolve(info)
      }
    )
  })
}

/**
 * 删除检测数据
 *
 * @param  {[type]}   id 检测ID
 * @param  {Function} cb 回调函数
 */
module.exports.deleteStatic = function (id, cb) {
  if (!id) return cb('检测ID不能为空')
  if (isNaN(id)) return cb('检测ID必须为数字')
  dao.update(
    'OrderModel',
    id,
    {
      is_del: '1',
      delete_time: Date.parse(new Date()) / 1000,
      update_time: Date.parse(new Date()) / 1000,
    },
    function (err) {
      if (err) return cb(err)
      cb(null)
    }
  )
  console.log('111111111')
}

module.exports.createOrder = function (params, cb) {
  doCheckOrderParams(params)
    .then(doCreateOrder)
    .then(doAddOrderGoods)
    .then(function (info) {
      cb(null, info.order)
    })
    .catch(function (err) {
      cb(err)
    })
}

module.exports.getAllOrders = function (params, cb) {
  if (!params.chart) {
    console.log(params)
    var conditions = {}
    if (!params.pagenum || params.pagenum <= 0) return cb('pagenum 参数错误')
    if (!params.pagesize || params.pagesize <= 0) return cb('pagesize 参数错误')
    conditions['columns'] = {}

    if (params.create_time) {
      conditions['columns']['create_time'] = orm.between(
        params.create_time[0],
        params.create_time[1]
      )
    }

    if (params.user_id) {
      conditions['columns']['user_id'] = params.user_id
    }

    if (params.pay_status) {
      conditions['columns']['pay_status'] = params.pay_status
    }

    if (params.test_name) {
      conditions['columns']['test_name'] = orm.like(
        '%' + params.test_name + '%'
      )
    }

    if (params.static_number) {
      conditions['columns']['static_number'] = orm.like(
        '%' + params.static_number + '%'
      )
    }

    if (params.static_path) {
      conditions['columns']['static_path'] = orm.like(
        '%' + params.static_path + '%'
      )
    }

    // if (params.order_fapiao_content) {
    //   conditions['columns']['order_fapiao_content'] = orm.like(
    //     '%' + params.order_fapiao_content + '%'
    //   )
    // }

    if (params.consignee_addr) {
      conditions['columns']['consignee_addr'] = orm.like(
        '%' + params.consignee_addr + '%'
      )
    }

    conditions['columns']['is_del'] = '0'

    dao.countByConditions('OrderModel', conditions, function (err, count) {
      if (err) return cb(err)
      pagesize = params.pagesize
      pagenum = params.pagenum
      pageCount = Math.ceil(count / pagesize)
      offset = (pagenum - 1) * pagesize
      if (offset >= count) {
        offset = count
      }
      limit = pagesize

      // 构建条件
      conditions['offset'] = offset
      conditions['limit'] = limit
      // conditions["only"] =
      conditions['order'] = '-create_time'

      dao.list('OrderModel', conditions, function (err, orders) {
        if (err) return cb(err)
        var resultDta = {}
        resultDta['total'] = count
        resultDta['pagenum'] = pagenum
        resultDta['goods'] = _.map(orders, function (order) {
          return _.omit(
            order,
            // chartdata,
            'is_del',

            'delete_time'
          ) //_.omit(order,);
        })
        cb(err, resultDta)
      })
    })
  } else {
    console.log('ye')
    // pagenum = params.pagenum
    // pageCount = Math.ceil(count / pagesize)
    // offset = (pagenum - 1) * pagesize
    // if (offset >= count) {
    //   offset = count
    // }
    // limit = pagesize
    AttributeDao.timeList(
      params.create_time[0],
      params.create_time[1],
      params.pagesize,
      function (err, statics, count) {
        if (err) return cb(err)
        var resultDta = {}
        resultDta['all'] = statics
        resultDta['start'] = count
        cb(err, resultDta)
      }
    )
  }
}

module.exports.getOrder = function (orderId, cb) {
  if (!orderId) return cb('用户ID不能为空')
  if (isNaN(parseInt(orderId))) return cb('用户ID必须是数字')

  doGetOrder({ static_id: orderId })
    .then(doGetAllOrderGoods)
    .then(function (info) {
      const ddate = chartData(info.order.static_path)
      cb(null, { ...info.order, ddate })
    })
    .catch(function (err) {
      cb(err)
    })
}

module.exports.updateOrder = function (orderId, params, cb) {
  if (!orderId) return cb('用户ID不能为空')
  if (isNaN(parseInt(orderId))) return cb('用户ID必须是数字')
  params['static_id'] = orderId
  doCheckOrderParams(params)
    .then(doUpdateOrder)
    .then(doGetAllOrderGoods)
    .then(function (info) {
      cb(null, info.order)
    })
    .catch(function (err) {
      cb(err)
    })
}
