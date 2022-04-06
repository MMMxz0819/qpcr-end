var _ = require('lodash')
var path = require('path')
var dao = require(path.join(process.cwd(), 'dao/DAO'))
var goodAttributeDao = require(path.join(process.cwd(), 'dao/GoodAttributeDAO'))
var orm = require('orm')
var Promise = require('bluebird')
var fs = require('fs')
const http = require('http')

var logger = require('../modules/logger').logger()
var upload_config = require('config').get('upload_config')
/**
 * 裁剪图片
 *
 * @param  {[type]} srcPath   原始图片路径
 * @param  {[type]} savePath  存储路径
 * @param  {[type]} newWidth  新的宽度
 * @param  {[type]} newHeight 新的高度
 * @return {[type]}           [description]
 */
function clipImage(srcPath, savePath, newWidth, newHeight) {
  return new Promise(function (resolve, reject) {
    // console.log("src => %s",srcPath);
    // console.log("save => %s",savePath);
    /*
		gm(srcPath)
		.resize(newWidth,newHeight)
		.autoOrient()
		.write(savePath,function(err){
			resolve();
		})
		
		*/

    // 创建读取流
    readable = fs.createReadStream(srcPath)
    // 创建写入流
    writable = fs.createWriteStream(savePath)
    readable.pipe(writable)
    readable.on('end', function () {
      resolve()
    })
  })
}

/**
 * 下载txt文件
 *
 * @param  {[type]} srcPath [txt文件路径]
 * @return {[type]}           [description]
 */

function downloadFile(url, pahtName) {
  http.get(url, (res) => {
    var data = ''
    res.setEncoding('binary') //一定要设置response的编码为binary否则会下载下来的图片打不开
    res.on('data', function (chunk) {
      data += chunk
    })
    res.on('end', () => {
      fs.writeFileSync(`./txt/${pahtName}.txt`, data, 'binary')
    })
  })
}

/**
 * 生成曲线信息
 *
 * @param  {[type]} srcPath [txt文件路径]
 * @return {[type]}           [description]
 */

/**
 * 通过参数生成产品基本信息
 *
 * @param  {[type]} params.cb [description]
 * @return {[type]}           [description]
 */
function generateGoodInfo(params) {
  return new Promise(function (resolve, reject) {
    var info = {}
    if (params.chip_id) info['chip_id'] = params.chip_id
    if (!params.chip_name) return reject('芯片名称不能为空')
    info['chip_name'] = params.chip_name

    if (!params.chip_price) return reject('芯片价格不能为空')
    var price = parseFloat(params.chip_price)
    if (isNaN(price) || price < 0) return reject('芯片价格不正确')
    info['chip_price'] = price

    if (!params.chip_number) return reject('芯片数量不能为空')
    var num = parseInt(params.chip_number)
    if (isNaN(num) || num < 0) return reject('芯片数量不正确')
    info['chip_number'] = num

    if (!params.goods_cat) return reject('芯片没有设置所属分类')
    var cats = params.goods_cat.split(',')
    if (cats.length > 0) {
      info['cat_one_id'] = cats[0]
    }
    if (cats.length > 1) {
      info['cat_two_id'] = cats[1]
    }
    if (cats.length > 2) {
      info['cat_three_id'] = cats[2]
      info['cat_id'] = cats[2]
    }

    if (params.chip_desc) {
      // weight = parseFloat(params.chip_desc);
      // if(isNaN(weight) || weight < 0) return reject("芯片重量格式不正确");
      info['chip_desc'] = params.chip_desc
    } else {
      info['chip_desc'] = ''
    }
    if (params.goods_introduce) {
      info['goods_introduce'] = params.goods_introduce
    }

    if (params.line) {
      info['line'] = params.line
    } else {
      info['line'] = ''
    }

    if (params.goods_small_logo) {
      info['goods_small_logo'] = params.goods_small_logo
    } else {
      info['goods_small_logo'] = ''
    }

    if (params.goods_state) {
      info['goods_state'] = params.goods_state
    }

    // 图片
    if (params.pics) {
      info['pics'] = params.pics
    }

    // 属性
    if (params.attrs) {
      info['attrs'] = params.attrs
    }

    info['add_time'] = Date.parse(new Date()) / 1000
    info['upd_time'] = Date.parse(new Date()) / 1000
    info['is_del'] = '0'

    if (params.color_mumber) {
      info['color_mumber'] = params.color_mumber
    }

    info['is_promote'] = info['is_promote'] ? info['is_promote'] : false

    info['goods_introduce'] = params.goods_introduce

    resolve(info)
  })
}

