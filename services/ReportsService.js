var _ = require('lodash')
var path = require('path')
var dao = require(path.join(process.cwd(), 'dao/DAO'))
const fs = require('fs')

function reportOne(cb) {
  dao.list('ReportOneModel', null, function (err, result) {
    if (err) return cb('获取报表数据失败')
    var resultDta = {}
    resultDta['result'] = _.map(result, function (result) {
      return result //_.omit(order,);
    })
    cb(err, resultDta)
  })
}

function reportTwo(cb) {
  // read contents of the file
  const data = fs.readFileSync('./cheese.log', 'UTF-8')

  // split the contents by new line
  const lines = data.split(/\r?\n/)

  cb(null, lines)
}

function reportThree(cb) {
  dao.list('ReportThreeModel', null, function (err, result) {
    if (err) return cb('获取报表数据失败')
    var resultDta = {}
    resultDta['result'] = _.map(result, function (result) {
      return result //_.omit(order,);
    })
    cb(err, resultDta)
  })
}

// function reportFour(cb) {
//   // call.js
//   const exec = require('child_process').exec
//   const execSync = require('child_process').execSync
//   // 同步执行
//   const output = execSync('python ../web.py')
//   console.log('sync: ' + output.toString())
//   console.log('over')

//   cb(null, '成功')
// }

module.exports.reports = function (typeid, cb) {
  console.log(typeid)
  switch (parseInt(typeid)) {
    case 1:
      reportOne(function (err, result) {
        if (err) return cb(err)
        cb(null, result)
      })
      break
    case 2:
      reportTwo(function (err, result) {
        if (err) return cb(err)
        cb(null, result)
      })
      break
    case 3:
      reportThree(function (err, result) {
        if (err) return cb(err)
        cb(null, result)
      })
      break
    // case 4:
    //   reportFour(function (err, result) {
    //     if (err) return cb(err)
    //     cb(null, result)
    //   })
    //   break
    default:
      cb('类型出错')
      break
  }
}
