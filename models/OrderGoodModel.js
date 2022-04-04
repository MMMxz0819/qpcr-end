module.exports = function(db,callback){
	// 用户模型
	db.define("OrderGoodModel",{
		id : {type: 'serial', key: true},
		static_id : Number,
		chip_id : Number,
		chip_price : Number,
		chip_number : Number,
		goods_total_price : Number
	},{
		table : "sp_order_goods"
	});
	return callback();
}