/**
 * 检查芯片名称是否重复
 *
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
 */
function checkGoodName(info) {
  return new Promise(function (resolve, reject) {
    dao.findOne(
      'GoodModel',
      { chip_name: info.chip_name, is_del: '0' },
      function (err, good) {
        if (err) return reject(err)
        if (!good) return resolve(info)
        if (good.chip_id == info.chip_id) return resolve(info)
        return reject('芯片名称已存在')
      }
    )
  })
}

/**
 * 创建芯片基本信息
 *
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
 */
function createGoodInfo(info) {
  return new Promise(function (resolve, reject) {
    dao.create('GoodModel', _.clone(info), function (err, newGood) {
      if (err) {
        console.log(err)
        return reject('创建芯片基本信息失败')
      }
      newGood.goods_cat = newGood.getGoodsCat()
      info.good = newGood
      return resolve(info)
    })
  })
}

function updateGoodInfo(info) {
  return new Promise(function (resolve, reject) {
    if (!info.chip_id) return reject('芯片ID不存在')
    dao.update(
      'GoodModel',
      info.chip_id,
      _.clone(info),
      function (err, newGood) {
        if (err) return reject('更新芯片基本信息失败')
        info.good = newGood

        return resolve(info)
      }
    )
  })
}

/**
 * 获取芯片对象
 *
 * @param  {[type]} info 查询内容
 * @return {[type]}      [description]
 */
function getGoodInfo(info) {
  return new Promise(function (resolve, reject) {
    if (!info || !info.chip_id || isNaN(info.chip_id))
      return reject('芯片ID格式不正确')

    dao.show('GoodModel', info.chip_id, function (err, good) {
      if (err) return reject('获取芯片基本信息失败')
      good.goods_cat = good.getGoodsCat()
      info['good'] = good
      return resolve(info)
    })
  })
}

/**
 * 删除芯片图片
 *
 * @param  {[type]} pic 图片对象
 * @return {[type]}     [description]
 */
function removeGoodPic(pic) {
  return new Promise(function (resolve, reject) {
    if (!pic || !pic.remove) return reject('删除芯片图片记录失败')
    pic.remove(function (err) {
      if (err) return reject('删除失败')
      resolve()
    })
  })
}

function removeGoodPicFile(path) {
  return new Promise(function (resolve, reject) {
    fs.unlink(path, function (err, result) {
      resolve()
    })
  })
}

function createGoodPic(pic) {
  return new Promise(function (resolve, reject) {
    if (!pic) return reject('图片对象不能为空')
    var GoodPicModel = dao.getModel('GoodPicModel')
    GoodPicModel.create(pic, function (err, newPic) {
      if (err) return reject('创建图片数据失败')
      resolve()
    })
  })
}

/**
 * 更新芯片图片
 *
 * @param  {[type]} info    参数
 * @param  {[type]} newGood 芯片基本信息
 */
