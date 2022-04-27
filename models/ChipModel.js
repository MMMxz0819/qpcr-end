module.exports = function (db, callback) {
  // 用户模型
  db.define(
    'ChipModel',
    {
      chip_id: { type: 'serial', key: true },
      cat_id: Number,
      chip_name: String,
      chip_price: Number,
      chip_number: Number,
      chip_desc: Number,
      line: String,
      is_del: ['0', '1'], // 0: 正常 , 1: 删除
      add_time: Number,
      upd_time: Number,
      delete_time: Number,
      color_mumber: Number,
      cat_one_id: String,
      cat_two_id: String,
      cat_three_id: String,
    },
    {
      table: 'sp_chip',
      methods: {
        getGoodsCat: function () {
          return (
            this.cat_one_id + ',' + this.cat_two_id + ',' + this.cat_three_id
          )
        },
      },
    }
  )
  return callback()
}
