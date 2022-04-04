module.exports = function(db,callback){
	// 用户模型
	db.define("GoodModel",{
		chip_id : {type: 'serial', key: true},
		cat_id : Number,
		chip_name : String,
		chip_price : Number,
		chip_number : Number,
		chip_desc : Number,
		goods_introduce : String,
		line : String,
		goods_small_logo : String,
		goods_state : Number,	// 0：未审核 1: 审核中 2: 已审核
		is_del : ['0','1'],	// 0: 正常 , 1: 删除
		add_time : Number,
		upd_time : Number,
		delete_time : Number,
		color_mumber : Number,
		is_promote : Boolean,
		cat_one_id : Number,
		cat_two_id : Number,
		cat_three_id : Number

	},{
		table : "sp_chip",
		methods: {
		getGoodsCat: function () {
			return this.cat_one_id + ',' + this.cat_two_id + ',' + this.cat_three_id;
		}
	}
	});
	return callback();
}