function doUpdateGoodPics(info) {
  // console.log('--------------------',info.good)
  return new Promise(function (resolve, reject) {
    var good = info.good
    if (!good.chip_id) return reject('更新芯片图片失败')

    if (!info.pics) return resolve(info)
    dao.list(
      'GoodPicModel',
      { columns: { chip_id: good.chip_id } },
      function (err, oldpics) {
        if (err) return reject('获取芯片图片列表失败')

        var batchFns = []

        var newpics = info.pics ? info.pics : []
        var newpicsKV = _.keyBy(newpics, 'pics_id')
        var oldpicsKV = _.keyBy(oldpics, 'pics_id')

        /**
         * 保存图片集合
         */
        // 需要新建的图片集合
        var addNewpics = []
        // 需要保留的图片的集合
        var reservedOldpics = []
        // 需要删除的图片集合
        var delOldpics = []

        // 如果提交的新的数据中有老的数据的pics_id就说明保留数据，否则就删除
        _(oldpics).forEach(function (pic) {
          if (newpicsKV[pic.pics_id]) {
            reservedOldpics.push(pic)
          } else {
            delOldpics.push(pic)
          }
        })

        // 从新提交的数据中检索出需要新创建的数据
        // 计算逻辑如果提交的数据不存在 pics_id 字段说明是新创建的数据
        _(newpics).forEach(function (pic) {
          if (!pic.pics_id && pic.pic) {
            addNewpics.push(pic)
          }
        })

        // 开始处理芯片图片数据逻辑
        // 1. 删除芯片图片数据集合
        _(delOldpics).forEach(function (pic) {
          // 1.1 删除图片物理路径
          batchFns.push(
            removeGoodPicFile(path.join(process.cwd(), pic.pics_big))
          )
          batchFns.push(
            removeGoodPicFile(path.join(process.cwd(), pic.pics_mid))
          )
          batchFns.push(
            removeGoodPicFile(path.join(process.cwd(), pic.pics_sma))
          )
          // 1.2 数据库中删除图片数据记录
          batchFns.push(removeGoodPic(pic))
        })

        // 2. 处理新建图片的集合
        _(addNewpics).forEach(function (pic) {
          if (!pic.pics_id && pic.pic) {
            // 2.1 通过原始图片路径裁剪出需要的图片
            var src = path.join(process.cwd(), pic.pic)
            var tmp = src.split(path.sep)
            var filename = tmp[tmp.length - 1]
            pic.pics_big = '/uploads/goodspics/big_' + filename
            pic.pics_mid = '/uploads/goodspics/mid_' + filename
            pic.pics_sma = '/uploads/goodspics/sma_' + filename
            batchFns.push(
              clipImage(src, path.join(process.cwd(), pic.pics_big), 800, 800)
            )
            batchFns.push(
              clipImage(src, path.join(process.cwd(), pic.pics_mid), 400, 400)
            )
            batchFns.push(
              clipImage(src, path.join(process.cwd(), pic.pics_sma), 200, 200)
            )
            pic.chip_id = good.chip_id
            // 2.2 数据库中新建数据记录
            batchFns.push(createGoodPic(pic))
          }
        })

        // 如果没有任何图片操作就返回
        if (batchFns.length == 0) {
          return resolve(info)
        }

        // 批量执行所有操作
        Promise.all(batchFns)
          .then(function () {
            resolve(info)
          })
          .catch(function (error) {
            if (error) return reject(error)
          })
      }
    )
  })
}

function createGoodAttribute(goodAttribute) {
  return new Promise(function (resolve, reject) {
    dao.create(
      'GoodAttributeModel',
      _.omit(goodAttribute, 'delete_time'),
      function (err, newAttr) {
        if (err) return reject('创建芯片参数失败')
        resolve(newAttr)
      }
    )
  })
}

/**
 * 更新芯片属性
 *
 * @param  {[type]} info 参数
 * @param  {[type]} good 芯片对象
 */
function doUpdateGoodAttributes(info) {
  return new Promise(function (resolve, reject) {
    var good = info.good
    if (!good.chip_id) return reject('获取芯片图片必须先获取芯片信息')
    if (!info.attrs) return resolve(info)
    // var GoodAttributeModel = dao.getModel("GoodAttributeModel");
    goodAttributeDao.clearGoodAttributes(good.chip_id, function (err) {
      if (err) return reject('清理原始的芯片参数失败')

      var newAttrs = info.attrs ? info.attrs : []

      if (newAttrs) {
        var createFns = []
        _(newAttrs).forEach(function (newattr) {
          newattr.chip_id = good.chip_id
          if (newattr.attr_value) {
            if (newattr.attr_value instanceof Array) {
              newattr.attr_value = newattr.attr_value.join(',')
            } else {
              newattr.attr_value = newattr.attr_value
            }
          } else newattr.attr_value = ''
          createFns.push(createGoodAttribute(_.clone(newattr)))
        })
      }

      if (createFns.length == 0) return resolve(info)

      Promise.all(createFns)
        .then(function () {
          resolve(info)
        })
        .catch(function (error) {
          if (error) return reject(error)
        })
    })
  })
}

