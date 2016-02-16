'use strict';

var fs = require('fs');
var util = require('./../util');
var USER_PATH = './database/user.json';
var UserDb = require('../../models/user');
var Teacher = require('../../models/teacher');


var User = {

  init: function(app){
    app.post('/user/get', this.getUser);
    app.post('/user/reg', this.addUser);
    app.post('/user/login', this.login);
    app.post('/user/login/token', this.loginByToken);
    app.post('/user/password/update', this.updatePassword);
    app.post('/user/delete', this.deleteUser);
    app.get('/user/findteacher', this.findTeacher);
    app.post('/user/findteacher/detail', this.findTeacherDetail);
  },

  //获取用户信息
  getUser: function(req, res){
    var key = req.param('key');
    var partment = req.param('partment');
    if(key !== util.getKey()){
      return res.send({
        status: 0,
        data: '使用了没有鉴权的key'
      });
    }
    fs.readFile(USER_PATH, function(err, data){
      if(!err){
        try{
          var obj = JSON.parse(data);
          var newObj = [];
          for(var i in obj){
            if(obj[i].partment === partment){
              delete obj[i]['password'];
              newObj.push(obj[i]);
            }
          }
          return res.send({
            status: 1,
            data: newObj
          });
        }catch(e){
          return res.send({
            status: 0,
            err: e
          });
        }
      }
      return res.send({
        status: 0,
        err: err
      });
    });
  },

  //添加用户
  addUser: function(req, res){
    var phoneNumber = req.param('phoneNumber');
    var password = req.param('password');
    var rpassword = req.param('rpassword');
    console.log(password === undefined);
    if(rpassword != password || password === undefined){
      console.log(1);
      res.send({
        status: 0,
        data: '两次输入密码不一致或密码不能为空'
      })
    }else{
      console.log(2);
      //生成密码的md5值
      var password = util.md5(req.param('password'));
      var newUser = new UserDb({
        phoneNumber: phoneNumber,
        password: password
      });
      //检查用户名是否存在
      UserDb.get(phoneNumber, function (err, user){
        console.log('检查用户不存在，进入创建用户步骤----------');
        if(user){
          res.send({
            status: 1,
            data: '用户名已存在'
          });
        }else{
          //如果不存在，则新增用户
          newUser.save(function (err, user){
            console.log(1);
            if(err){
              res.send({
                status: 2,
                data: '用户注册失败'
              })
            }else{
              res.send({
                status: 3,
                data: '注册用户成功',
                user: user
              })
            }
          })
        }
      })
    };

    //找老师
    
    /*var username = req.param('username');
    var password = util.md5(req.param('password'));
    var tel = req.param('tel');
    var email = req.param('email');
    var partment =  req.param('partment');
    var tag = req.param('tag');
    var creater = req.param('creater') || '';

    if(!username || !password || !tel || !email || !partment || !tag || !creater){
      return res.send({
        status: 0,
        data: '缺少必要参数'
      });
    }

    try{
      var content = JSON.parse(fs.readFileSync(USER_PATH));
      var obj = {
        "userid": util.guid(),
        "username": username,
        "password": password,
        "partment": partment,
        "tel": tel,
        "email": email,
        "tag": tag,
        "creater": creater,
        "time": new Date(),
        "token": ''
      };
      content.push(obj);
      //更新文件
      fs.writeFileSync(USER_PATH, JSON.stringify(content));
      delete obj.password;
      return res.send({
        status: 1,
        data: obj
      });
    }catch(e){
      return res.send({
        status: 0,
        err: e
      });
    }*/
  },
  findTeacher: function(req, res){
    Teacher.get(function (err, user){
      return res.send({
        user: user
      });
    })
  },
  findTeacherDetail: function (req, res){
    var id = req.param('id');
    console.log(id);
    Teacher.getDetail(id, function (err, user){
      return res.send({
        user: user
      })
    })
  },
  //用户登录
  login: function(req, res){
    var phoneNumber = req.param('phoneNumber');
    var password = util.md5(req.param('password'));
    var deviceId = req.param('deviceId');
    console.log(phoneNumber + ','+password+','+deviceId);
    //var token = util.guid() + deviceId;
    //var content = JSON.parse(fs.readFileSync(USER_PATH).toString());
    //检查用户名是否存在
    UserDb.get(phoneNumber, function (err, user){
      console.log(1);
      if(!user){
        return res.send({
          status: 0,
          data: '此用户不存在'
        });
      }
    })
    /*for(var i in content){
      //验证通过
      if(content[i].email === email && content[i].password === password){
        content[i]['token'] = token;
        //写入到文件中
        console.log(content[i]);
        fs.writeFileSync(USER_PATH, JSON.stringify(content));
        //删除密码
        delete content[i].password;
        return res.send({
          status: 1,
          data: content[i]
        });
      }
    }*/
  },

  //通过token登录
  loginByToken: function(req, res){
    var token = req.param('token');
    var content = JSON.parse(fs.readFileSync(USER_PATH));

    for(var i in content){
      if(token === content[i].token){
        delete content[i].password;
        return res.send({
          status:1,
          data: content[i]
        });
      }
    }

    return res.send({
      status: 0,
      info: 'token失效'
    });
  },

  //用户修改密码
  updatePassword: function(req, res){
    var token = req.param('token');
    var oldPassword = util.md5(req.param('oldPassword'));
    var password = util.md5(req.param('password'));

    var content = JSON.parse(fs.readFileSync(USER_PATH));
    for(var i in content){
      if(token === content[i].token && oldPassword === content[i].password){
        content[i].password = password;
        //写入到文件中
        fs.writeFileSync(USER_PATH, JSON.stringify(content));
        return res.send({
          status: 1,
          data: '更新成功'
        });
      }
    }

    return res.send({
      status: 0,
      data: '更新失败，没有找到该用户或者初始密码错误'
    });
  },

  //删除用户
  deleteUser: function(req, res) {
    var token = req.param('token');
    var email = req.param('email');

    var content = JSON.parse(fs.readFileSync(USER_PATH));
    for (var i in content) {
      if (token === content[i].token) {
        //遍历查找需要删除的用户
        for (var j in content) {
          if (content[j].email === email) {
            content.splice(j, 1);
            //写入到文件中
            fs.writeFileSync(USER_PATH, JSON.stringify(content));
            return res.send({
              status: 1,
              info: content,
              data: '删除成功'
            });
          }
        }

      }
    }
    return res.send({
      status: 0,
      err: '删除失败，没有找到该用户或者用户鉴权错误'
    });
  }
};


module.exports = User;