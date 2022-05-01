var _ = require('lodash')
var path = require('path')
var dao = require(path.join(process.cwd(), 'dao/DAO'))
var AttributeDao = require(path.join(process.cwd(), 'dao/AttributeDAO'))
const fs = require('fs')
const moment = require('moment')
const exec = require('child_process').exec
const execSync = require('child_process').execSync

//
function handleOutput(data) {
  const step1 = data
    .replace(/\r\n /g, ',')
    .replace(/\r\n/, '')
    .replace(/ /g, ',')
  const step2 = step1
    .slice(2, step1.length - 2)
    .split('],[')
    .map((v) => v.split(','))

  let Infectious = []
  let Susceptibles = []
  let Recovereds = []
  let Death = []

  step2
    .filter((k) => k)
    .map((v) => {
      Infectious.push(Number(v[1]))
      Susceptibles.push(Number(v[0]))
      Recovereds.push(Number(v[2]))
      Death.push(Number(v[3]))
    })

  return {
    Infectious,
    Susceptibles,
    Recovereds,
    Death,
  }
}

//全国数据
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
//日志
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
    cb(err, result)
  })
}

//SIR
function reportFour(chip, start, end, cb) {
  let chipStatic = []
  dao.show('ChipModel', chip, function (err, result) {
    if (err) return cb('获取报表数据失败')
    chipStatic = [result.cat_one_id, result.cat_two_id, result.cat_three_id]
    // cb(err, result.slice(length - 3, length))
  })

  AttributeDao.OneChipStaticList(
    chip,
    start,
    end,
    function (err, staticsAll, count) {
      if (err) return cb(err)
      var resultDta = {}
      resultDta['all'] = staticsAll
      resultDta['start'] = count

      let start = resultDta.start.sort((a, b) => {
        return a.create_time - b.create_time
      })
      let all = resultDta.all

      let statics = []
      let xItem = []
      start.map((v, index) => {
        xItem.push(moment.unix(v.create_time).format('YYYYMMDD'))
        let oneDay = []
        if (index === start.length - 1) {
          all.map((item) => {
            if (v.create_time <= item.create_time) {
              oneDay.push(item)
            }
          })
        } else {
          all.map((item) => {
            if (
              v.create_time <= item.create_time &&
              item.create_time < start[index + 1].create_time
            ) {
              oneDay.push(item)
            }
          })
        }
        statics.push(oneDay)
      })

      if (chipStatic.filter((v) => v).length !== 3 || !resultDta.all.length) {
        cb(err, {
          msg: '无法生成趋势图',
          res: resultDta,
          chart: {
            Infectious: [],
            Susceptibles: [],
            Recovereds: [],
            Death: [],
          },
        })
        return
      }

      let csvData = statics
        .filter((v) => v)
        .map((v) => {
          return {
            date: moment.unix(v[0].create_time).format('YYYY/MM/DD'),
            infecNow: v.filter((item) => item.positive == '1').length,
            total: v.length,
          }
        })

      let context = 'date,现有感染者\r\n'
      let data = csvData
        .map((v) => {
          return `${v.date},${v.infecNow}`
        })
        .join('\r\n')

      fs.writeFile(`./data.csv`, context + data, (error) => {
        // 创建失败
        if (error) {
          console.log(`创建失败：${error}`)
        }
        // 创建成功
        console.log(`创建成功！`)

        const output = execSync(
          `python D:/kejian/bs/qpcr-end/SIRmodel/SIR.py ${chipStatic[0]} ${
            chipStatic[1]
          } ${chipStatic[2]} ${csvData[0].infecNow ? csvData[0].infecNow : 1}`
        )
        // console.log('sync: ' + output.toString())
        console.log('over')
        const chart = handleOutput(output.toString())
        //
        cb(err, { msg: '成功', res: resultDta, chart: chart })
      })
    }
  )

  // call.js
  // 同步执行
  // const output = execSync('python D:/kejian/bs/qpcr-end/SIRmodel/web.py')
  // console.log('sync: ' + output.toString())
  // console.log('over')

  // cb(null, '成功')
}

module.exports.reports = function (typeid, cb, chip, start, end) {
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
    case 4:
      reportFour(chip, start, end, function (err, result) {
        if (err) return cb(err)
        cb(null, result)
      })
      break
    default:
      cb('类型出错')
      break
  }
}