/**
 * 挂载图片
 *
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
 */
function doGetAllPics(info) {
  return new Promise(function (resolve, reject) {
    var good = info.good
    if (!good.chip_id) return reject('获取芯片图片必须先获取芯片信息')
    // 3. 组装最新的数据挂载在“info”中“good”对象下
    dao.list(
      'GoodPicModel',
      { columns: { chip_id: good.chip_id } },
      function (err, goodPics) {
        if (err) return reject('获取所有芯片图片列表失败')
        _(goodPics).forEach(function (pic) {
          if (pic.pics_big.indexOf('http') == 0) {
            pic.pics_big_url = pic.pics_big
          } else {
            pic.pics_big_url = upload_config.get('baseURL') + pic.pics_big
          }

          if (pic.pics_mid.indexOf('http') == 0) {
            pic.pics_mid_url = pic.pics_mid
          } else {
            pic.pics_mid_url = upload_config.get('baseURL') + pic.pics_mid
          }
          if (pic.pics_sma.indexOf('http') == 0) {
            pic.pics_sma_url = pic.pics_sma
          } else {
            pic.pics_sma_url = upload_config.get('baseURL') + pic.pics_sma
          }

          // pic.pics_mid_url = upload_config.get("baseURL") + pic.pics_mid;
          // pic.pics_sma_url = upload_config.get("baseURL") + pic.pics_sma;
        })
        info.good.pics = goodPics
        resolve(info)
      }
    )
  })
}

/**
 * 挂载属性
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
 */
function doGetAllAttrs(info) {
  return new Promise(function (resolve, reject) {
    var good = info.good
    if (!good.chip_id) return reject('获取芯片图片必须先获取芯片信息')
    goodAttributeDao.list(good.chip_id, function (err, goodAttrs) {
      if (err) return reject('获取所有芯片参数列表失败')
      info.good.attrs = goodAttrs
      resolve(info)
    })
  })
}

/**
 * 创建芯片
 *
 * @param  {[type]}   params 芯片参数
 * @param  {Function} cb     回调函数
 */
module.exports.createGood = function (params, cb) {
  // 验证参数 & 生成数据
  generateGoodInfo(params)
    // 检查芯片名称
    .then(checkGoodName)
    // 创建芯片
    .then(createGoodInfo)
    // 更新芯片图片
    .then(doUpdateGoodPics)
    // 更新芯片参数
    // .then(doUpdateGoodAttributes)
    .then(doGetAllPics)
    .then(doGetAllAttrs)
    // 创建成功
    .then(function (info) {
      logger.debug(`添加芯片:${info.good.chip_name}`)
      cb(null, info.good)
    })
    .catch(function (err) {
      cb(err)
    })
}

/**
 * 删除芯片
 *
 * @param  {[type]}   id 芯片ID
 * @param  {Function} cb 回调函数
 */
module.exports.deleteGood = function (id, cb) {
  if (!id) return cb('产品ID不能为空')
  if (isNaN(id)) return cb('产品ID必须为数字')
  dao.update(
    'GoodModel',
    id,
    {
      is_del: '1',
      delete_time: Date.parse(new Date()) / 1000,
      upd_time: Date.parse(new Date()) / 1000,
    },
    function (err) {
      if (err) return cb(err)
      cb(null)
    }
  )
}

/**
 * 获取芯片列表
 *
 * @param  {[type]}   params     查询条件
 * @param  {Function} cb         回调函数
 */
