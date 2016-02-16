'use strict';
var mongodb = require('./db');
var crypto = require('crypto');

function Teacher(teacher){
	this.name = teacher.name;
	this.address = teacher.address;
};

module.exports = Teacher;

Teacher.get = function(callback){
	mongodb.open(function (err, db){
		if (err){
			return callback(err);
		} else {
			db.collection('teachers', function (err, collection){
				if (err){
					mongodb.close();
					return callback(err);
				} else {
					collection.count({}, function (err, total){
						collection.find({}, {
							limit: 20
						}).sort({
							time: -1
						}).toArray(function (err,　docs){
							mongodb.close();
							if(err){
								return callback(err);
							}
							callback(null, docs);
						})
					})
				}
			})
		}
	})
}

Teacher.getDetail = function(id, callback){
	mongodb.open(function (err, db){
		if(err){
			return callback(err);
		}else{
			db.collection('teachers', function (err, collection){
				if(err){
					mongodb.close();
					return callback(err);
				}else{
					collection.findOne({
						_id: id
					}, function (err, user){
						console.log(user);
						mongodb.close();
						if(err){
							return callback(err);
						}else{
							callback(null, user);
						}
					})
				}
			})
		}
	})
}
