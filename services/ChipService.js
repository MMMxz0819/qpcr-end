var _ = require('lodash')
var path = require('path')
var dao = require(path.join(process.cwd(), 'dao/DAO'))
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
 * 通过参数生成芯片基本信息
 *
 * @param  {[type]} params.cb [description]
 * @return {[type]}           [description]
 */
function generateChipInfo(params) {
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

    if (!params.total_cat) return reject('芯片没有设置所属分类')
    var cats = params.total_cat.split(',')
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

    if (params.line) {
      info['line'] = params.line
    } else {
      info['line'] = ''
    }

    if (params.cat_four_id) {
      info['cat_four_id'] = params.cat_four_id
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

    resolve(info)
  })
}

/**
 * 检查芯片名称是否重复
 *
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
 */
function checkChipName(info) {
  return new Promise(function (resolve, reject) {
    dao.findOne(
      'ChipModel',
      { chip_name: info.chip_name, is_del: '0' },
      function (err, chip) {
        if (err) return reject(err)
        if (!chip) return resolve(info)
        if (chip.chip_id == info.chip_id) return resolve(info)
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
function createChipInfo(info) {
  return new Promise(function (resolve, reject) {
    dao.create('ChipModel', _.clone(info), function (err, newGood) {
      if (err) {
        console.log(err)
        return reject('创建芯片基本信息失败')
      }
      newGood.total_cat = newGood.getGoodsCat()
      info.chip = newGood
      return resolve(info)
    })
  })
}

function updateChipInfo(info) {
  return new Promise(function (resolve, reject) {
    if (!info.chip_id) return reject('芯片ID不存在')
    dao.update(
      'ChipModel',
      info.chip_id,
      _.clone(info),
      function (err, newGood) {
        if (err) return reject('更新芯片基本信息失败')
        info.chip = newGood

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
function getChipInfo(info) {
  return new Promise(function (resolve, reject) {
    if (!info || !info.chip_id || isNaN(info.chip_id))
      return reject('芯片ID格式不正确')

    dao.show('ChipModel', info.chip_id, function (err, chip) {
      if (err) return reject('获取芯片基本信息失败')
      chip.total_cat = chip.getGoodsCat()
      info['chip'] = chip
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
    var ChipPicModel = dao.getModel('ChipPicModel')
    ChipPicModel.create(pic, function (err, newPic) {
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
function doUpdateChipPics(info) {
  // console.log('--------------------',info.chip)
  return new Promise(function (resolve, reject) {
    var chip = info.chip
    if (!chip.chip_id) return reject('更新芯片图片失败')

    if (!info.pics) return resolve(info)
    dao.list(
      'ChipPicModel',
      { columns: { chip_id: chip.chip_id } },
      function (err, oldpics) {
        if (err) return reject('获取芯片图片列表失败')

        var batchFns = []

        var newpics = info.pics ? info.pics : []
        var newpicsKV = _.keyBy(newpics, 'pics_id')
        var oldpicsKV = _.keyBy(oldpics, 'pics_id')
        var addNewpics = []
        var reservedOldpics = []
        var delOldpics = []

        _(oldpics).forEach(function (pic) {
          if (newpicsKV[pic.pics_id]) {
            reservedOldpics.push(pic)
          } else {
            delOldpics.push(pic)
          }
        })

        _(newpics).forEach(function (pic) {
          if (!pic.pics_id && pic.pic) {
            addNewpics.push(pic)
          }
        })

        _(delOldpics).forEach(function (pic) {
          batchFns.push(
            removeGoodPicFile(path.join(process.cwd(), pic.pics_big))
          )
          batchFns.push(
            removeGoodPicFile(path.join(process.cwd(), pic.pics_mid))
          )
          batchFns.push(
            removeGoodPicFile(path.join(process.cwd(), pic.pics_sma))
          )
          batchFns.push(removeGoodPic(pic))
        })

        _(addNewpics).forEach(function (pic) {
          if (!pic.pics_id && pic.pic) {
            var src = path.join(process.cwd(), pic.pic)
            var tmp = src.split(path.sep)
            var filename = tmp[tmp.length - 1]
            pic.pics_big = '/uploads/chipspics/big_' + filename
            pic.pics_mid = '/uploads/chipspics/mid_' + filename
            pic.pics_sma = '/uploads/chipspics/sma_' + filename
            batchFns.push(
              clipImage(src, path.join(process.cwd(), pic.pics_big), 800, 800)
            )
            batchFns.push(
              clipImage(src, path.join(process.cwd(), pic.pics_mid), 400, 400)
            )
            batchFns.push(
              clipImage(src, path.join(process.cwd(), pic.pics_sma), 200, 200)
            )
            pic.chip_id = chip.chip_id
            batchFns.push(createGoodPic(pic))
          }
        })

        if (batchFns.length == 0) {
          return resolve(info)
        }
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

/**
 * 挂载图片
 *
 * @param  {[type]} info [description]
 * @return {[type]}      [description]
 */
function doGetAllPics(info) {
  return new Promise(function (resolve, reject) {
    var chip = info.chip
    if (!chip.chip_id) return reject('获取芯片图片必须先获取芯片信息')
    dao.list(
      'ChipPicModel',
      { columns: { chip_id: chip.chip_id } },
      function (err, chipPics) {
        if (err) return reject('获取所有芯片图片列表失败')
        _(chipPics).forEach(function (pic) {
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
        })
        info.chip.pics = chipPics
        resolve(info)
      }
    )
  })
}

/**
 * 创建芯片
 *
 * @param  {[type]}   params 芯片参数
 * @param  {Function} cb     回调函数
 */
module.exports.createChip = function (params, cb) {
  generateChipInfo(params)
    .then(checkChipName)
    .then(createChipInfo)
    .then(doUpdateChipPics)
    .then(doGetAllPics)
    .then(function (info) {
      logger.debug(`添加芯片:${info.chip.chip_name}`)
      cb(null, info.chip)
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
module.exports.deleteChip = function (id, cb) {
  if (!id) return cb('ID不能为空')
  if (isNaN(id)) return cb('ID必须为数字')
  dao.update(
    'ChipModel',
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
module.exports.getAllChips = function (params, cb) {
  var conditions = {}
  if (!params.pagenum || params.pagenum <= 0) return cb('pagenum 参数错误')
  if (!params.pagesize || params.pagesize <= 0) return cb('pagesize 参数错误')

  conditions['columns'] = {}
  if (params.query) {
    conditions['columns']['chip_name'] = orm.like('%' + params.query + '%')
  }
  conditions['columns']['is_del'] = '0'

  dao.countByConditions('ChipModel', conditions, function (err, count) {
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

    conditions['order'] = '-add_time'

    dao.list('ChipModel', conditions, function (err, chips) {
      if (err) return cb(err)
      var resultDta = {}
      resultDta['total'] = count
      resultDta['pagenum'] = pagenum
      resultDta['chips'] = _.map(chips, function (chip) {
        return _.omit(chip, 'is_del', 'delete_time')
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
module.exports.updateChip = function (id, params, cb) {
  params.chip_id = id
  generateChipInfo(params)
    .then(checkChipName)
    .then(updateChipInfo)
    .then(doUpdateChipPics)
    .then(doGetAllPics)
    .then(function (info) {
      cb(null, info.chip)
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
module.exports.updateChipPics = function (chip_id, pics, cb) {
  if (!chip_id) return cb('芯片ID不能为空')
  if (isNaN(chip_id)) return cb('芯片ID必须为数字')

  getChipInfo({ chip_id: chip_id, pics: pics })
    .then(doUpdateChipPics)
    .then(doGetAllPics)
    .then(function (info) {
      cb(null, info.chip)
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
module.exports.getChipById = function (id, cb) {
  getChipInfo({ chip_id: id })
    .then(doGetAllPics)
    .then(function (info) {
      cb(null, info.chip)
    })
    .catch(function (err) {
      cb(err)
    })
}