module.exports.getAllGoods = function (params, cb) {
  var conditions = {}
  if (!params.pagenum || params.pagenum <= 0) return cb('pagenum 参数错误')
  if (!params.pagesize || params.pagesize <= 0) return cb('pagesize 参数错误')

  conditions['columns'] = {}
  if (params.query) {
    conditions['columns']['chip_name'] = orm.like('%' + params.query + '%')
  }
  conditions['columns']['is_del'] = '0'

  dao.countByConditions('GoodModel', conditions, function (err, count) {
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
    conditions['only'] = [
      'chip_id',
      'chip_name',
      'chip_price',
      'chip_desc',
      'goods_state',
      'add_time',
      'chip_number',
      'upd_time',
      'color_mumber',
      'is_promote',
      'goods_introduce',
      'line',
    ]
    conditions['order'] = '-add_time'

    dao.list('GoodModel', conditions, function (err, goods) {
      if (err) return cb(err)
      var resultDta = {}
      resultDta['total'] = count
      resultDta['pagenum'] = pagenum
      resultDta['goods'] = _.map(goods, function (good) {
        // const chartdata = chartData()
        return _.omit(
          // { ...good, ...chartdata },
          good,
          // chartdata,
          'is_del',
          // 'line',
          'goods_small_logo',
          'delete_time'
        )
      })
      cb(err, resultDta)
    })
  })
}

/**
 * 更新芯片
 *
 * @param  {[type]}   id     芯片ID
 * @param  {[type]}   params 参数
 * @param  {Function} cb     回调函数
 */
module.exports.updateGood = function (id, params, cb) {
  params.chip_id = id
  // 验证参数 & 生成数据
  generateGoodInfo(params)
    // 检查芯片名称
    .then(checkGoodName)
    // 创建芯片
    .then(updateGoodInfo)
    // 更新芯片图片
    .then(doUpdateGoodPics)
    // 更新芯片参数
    // .then(doUpdateGoodAttributes)
    .then(doGetAllPics)
    .then(doGetAllAttrs)
    // 创建成功
    .then(function (info) {
      cb(null, info.good)
    })
    .catch(function (err) {
      cb(err)
    })
}

/**
 * 更新芯片图片
 *
 * @param  {[type]}   chip_id 芯片ID
 * @param  {[type]}   pics     芯片图片
 * @param  {Function} cb       回调函数
 */
module.exports.updateGoodPics = function (chip_id, pics, cb) {
  if (!chip_id) return cb('芯片ID不能为空')
  if (isNaN(chip_id)) return cb('芯片ID必须为数字')

  getGoodInfo({ chip_id: chip_id, pics: pics })
    .then(doUpdateGoodPics)
    .then(doGetAllPics)
    .then(doGetAllAttrs)
    .then(function (info) {
      cb(null, info.good)
    })
    .catch(function (err) {
      cb(err)
    })
}

module.exports.updateGoodAttributes = function (chip_id, attrs, cb) {
  getGoodInfo({ chip_id: chip_id, attrs: attrs })
    // .then(doUpdateGoodAttributes)
    .then(doGetAllPics)
    .then(doGetAllAttrs)
    .then(function (info) {
      cb(null, info.good)
    })
    .catch(function (err) {
      cb(err)
    })
}

module.exports.updateGoodsState = function (chip_id, state, cb) {
  getGoodInfo({ chip_id: chip_id, goods_state: state })
    .then(updateGoodInfo)
    .then(doGetAllPics)
    .then(doGetAllAttrs)
    .then(function (info) {
      cb(null, info.good)
    })
    .catch(function (err) {
      cb(err)
    })
}

/**
 * 通过芯片ID获取芯片数据
 *
 * @param  {[type]}   id 芯片ID
 * @param  {Function} cb 回调函数
 */
module.exports.getGoodById = function (id, cb) {
  getGoodInfo({ chip_id: id })
    .then(doGetAllPics)
    .then(doGetAllAttrs)
    .then(function (info) {
      cb(null, info.good)
    })
    .catch(function (err) {
      cb(err)
    })
}

// module.exports.getChartData = function (id, cb) {
//   chartData()
// }

// downloadFile(
//   'http://test-1-1308630349.cos.ap-guangzhou.myqcloud.com/1.txt',
//   '2'
// )
