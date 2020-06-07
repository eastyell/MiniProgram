//详情界面
var that
const db = wx.cloud.database();
const util = require('../../utils/util.js');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    topic: {},
    tid: '',
    openid: '',
    isLike: false,
    visible: false,
    isvisible: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    that = this;
    that.data.tid = options.id;
    that.data.openid = app.globalData.openid //options.openid;
    console.log('options.openid: ' + options.id)
    // 获取话题信息
    db.collection('topic').doc(that.data.tid).get({
      success: function(res) {
        that.topic = res.data;
        console.log(that.topic)
        that.topic.date = util.formatTime(new Date(that.topic.date))
        that.setData({
          topic: that.topic,
        })
      }
    })

    // 获取收藏情况
    db.collection('collect')
      .where({
        _openid: that.data.openid,
        tid: that.data.tid
      })
      .get({
        success: function(res) {
          if (res.data.length > 0) {
            that.refreshLikeIcon(true)
          } else {
            that.refreshLikeIcon(false)
          }
        },
        fail: console.error
      })

    //权限控制
    db.collection('loginusers').where({
        _openid: that.data.openid,
        ISreplay: true
      })
      .get({
        success: function(res) {
          if (res.data.length > 0) {
            console.log("显示")
            that.setData({
              visible: true,
            })
          }
        }
      })

  },

  onShow: function() {
    // 获取回复列表
    that.getReplay()
    that.visible = false
  },

  getReplay: function() {
    // 获取回复列表
    db.collection('replay')
      .where({
        t_id: that.data.tid
      })
      .get({
        success: function(res) {
          // res.data 包含该记录的数据     
          for (let i = 0; i < res.data.length; i++) {
            res.data[i].date = util.formatTime(new Date(res.data[i].date))
          }
          that.setData({
            replays: res.data
          })
        },
        fail: console.error
      })
  },
  /**
   * 刷新点赞icon
   */
  refreshLikeIcon(isLike) {
    that.data.isLike = isLike
    that.setData({
      isLike: isLike,
    })
  },

  // 打开文件
  previewFile: function(e) {
    wx.showLoading({
      title: '正在打开文件',
      mask: true
    })
    //获取当前图片的下标
    var index = e.currentTarget.dataset.index;
    console.log('begin  index: ' + index)
    let cloudfileid = this.data.topic.files[index];
    console.log('cloudfileid: ' + cloudfileid)
    wx.cloud.downloadFile({
      fileID: cloudfileid,
      success: res => {
        wx.hideLoading()
        // get temp file path
        console.log('tempFilePath: ' + res.tempFilePath)
        wx.openDocument({
          filePath: res.tempFilePath,
          success: function(res) {
            console.log('打开文档成功!')
          }
        })
      },
      fail: err => {
        // handle error
      }
    })
  },
  
  // 预览图片
  previewImg: function(e) {
    //获取当前图片的下标
    var index = e.currentTarget.dataset.index;

    wx.previewImage({
      //当前显示图片
      current: this.data.topic.images[index],
      //所有图片
      urls: this.data.topic.images
    })
  },
  /**
   * 喜欢点击
   */
  onLikeClick: function(event) {
    if (that.data.isLike) {
      // 需要判断是否存在
      that.removeFromCollectServer();
    } else {
      that.saveToCollectServer();
    }
  },
  /**
   * 添加到收藏集合中
   */
  saveToCollectServer: function(event) {
    console.log("收藏")
    db.collection('collect').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        tid: that.data.tid,
        date: new Date(),
      },
      success: function(res) {
        console.log("收藏成功")
        that.refreshLikeIcon(true)
        console.log(res)
      },
    })
  },
  /**
   * 从收藏集合中移除
   */
  removeFromCollectServer: function(event) {
    //调用云函数
    console.log('that.data.openid ' + that.data.openid)
    console.log('that.data.tid ' + that.data.tid)
    wx.cloud.callFunction({
      name: 'DelCollect',
      data: {
        openid: that.data.openid,
        tid: that.data.tid
      },
      success: res => {
        that.refreshLikeIcon(false)
      }
    })
  },

  /**
   * 跳转回复页面
   */
  onReplayClick() {
    wx.navigateTo({
      url: "../replay/replay?id=" + that.data.tid + "&openid=" + that.data.openid
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})