//登陆界面
var that
const app = getApp()
const dbquery = wx.cloud.database();
const dbupdate = wx.cloud.database();

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    ISswitch: false,
    title: ''
  },

  onLoad: function() {
    that = this
    that.switchdo()
    // 查看是否授权
    wx.getSetting({
      success(res) {
        console.log(res)
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success(res) {
              app.globalData.userInfo = res.userInfo
              console.log('userInfo: ', res.userInfo)
              that.login(res.userInfo)
            }
          })
        }
      }
    })
  },

  login: function(userInfo) {
    wx.setStorageSync('userInfo', userInfo);
    //调用云函数登录
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        wx.setStorageSync('openid', res.result.openid);
        app.globalData.openid = res.result.openid;
        app.globalData.userInfo = userInfo;
        //添加登陆的用户信息
        dbquery.collection('loginusers').where({
            _openid: app.globalData.openid
          })
          .get({
            success: function(res) {
              if (res.data.length <= 0) {
                console.log('新增用户信息')
                dbupdate.collection('loginusers').add({
                  data: {
                    _openid: app.globalData.openid,
                    user: app.globalData.userInfo,
                    createdate: new Date(),
                    logindate: new Date()
                  }
                })
              } else {
                console.log('更新用户信息')   
                app.globalData.userInfo = res.data[0].user
                console.log('从表中获取用户信息 ', app.globalData.userInfo)
                //调用云函数登录
                wx.cloud.callFunction({
                  name: 'UpdateUsers',
                  data: {
                    openid: app.globalData.openid,
                    name: ''
                  },
                  success: res => {
                    console.log('更新用户成功')  
                  }
                })
              }
            }
          })
        if (!that.data.ISswitch) {
          wx.switchTab({
            url: '../home/home',
          })
        } else {
          wx.navigateTo({
            url: '../switch/switch',
          })
        }
      }
    })
  },

  //判断是否切换
  switchdo: function() {
    dbquery.collection('loginusers').where({
        _openid: 'oLoxV4z5cpY-nFGiM05zkSLHCtp0'
      })
      .get({
        success: function(res) {
          if (res.data.length > 0) {
            console.log('切换判断：' + res.data[0].ISswitch)
            that.setData({
              ISswitch: res.data[0].ISswitch,              
              title: res.data[0].title,
            })
            app.globalData.title = that.data.title            
          }
        }
      })
  },

  bindGetUserInfo(e) {
    console.log(e)
    if (!e.detail.userInfo) {
      wx.setStorageSync('refused', true)
    }
    that.login(e.detail.userInfo)
  }
})