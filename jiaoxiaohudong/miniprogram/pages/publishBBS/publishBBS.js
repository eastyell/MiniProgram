//发布界面
var that
const db = wx.cloud.database();
const app = getApp()
const recorderManager = wx.getRecorderManager()
const innerAudioContext = wx.createInnerAudioContext()

const options = {
  duration: 600000, //指定录音的时长，单位 ms
  sampleRate: 16000, //采样率
  numberOfChannels: 1, //录音通道数
  encodeBitRate: 96000, //编码码率
  format: 'mp3', //音频格式，有效值 aac/mp3
  frameSize: 50, //指定帧大小，单位 KB
}

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

Page({

  /**
   * 页面的初始数据
   */
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    content: '',
    images: [],
    files: [],
    user: {},
    isLike: false,
    // 最大字符数
    maxTextLen: 600,
    // 当前文本长度
    textLen: 0,
    stat: 0,
    setInter: '',
    voice: {
      playing: false, //是否正在播放
      stopPlay: false, //停止录音
      time: {}, //当前播放时间
      TotalTime: {},
      tip: '',
      src: "",
      margin: 0,
      showSpeed: '',
      voiceUrl: '',
      voiceUrltemp: ''
    },
    hours: '0' + 0, // 时
    minute: '0' + 0, // 分
    second: '0' + 0, // 秒
  },

  getWords(e) {
    let page = this;
    // 设置最大字符串长度(为-1时,则不限制)
    let maxTextLen = page.data.maxTextLen;
    // 文本长度
    let textLen = e.detail.value.length;

    page.setData({
      maxTextLen: maxTextLen,
      textLen: textLen,
      contentStr: e.detail.value
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    that = this
    that.setData({
      user: app.globalData.userInfo
    })
    console.log("app.globalData.userInfo: ", that.data.user)
  },
  /**
   * 获取填写的内容
   */
  getTextAreaContent: function (event) {
    that.data.content = event.detail.value;
  },

  /**
   * 选择图片
   */
  chooseImage: function (event) {
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有 
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有 
      success: function (res) {
        //把每次选择的图push进数组
        let img_url = that.data.images;
        for (let i = 0; i < res.tempFilePaths.length; i++) {
          img_url.push(res.tempFilePaths[i])
        }
        that.setData({
          images: img_url
        })

        // for (var i in res.tempFilePaths) {
        //   // 将图片上传至云存储空间
        //   wx.cloud.uploadFile({
        //     // 指定要上传的文件的小程序临时文件路径

        //     cloudPath: 'images/' + that.timetostr(new Date()),
        //     filePath: res.tempFilePaths[i],
        //     // 成功回调
        //     success: res => {
        //       that.data.images.push(res.fileID)    
        //     },
        //   })
        // }
      },
    })
  },

  // 计时器
  startSetInter: function () {
    const that = this
    var second = that.data.second
    var minute = that.data.minute
    var hours = that.data.hours
    that.data.setInter = setInterval(function () { // 设置定时器  
      recorderManager.onPause((res) => {
        console.log('异常停止录音!')  
        clearInterval(that.data.setInter)
        console.log('异常停止定时器！')
        that.setData({
          stat: 2,
        })
      })    
      console.log('定时器开始：' + hours + ':' + minute + ':' + second)
      that.data.voice.showSpeed = minute + ':' + second
      that.setData({
        voice: that.data.voice
      })
      second++
      if (second >= 60) {
        second = 0 //  大于等于60秒归零
        minute++
        if (minute >= 60) {
          minute = 0 //  大于等于60分归零
          hours++
          if (hours < 10) {
            // 少于10补零
            that.setData({
              hours: '0' + hours
            })
          } else {
            that.setData({
              hours: hours
            })
          }
        }
        if (minute < 10) {
          // 少于10补零
          // that.setData({
          //     minute: '0' + minute
          // })
          minute = '0' + minute
        } else {
          that.setData({
            minute: minute
          })
        }
      }
      if (second < 10) {
        // 少于10补零
        // that.setData({
        // second: "0" + parseInt(second)
        // })
        second = '0' + second
        // console.log('secoond: '+ second )
      } else {
        that.setData({
          second: second
        })
      }
    }, 1000)
  },

  /**
   * 开始录音
   */
  beginRecord: function (event) {
    //开始录音
    recorderManager.start(options);
    recorderManager.onStart(() => {
      that.data.hours = '0' + 0
      that.data.minute = '0' + 0
      that.data.second = '0' + 0
      console.log('开始录音！')
      that.startSetInter()
    });
    //错误回调
    recorderManager.onError((res) => {
      console.log(res);
    })
    that.setData({
      stat: 1,
    })
  },

  /** 
   * 停止录音
   */
  stopRecord: function (event) {
    recorderManager.stop();
    recorderManager.onStop((res) => {
      console.log('停止录音: ' + res.tempFilePath)
      this.data.voice.voiceUrltemp = res.tempFilePath
      clearInterval(this.data.setInter)
      console.log('停止定时器！')
    })
    that.setData({
      stat: 2,
    })
  },

  /**
   * 播放录音
   */
  startRecord: function (event) {      
    innerAudioContext.autoplay = true
    console.log('开始播放： ' + that.data.voice.voiceUrltemp)
    innerAudioContext.src = that.data.voice.voiceUrltemp
    innerAudioContext.onPlay(() => {  
      innerAudioContext.onTimeUpdate(() => {
        that.data.voice.time = dateformat(Math.round(innerAudioContext.currentTime))
        that.data.voice.TotalTime = dateformat(Math.round(innerAudioContext.duration))
        that.data.voice.showSpeed = that.data.voice.time.min + ':' + that.data.voice.time.sec +
          '     /    ' + that.data.voice.TotalTime.min + ':' + that.data.voice.TotalTime.sec
        that.setData({
          voice: that.data.voice
        })
        console.log('总进度为：' + that.data.voice.TotalTime.min + ':' + that.data.voice.TotalTime.sec +
          '当前进度为：' + that.data.voice.time.min + ':' + that.data.voice.time.sec);
      })
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
  },


  /**
   * 选择文件
   */
  chooseFiles: function (event) {
    wx.chooseMessageFile({
      count: 3,
      type: 'file', //能选择文件的类型
      success: function (res) {
        var size = res.tempFiles[0].size;
        var filename = res.tempFiles[0].name;
        var path = res.tempFiles[0].path;
        console.log('tempFiles: ', res.tempFiles)
        console.log('filename: ', filename)
        //把每次选择的图push进数组
        let file_url = that.data.files;
        for (let i = 0; i < res.tempFiles.length; i++) {
          file_url.push(res.tempFiles[i])
        }
        that.setData({
          files: file_url
        })
      },
    })
  },

  /**
   * 图片路径格式化
   */
  timetostr(time) {
    var randnum = Math.floor(Math.random() * (9999 - 1000)) + 1000;
    var str = randnum + "_" + time.getMilliseconds();
    return str;
  },

  /**
   * 执行发布时图片已经上传完成，写入数据库的是图片的fileId
   */
  publish: function (img_url_ok, file_url_ok) {
    let voice_url = that.data.voice.voiceUrltemp;
    console.log('voiceUrltemp: ' + voice_url)
    if (voice_url != '') {
      wx.cloud.uploadFile({
        cloudPath: 'voices/' + that.timetostr(new Date()) + ".mp3", //必须指定文件名，否则返回的文件id不对 
        filePath: voice_url, // 小程序临时文件路径
        name: 'file', //后台获取的凭据
        success: res => {
          console.log('voice success: ', res)
          //获取录音文件存放云路径              
          this.data.voice.voiceUrl = res.fileID
          console.log('voice cloud path: ', this.data.voice.voiceUrl)
          db.collection('bbs').add({
            // data 字段表示需新增的 JSON 数据
            data: {
              content: that.data.content,
              date: new Date(),
              images: img_url_ok,
              files: file_url_ok,
              voiceUrl: that.data.voice.voiceUrl,
              user: that.data.user,
              isLike: that.data.isLike,
            },
            success: function (res) {
              // 保存到发布历史
              that.saveToHistoryServer();
              wx.hideLoading()
              // 清空数据
              that.data.content = "";
              that.data.images = [];
              that.data.voice.voiceUrl = '';
              that.setData({
                textContent: '',
                images: [],
                files: [],
              })
              // 强制刷新，这个传参很粗暴
              var pages = getCurrentPages(); //  获取页面栈
              var prevPage = pages[pages.length - 2]; // 上一个页面
              prevPage.setData({
                update: true
              })
              that.showTipAndSwitchTab();
            },
            fail: function (res) {
              that.publishFail('发布失败')
            }
          })
        },
        fail: err => {
          // handle error
          that.publishFail('语音上传失败')
          console.log('fail: ' + err.errMsg)
        }
      })
    } else {
      db.collection('bbs').add({
        // data 字段表示需新增的 JSON 数据
        data: {
          content: that.data.content,
          date: new Date(),
          images: img_url_ok,
          files: file_url_ok,
          voiceUrl: that.data.voice.voiceUrl,
          user: that.data.user,
          isLike: that.data.isLike,
        },
        success: function (res) {
          // 保存到发布历史
          that.saveToHistoryServer();
          wx.hideLoading()
          // 清空数据
          that.data.content = "";
          that.data.images = [];
          that.data.voice.voiceUrl = '';
          that.setData({
            textContent: '',
            images: [],
            files: [],
          })
          // 强制刷新，这个传参很粗暴
          var pages = getCurrentPages(); //  获取页面栈
          var prevPage = pages[pages.length - 2]; // 上一个页面
          prevPage.setData({
            update: true
          })
          that.showTipAndSwitchTab();
        },
        fail: function (res) {
          that.publishFail('发布失败')
        }
      })
    }
    // var that = this
    // wx.cloud.callFunction({
    //   name: 'publish_post',
    //   data: {
    //     openid: app.globalData.openId,// 这个云端其实能直接拿到
    //     author_name: app.globalData.wechatNickName,
    //     author_avatar_url: app.globalData.wechatAvatarUrl,
    //     content: this.data.content,
    //     image_url: img_url_ok,
    //     publish_time: "",
    //     update_time: ""//目前让服务器自己生成这两个时间
    //   },
    //   success: function (res) {
    //     // 强制刷新，这个传参很粗暴
    //     var pages = getCurrentPages();             //  获取页面栈
    //     var prevPage = pages[pages.length - 2];    // 上一个页面
    //     prevPage.setData({
    //       update: true
    //     })
    //     wx.hideLoading()
    //     wx.navigateBack({
    //       delta: 1
    //     })
    //   },
    //   fail: function (res) {
    //     that.publishFail('发布失败')
    //   }
    // })
  },

  /**
   * 发布
   */
  formSubmit: function (e) {
    console.log('图片：', that.data.images)
    this.data.content = e.detail.value['input-content'];
    if (this.data.canIUse) {
      if (this.data.images.length > 0) {
        this.saveDataToServer();
      } else if (this.data.files.length > 0) {
        this.saveDataToServer();
      } else if (this.data.content.trim() != '') {
        this.saveDataToServer();
      } else {
        wx.showToast({
          icon: 'none',
          title: '写点东西吧！',
        })
      }
    }
  },
  /**
   * 保存到发布集合中
   */
  saveDataToServer: function (event) {
    wx.showLoading({
      title: '发布中',
      mask: true
    })
    let img_url = that.data.images;
    let file_url = that.data.files;
    let img_url_ok = [];
    let file_url_ok = [];

    //由于图片只能一张一张地上传，所以用循环
    if ((img_url.length == 0) && (file_url.length == 0)) {
      that.publish([], [])
      return
    }
    for (let i = 0; i < img_url.length; i++) {
      wx.cloud.uploadFile({
        cloudPath: 'images/' + that.timetostr(new Date()) + ".png", //必须指定文件名，否则返回的文件id不对 
        filePath: img_url[i], // 小程序临时文件路径
        success: res => {
          // get resource ID: 
          // console.log(res)
          console.log('image success: ', res)
          //把上传成功的图片的地址放入数组中
          img_url_ok.push(res.fileID)
          //如果全部传完，则可以将图片路径保存到数据库
          if (img_url_ok.length == img_url.length) {
            if (file_url.length == 0) {
              console.log('image publish: ', img_url_ok)
              that.publish(img_url_ok, [])
              return
            }
          }
        },
        fail: err => {
          // handle error
          that.publishFail('图片上传失败')
          console.log('fail: ' + err.errMsg)
        }
      })
    }
    for (let i = 0; i < file_url.length; i++) {
      console.log('file path: ', file_url[i].path)
      wx.cloud.uploadFile({
        cloudPath: 'files/' +
          file_url[i].name, //+ `${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}` +
        //file_url[i].path.match(/\.[^.]+?$/)[0], //必须指定文件名，否则返回的文件id不对 
        filePath: file_url[i].path, //刚刚在data保存的文件路径
        name: 'file', //后台获取的凭据
        success: res => {
          console.log('file success: ', res)
          file_url_ok.push(res.fileID)
          if (file_url_ok.length == file_url.length) {
            if (img_url.length == 0) {
              console.log('file publish: ', file_url_ok)
              that.publish([], file_url_ok)
            } else {
              console.log('file and image publish！', img_url_ok)
              that.publish(img_url_ok, file_url_ok)
            }
          }
        },
        fail: err => {
          // handle error
          that.publishFail('文件上传失败')
          console.log('fail: ' + err.errMsg)
        }
      })
    }
  },

  /**
   * 图片上传失败
   */
  publishFail(info) {
    wx.showToast({
      image: '../../images/publish/warn.png',
      title: info,
      mask: true,
      duration: 2500
    })
  },

  /**
   * 添加成功添加提示，切换页面
   */
  showTipAndSwitchTab: function (event) {
    wx.showToast({
      title: '发布成功！',
    })
    wx.switchTab({
      url: '../bbs/bbs',
    })
  },

  /**
   * 删除语音
   */
  removeVoice: function (event) {
    // 渲染图片
    that.data.voice.showSpeed = ''
    that.data.voice.voiceUrl = ''
    that.data.voice.voiceUrltemp = ''
    this.setData({
      stat: 0,
      voice: this.data.voice
    })
    innerAudioContext.stop()
    console.log('暂停播放！')
  },

  /**
   * 删除文件
   */
  removeFile: function (event) {
    var position = event.currentTarget.dataset.index;
    console.log('del index:' + position)
    this.data.files.splice(position, 1);
    // 渲染图片
    this.setData({
      files: this.data.files,
    })
  },

  // 预览文件
  previewFile: function (e) {
    //获取当前图片的下标
    var position = e.currentTarget.dataset.index;
    console.log('file index:' + position);
    let path = this.data.files[position].path;
    console.log('file path: ' + path)
    wx.openDocument({
      filePath: path,
      success: function (res) {
        console.log('打开文档成功')
      }
    })
  },

  /**
   * 删除图片
   */
  removeImg: function (event) {
    var position = event.currentTarget.dataset.index;
    console.log('del index:' + position)
    this.data.images.splice(position, 1);
    // 渲染图片
    this.setData({
      images: this.data.images,
    })
  },
  // 预览图片
  previewImg: function (e) {
    //获取当前图片的下标
    var position = e.currentTarget.dataset.index;
    console.log('image index:' + position)
    wx.previewImage({
      //当前显示图片
      current: this.data.images[position],
      //所有图片
      urls: this.data.images
    })
  },

  /**
   * 添加到发布集合中
   */
  saveToHistoryServer: function (event) {
    db.collection('history').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        content: that.data.content,
        date: new Date(),
        images: that.data.images,
        files: that.data.files,
        user: that.data.user,
        isLike: that.data.isLike,
      },
      success: function (res) {
        // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
        console.log(res)
      },
      fail: console.error
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  onUnload: function () {
    innerAudioContext.stop()
    //清除计时器  即清除setInter
    clearInterval(that.data.setInter)
  },


})