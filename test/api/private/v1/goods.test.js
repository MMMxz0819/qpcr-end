var path = require('path')
var dao = require(path.join(process.cwd(), 'dao/DAO'))
// set development environment
process.env.NODE_ENV = 'test'
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require(path.join(process.cwd(), 'app'))
chai.use(chaiHttp)

var common = require('../common/common.js')

var config = require(path.join(process.cwd(), 'test/configs/config'))
var url = config.baseURL + 'goods'

describe(url + ' good api testing', function () {
  var token

  var testGood = {
    chip_name: '__test_good_name',
    chip_price: 20,
    chip_number: 30,
  }

  before(function (done) {
    common.login(config.username, config.password, function (err, res) {
      chai.assert.equal(res.body.meta.status, 200, res.body.meta.msg)
      token = res.body.data.token
      done()
    })
  })

  after(function (done) {
    if (testGood.chip_id && testGood.chip_id > 0) {
      dao.destroy('ChipModel', testGood.chip_id, function (err) {
        done()
      })
    }
  })

  it('test to create good', function (done) {
    chai
      .request(app)
      .post(url)
      .set({ Authorization: token })
      .send(testGood)
      .end(function (err, res) {
        chai.assert.equal(res.body.meta.status, 201, res.body.meta.msg)
        chai.assert.isNotNull(res.body.data, 'The data is empty')
        testGood = res.body.data
        done()
      })
  })

  it('test to get good list', function (done) {
    chai
      .request(app)
      .get(url)
      .set({ Authorization: token })
      .query({
        pagenum: 1,
        pagesize: 1,
        query: testGood.chip_name,
      })
      .end(function (err, res) {
        chai.assert.equal(res.body.meta.status, 200, res.body.meta.msg)
        chai.assert.isOk(res.body.data.goods.length > 0, 'The goods is empty')
        done()
      })
  })

  it('test to delete good', function (done) {
    chai.assert.isNotNull(testGood.chip_id, 'The chip_id is null')
    var deleteURL = url + '/' + testGood.chip_id
    chai
      .request(app)
      .del(deleteURL)
      .set({ Authorization: token })
      .end(function (err, res) {
        chai.assert.equal(res.body.meta.status, 200, res.body.meta.msg)
        dao.findOne(
          'ChipModel',
          { chip_id: testGood.chip_id },
          function (err, good) {
            chai.assert.isNull(err, err)
            chai.assert.equal(good.is_del, '1', 'Delete failure')
            done()
          }
        )
      })
  })
})
