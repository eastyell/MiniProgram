// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  if (event.name == '') {
    try {
      return await db.collection('loginusers')
        .where({
          _openid: event.openid
        })
        .update({
          data: {
            logindate: new Date(),
          }
        })
    } catch (e) {
      console.log(e);
    }
  } else if (event.name == 'NOTICE') {
    try {
      return await db.collection('loginusers')
        .where({
          _openid: event.openid
        })
        .update({
          data: {
            NOTICERefreshDate: new Date(),
          }
        })
    } catch (e) {
      console.log(e);
    }
  } else if (event.name == 'BBS') {
    try {
      return await db.collection('loginusers')
        .where({
          _openid: event.openid
        })
        .update({
          data: {
            BBSRefreshDate: new Date(),
          }
        })
    } catch (e) {
      console.log(e);
    }
  } else {
    try {
      return await db.collection('loginusers')
        .where({
          _openid: event.openid
        })
        .update({
          data: {
            'user.nickName': event.name,
          }
        })
    } catch (e) {
      console.log(e);
    }
  }
}