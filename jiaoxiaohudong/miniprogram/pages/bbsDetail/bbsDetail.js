// pages/bbsDetail/bbsDetail.js
var that
const db = wx.cloud.database();
const util = require('../../utils/util.js');
const app = getApp()
var innerAudioContext = wx.createInnerAudioContext()
var playing = false
var areaWidth //播放进度滑块移动区域宽度
var viewWidth //播放进度滑块宽度
var lastTime //滑块移动间隔计算
var VoiceCloud //录音云文件ID

Page({

  /**
   * 页面的初始数据
   */
  data: {
    topic: {},
    replays: {},
    tid: '',
    openid: '',
    isLike: false,
    visible: false,
    isvisible: false,
    isvoice: false,
    voice: {
      playing: false, //是否正在播放
      canPlay: false, //是否可以播放、加载完毕
      time: {}, //当前播放时间
      TotalTime: {},
      tip: "",
      src: "", //"https://6561-eastyell-5279-1258777974.tcb.qcloud.la/voices/43%20Final%20Exercise.mp3?sign=87b9ffc21c643c3657469ac736831620&t=1580995448",
      margin: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    that = this;
    that.data.tid = options.id;
    that.data.openid = app.globalData.openid //options.openid;
    console.log('options.openid: ' + app.globalData.openid)
    // 获取话题信息
    db.collection('bbs').doc(that.data.tid).get({
      success: function (res) {
        that.topic = res.data;
        that.VoiceCloud = that.topic.voiceUrl
        console.log('语音云地址: ', that.VoiceCloud)
        that.topic.date = util.formatTime(new Date(that.topic.date))
        that.setData({
          topic: that.topic,
        })
        //获取录音文件http地址
        wx.cloud.downloadFile({
          fileID: that.VoiceCloud,
          success: res => {
            // get temp file path
            that.data.voice.src = res.tempFilePath
            console.log('下载web地址: ' + res.tempFilePath)

            //语音播放
            innerAudioContext = wx.createInnerAudioContext()
            innerAudioContext.src = that.data.voice.src
            //播放
            console.log("播放-->", that.data.voice.src)
            innerAudioContext.obeyMuteSwitch = false
            innerAudioContext.autoplay = true
            innerAudioContext.onPlay(() => {
              console.log('onPlay')
              playing = true
              that.data.voice.tip = "Playing"
              that.data.voice.playing = true
              that.data.voice.canPlay = true //加载完成后可以
              that.setData({
                voice: that.data.voice
              })
            })
            innerAudioContext.onStop(() => {
              console.log('onStop')
              playing = false
              that.data.voice.tip = "Stop"
              that.data.voice.playing = false

              that.setData({
                voice: that.data.voice
              })
            })
            innerAudioContext.onPause(() => {
              console.log('Pause')
              playing = false
              that.data.voice.tip = "Pause"
              that.data.voice.playing = false
              that.setData({
                voice: that.data.voice
              })
            })
            //播放进度
            innerAudioContext.onTimeUpdate(() => {
              that.data.voice.progress = Math.round(100 * innerAudioContext.currentTime / innerAudioContext.duration)
              that.data.voice.time = dateformat(Math.round(innerAudioContext.currentTime))
              that.data.voice.margin = Math.round((areaWidth - viewWidth) * (innerAudioContext.currentTime / innerAudioContext.duration)) //计算当前滑块margin-left
              that.data.voice.TotalTime = dateformat(Math.round(innerAudioContext.duration))
              console.log('进度', innerAudioContext.currentTime + "  " + innerAudioContext.duration)
              that.setData({
                voice: that.data.voice
              })
            })
            //播放结束
            innerAudioContext.onEnded(() => {
              console.log("onEnded")
              playing = false
              that.data.voice.progress = 100
              that.data.voice.tip = "End Playing"
              that.data.voice.playing = false
              that.data.voice.time = dateformat(Math.round(innerAudioContext.duration))
              that.data.voice.margin = Math.round(areaWidth - viewWidth)
              that.setData({
                voice: that.data.voice
              })

            })
            //播放错误
            innerAudioContext.onError((res) => {
              console.log(res.errMsg)
              console.log(res.errCode)
              playing = false
              that.data.voice.tip = "Error Playing"
              that.data.voice.playing = false
              that.setData({
                voice: that.data.voice
              })
              wx.showToast({
                title: '错误:' + res.errMsg,
                icon: "none"
              })
            })

          },
          fail: err => {
            // handle error
          }
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
        success: function (res) {
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
        ISreplayBBS: true
      })
      .get({
        success: function (res) {
          if (res.data.length > 0) {
            console.log("显示")
            that.setData({
              visible: true,
            })
          }
        }
      })

    //第一次进来应该获取节点信息，用来计算滑块长度
    if (areaWidth == undefined || areaWidth == null || viewWidth == undefined || viewWidth == null) {
      var query = wx.createSelectorQuery()
      setTimeout(function () { //代码多的情况下需要延时执行，否则可能获取不到节点信息
        //获取movable的宽度，计算改变进度使用
        query.select('#movable-area').boundingClientRect(function (rect) {
          areaWidth = rect.width
          console.log("areaWidth------->", areaWidth)
        }).exec()
        query.select('#movable-view').boundingClientRect(function (rect) {
          viewWidth = rect.width // 节点的宽度
          console.log("viewWidth------->", viewWidth)
        }).exec()
      }, 1000)
    }

  },

  onShow: function () {
    // 获取回复列表
    that.getReplay()
    that.visible = false
  },

  getReplay: function () {
    // 获取回复列表
    db.collection('replay')
      .where({
        t_id: that.data.tid
      })
      .get({
        success: function (res) {
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
  previewFile: function (e) {
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
          success: function (res) {
            console.log('打开文档成功!')
          }
        })
      },
      fail: err => {
        // handle error
      }
    })
  },

   // 播放音频
   playVoice: function (e) {
    //获取播放音频的下标
    var item = e.currentTarget.dataset.item;
    var voiceUrl =  this.data.replays[item].voiceUrl
    console.log('播放音频云地址: ',voiceUrl)
    //获取录音文件http地址
    wx.cloud.downloadFile({
      fileID: voiceUrl,
      success: res => {
        // get temp file path    
        console.log('音频web地址: ' + res.tempFilePath)
        const innerAudioContext1 = wx.createInnerAudioContext()        
        innerAudioContext1.src = res.tempFilePath
        innerAudioContext1.autoplay = true
        console.log('音频web地址: ' + res.tempFilePath)
        innerAudioContext1.onPlay(() => {
          console.log('正在播放！')
        // this.setData({
        //    status: "正在播放"
        //   })
       })
      },
      fail: err => {
        console.log('播放失败！')
      }
    })
  },


  // 预览回复图片
  previewImgRpy: function (e) {
    //获取当前图片的下标
    var index = e.currentTarget.dataset.index;
    var item = e.currentTarget.dataset.item;
    console.log('e.currentTarget.dataset: ', e.currentTarget.dataset)
    wx.previewImage({
      //当前显示图片
      current: this.data.replays[item].images[index],
      //所有图片
      urls: this.data.replays[item].images
    })
  },

  // 预览图片
  previewImg: function (e) {
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
  onLikeClick: function (event) {
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
  saveToCollectServer: function (event) {
    console.log("收藏")
    db.collection('collect').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        tid: that.data.tid,
        date: new Date(),
      },
      success: function (res) {
        console.log("收藏成功")
        that.refreshLikeIcon(true)
        console.log(res)
      },
    })
  },
  /**
   * 从收藏集合中移除
   */
  removeFromCollectServer: function (event) {
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
    innerAudioContext.stop()
    wx.navigateTo({
      url: "../replay/replay?id=" + that.data.tid + "&openid=" + that.data.openid
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  //移动结束再setData，否则真机上会产生 “延迟重放” 
  seekTouchEnd: function (e) {
    var that = this
    setTimeout(function () {
      that.setData({
        voice: that.data.voice
      })
      innerAudioContext.seek(innerAudioContext.duration * (that.data.voice.progress / 100))
      innerAudioContext.play()
    }, 300)
  },
  //移动音频滑块，此处不能设置moveable-view 的x值，会有冲突延迟
  voiceSeekMove: function (e) {
    var that = this
    if (e.detail.source == "touch") {
      innerAudioContext.stop()
      console.log(e)
      if (that.data.voice.canPlay) {
        var progress = Math.round(e.detail.x / (areaWidth - viewWidth) * 100)
        that.data.voice.progress = progress
        that.data.voice.margin = e.detail.x
        that.data.voice.time = dateformat(Math.round(innerAudioContext.duration * (that.data.voice.progress / 100)))
      }
    }
  },
  //点击播放、暂停
  voiceClick: function () {
    var playing2 = this.data.voice.playing
    if (playing2) {
      innerAudioContext.pause()
    } else {
      innerAudioContext.play()
    }
  },

  onUnload: function () {
    innerAudioContext.stop()
},

})

function dateformat(second) {
  //天
  var day = Math.floor(second / (3600 * 24))
  // 小时位
  var hour = Math.floor((second - day * 3600 * 24) / 3600);
  // 分钟位
  var min = Math.floor((second - day * 3600 * 24 - hour * 3600) / 60);
  // 秒位
  var sec = (second - day * 3600 * 24 - hour * 3600 - min * 60); // equal to => var sec = second % 60;

  return {
    'day': day,
    'hour': p(hour),
    'min': p(min),
    'sec': p(sec)
  }
}
//创建补0函数
function p(s) {
  return s < 10 ? '0' + s : s;
}