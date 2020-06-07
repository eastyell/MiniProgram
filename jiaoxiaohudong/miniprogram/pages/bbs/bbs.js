//分享界面
var that
const app = getApp()
const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 0,
    pageSize: 10,
    topics: {},
    visitCount: 0,
    username: '',
    ShowloginDate: '',
    update: false, // 用于发布动态后的强制刷新标记
    isvisible: false, //用于控制是否可以发布通知权限
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    that = this
    wx.cloud.init({
      env: app.globalData.evn
    })
    // 第一次加载的时候
    if (!wx.getStorageSync('refused')) {
      wx.setStorageSync('refused', false)
    }
    wx.setNavigationBarTitle({
      title: 'e起家校互动--' + app.globalData.title,
    })
    app.globalData.userInfo = wx.getStorageSync('userInfo')
    app.globalData.openid = wx.getStorageSync('openid')
    console.log('userInfo-home: ', app.globalData.userInfo)
    console.log('openid-home: ', app.globalData.openid) //权限控制
    db.collection('loginusers').where({
        _openid: app.globalData.openid,
        ISpublishBBS: true
      })
      .get({
        success: function (res) {
          if (res.data.length > 0) {
            console.log("显示")
            that.setData({
              isvisible: true,
            })
          }
        }
      })

    that.getVisitNum()
    that.getData()
  },

  onShow: function () {
    let refused = wx.getStorageSync('refused')
    // 查看是否授权
    wx.getSetting({
      success(res) {
        console.log(res)
        if (!res.authSetting['scope.userInfo'] && !refused) {
          // 未授权或拒绝，返回登陆界面进行授权
          wx.reLaunch({
            url: '../login/login',
          })
          return;
        }
      }
    })
    if (this.data.update) {
      //wx.startPullDownRefresh()
      wx.showNavigationBarLoading() //在标题栏中显示加载
      that.setData({
        page: 0
      })
      that.getData();
      this.setData({
        update: false
      })
    }
  },

  /**
   * 获取列表数据
   * 
   */
  getData: function () {
    db.collection('bbs')
      .limit(that.data.pageSize) // 限制返回数量为 10 条
      .orderBy('date', 'desc')
      .get({
        success: function (res) {
          // res.data 是包含以上定义的两条记录的数组
          console.log("返回数据：" + res.data.length)
          that.data.topics = res.data;
          for (let i = 0; i < that.data.topics.length; i++) {
            that.data.topics[i].date = util.formatTime(new Date(that.data.topics[i].date))
          }
          that.setData({
            topics: that.data.topics,
          })
          wx.hideNavigationBarLoading(); //隐藏加载
          wx.stopPullDownRefresh();

        },
        fail: function (event) {
          wx.hideNavigationBarLoading(); //隐藏加载
          wx.stopPullDownRefresh();
        }
      })
    that.getNoticeNum();
  },

  /**
   * item 点击
   */
  onItemClick: function (event) {
    var id = event.currentTarget.dataset.topicid;
    var openid = event.currentTarget.dataset.openid;
    console.log("id:" + id);
    console.log("openid:" + openid);
    wx.navigateTo({
      url: "../bbsDetail/bbsDetail?id=" + id + "&openid=" + openid 
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    that.setData({
      page: 0
    })
    that.getData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 获取后面十条
    console.log("that.data.topics.length: " + that.data.topics.length);
    let page = that.data.page + that.data.pageSize
    console.log("page: " + page);
    const db = wx.cloud.database();
    db.collection('bbs')
      .skip(page)
      .limit(that.data.pageSize) // 限制返回数量为 10 条
      .orderBy('date', 'desc')
      .get({
        success: function (res) {
          // res.data 是包含以上定义的两条记录的数组
          if (res.data.length > 0) {
            for (var i = 0; i < res.data.length; i++) {
              res.data[i].date = util.formatTime(new Date(res.data[i].date))
            }
            let new_data = res.data
            let old_data = that.data.topics
            that.setData({
              topics: old_data.concat(new_data),
              page: page,
            })
          } else {
            wx.showToast({
              title: '没有更多数据了',
            })
          }
        },
      })
  },

  /**
   * 获取当日访问人数
   */
  getVisitNum: function () {
    db.collection('loginusers').where({
      logindate: db.command.gte(new Date(util.transTime(new Date()) + ' 00:00:00')).and(db.command.lte(new Date(util.transTime(new Date()) + ' 23:59:59')))
    }).count({
      success: function (res) {
        that.setData({
          visitCount: res.total,
          username: app.globalData.userInfo.nickName
        })
        console.log("visit num:" + res.total)
      }
    })
  },

  /**
   * 获取未读通知数目
   */
  getNoticeNum: function () {
    // var loginDate = new Date()
    var noticeCount = 0
    db.collection('loginusers').where({
        _openid: app.globalData.openid
      })
      .get({
        success: function (res) {
          if (res.data.length > 0) {
            app.globalData.userInfo = res.data[0].user
            console.log('从表中获取用户信息 ', app.globalData.userInfo)
            var loginDate = res.data[0].BBSRefreshDate
            console.log('getNoticeLoginDate：' + loginDate)
            that.setData({
              ShowloginDate: util.formatTime(new Date(res.data[0].BBSRefreshDate))
            })
            console.log('ShowloginDate:' + that.data.ShowloginDate)
            db.collection('bbs').where({
                date: db.command.gte(loginDate)
              })
              .count({
                success: function (res) {
                  noticeCount = res.total,
                    console.log('noticeCount: ' + noticeCount)
                  if (noticeCount <= 0) {                
                    wx.hideTabBarRedDot({
                      index: 1,
                    })
                  } else {                  
                    wx.setTabBarBadge({
                      index: 1, //标志添加位置
                      text: "" + noticeCount + ""
                    })
                  }
                }
              })
          }
        }
      })
    //更新刷新时间
    //调用云函数登录
    wx.cloud.callFunction({
      name: 'UpdateUsers',
      data: {
        openid: app.globalData.openid,
        name: 'BBS'
      },
      success: res => {
        console.log('更新用户成功')
      }
    })   
  },

  /**
   * 发布公告
   */
  onPublishClick: function () {
    wx.navigateTo({
      url: '../publishBBS/publishBBS',
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})