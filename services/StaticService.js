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

function doCheckStaticParams(params) {
  return new Promise(function (resolve, reject) {
    var info = {}
    if (params.static_id) info.static_id = params.static_id

    if (!params.static_id) {
      if (!params.static_number) return reject('设备号不能为空')
      info.static_number = params.static_number
    }

    if (params.static_chip) {
      info.static_chip = params.static_chip
    } else {
      info.static_chip = '0'
    }

    if (params.test_name) {
      info.test_name = params.test_name
    } else {
      info.test_name = '个人'
    }

    if (!params.static_path) reject('检测文件路径不能为空')
    if (params.static_path) {
      info.static_path = params.static_path
    }

    if (params.static_id) info.create_time = Date.parse(new Date()) / 1000
    info.update_time = Date.parse(new Date()) / 1000

    if (params.positive) info.positive = params.positive

    resolve(info)
  })
}

function doCreateStatic(info) {
  return new Promise(function (resolve, reject) {
    dao.create('StaticModel', _.clone(info), function (err, newStatic) {
      if (err) return reject('创建检测数据失败')
      info.static = newStatic
      resolve(info)
    })
  })
}

function doCreateStaticGood(staticGood) {
  return new Promise(function (resolve, reject) {
    dao.create('StaticChipModel', staticGood, function (err, newStaticGood) {
      if (err) return reject('创建检测数据芯片失败')
      resolve(newStaticGood)
    })
  })
}

function doAddStaticrChips(info) {
  return new Promise(function (resolve, reject) {
    if (!info.static) return reject('检测数据对象未创建')

    var staticGoods = info.goods

    if (staticGoods && staticGoods.length > 0) {
      var fns = []
      var chip_total_price = _.sum(_.map(staticGoods, 'chip_price'))

      _(staticGoods).forEach(function (staticGood) {
        staticGood.static_id = info.static.static_id
        staticGood.chip_total_price = chip_total_price
        fns.push(doCreateStaticGood(staticGood))
      })
      Promise.all(fns)
        .then(function (results) {
          info.static.goods = results
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

function doGetAllStaticChips(info) {
  return new Promise(function (resolve, reject) {
    if (!info.static) return reject('检测数据对象未创建')

    dao.list(
      'StaticChipModel',
      { columns: { static_id: info.static.static_id } },
      function (err, staticGoods) {
        if (err) {
          console.log(err)
          return reject('获取检测数据芯片列表失败')
        }

        info.static.goods = staticGoods
        resolve(info)
      }
    )
  })
}

function doGetStatic(info) {
  return new Promise(function (resolve, reject) {
    dao.show('StaticModel', info.static_id, function (err, newStatic) {
      if (err) return reject('获取检测数据详情失败')
      if (!newStatic) return reject('检测数据ID不能存在')
      info.static = newStatic
      resolve(info)
    })
  })
}

function doUpdateStatic(info) {
  console.log(info)
  return new Promise(function (resolve, reject) {
    dao.update(
      'StaticModel',
      info.static_id,
      {
        positive: info.positive,
      },
      function (err, newStatic) {
        if (err) return reject('更新失败')
        info.static = newStatic
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
    'StaticModel',
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

module.exports.createStatic = function (params, cb) {
  doCheckStaticParams(params)
    .then(doCreateStatic)
    .then(doAddStaticrChips)
    .then(function (info) {
      cb(null, info.static)
    })
    .catch(function (err) {
      cb(err)
    })
}

module.exports.getAllStatics = function (params, cb) {
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

    if (params.static_chip) {
      conditions['columns']['static_chip'] = params.static_chip
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

    // if (params.static_fapiao_content) {
    //   conditions['columns']['static_fapiao_content'] = orm.like(
    //     '%' + params.static_fapiao_content + '%'
    //   )
    // }

    conditions['columns']['is_del'] = '0'

    dao.countByConditions('StaticModel', conditions, function (err, count) {
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

      dao.list('StaticModel', conditions, function (err, statics) {
        if (err) return cb(err)
        var resultDta = {}
        resultDta['total'] = count
        resultDta['pagenum'] = pagenum
        resultDta['statics'] = _.map(statics, function (static) {
          return _.omit(
            static,
            // chartdata,
            'is_del',

            'delete_time'
          ) //_.omit(static,);
        })
        cb(err, resultDta)
      })
    })
  } else {
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

module.exports.getStatic = function (staticId, cb) {
  if (!staticId) return cb('用户ID不能为空')
  if (isNaN(parseInt(staticId))) return cb('用户ID必须是数字')

  doGetStatic({ static_id: staticId })
    .then(doGetAllStaticChips)
    .then(function (info) {
      const ddate = chartData(info.static.static_path)
      cb(null, { ...info.static, ddate })
    })
    .catch(function (err) {
      cb(err)
    })
}

module.exports.updateStatic = function (staticId, params, cb) {
  if (!staticId) return cb('ID不能为空')
  if (isNaN(parseInt(staticId))) return cb('ID必须是数字')
  params['static_id'] = staticId
  doCheckStaticParams(params)
    .then(doUpdateStatic)
    .then(doGetAllStaticChips)
    .then(function (info) {
      cb(null, info.static)
    })
    .catch(function (err) {
      cb(err)
    })
}
