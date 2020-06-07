//回复评论界面
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
    id: '',
    openid: '',
    content: '',
    images: [],
    files: [],
    user: {},
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
    that = this;
    that.data.user = app.globalData.userInfo;
    console.log("app.globalData.userInfo: " + app.globalData.userInfo)
    that.data.id = options.id;
    that.data.openid = options.openid;
    console.log("user：" + that.data.user);
    console.log("openid" + that.data.openid);
  },

  // bindKeyInput(e) {
  //   that.data.content = e.detail.value;
  //   console.log("内容：" + that.data.content)

  // },

  /**
   * 获取填写的内容
   */
  getTextAreaContent: function (event) {
    that.data.content = event.detail.value;
    console.log("内容：" + that.data.content)
  },

  /**
   * 回复
   */
  formSubmit: function (e) {
    console.log('图片：', that.data.images.length)
    console.log('内容：', that.data.content.length)   
    if (that.data.images.length > 0) {
      console.log('1')
      that.saveReplay();
    } else if (that.data.files.length > 0) {
      console.log('2')
      that.saveReplay();
    } else if (that.data.content.trim() != '') {
      console.log('3')
      that.saveReplay();
    } else {
      wx.showToast({
        icon: 'none',
        title: '写点东西吧！',
      })
    }
  },

  saveReplay: function () {
    wx.showLoading({
      title: '回复中',
      mask: true
    })
    let img_url = that.data.images;
    let voice_url = that.data.voice.voiceUrltemp;
    let img_url_ok = [];    
    let voice_url_ok ='';

    if ((img_url.length == 0) && (voice_url.length == 0)) {
      that.Replay([], [])
      return
    }

    //由于图片只能一张一张地上传，所以用循环
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
            if (voice_url.length == 0) {
              console.log('image publish: ', img_url_ok)
              that.Replay(img_url_ok, [])
              return
            } else
            { 
              console.log('voiceUrltemp: ' + voice_url)         
              wx.cloud.uploadFile({
                cloudPath: 'voices/' + that.timetostr(new Date()) + ".mp3", //必须指定文件名，否则返回的文件id不对 
                filePath: voice_url, // 小程序临时文件路径
                name: 'file', //后台获取的凭据
                success: res => {
                  console.log('voice success: ', res)
                  //获取录音文件存放云路径              
                  this.data.voice.voiceUrl = res.fileID
                  voice_url_ok = res.fileID
                  console.log('voice cloud path: ', this.data.voice.voiceUrl)
                  console.log('voice and image publish！', img_url_ok)
                  that.Replay(img_url_ok, voice_url_ok)
                  return                
                },
                fail: err => {
                  // handle error
                  that.publishFail('语音上传失败')
                  console.log('fail: ' + err.errMsg)
                }
              })
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
    
    console.log('voiceUrltemp: ' + voice_url)
    if ((voice_url.length != 0)  && (img_url.length == 0))  {
      wx.cloud.uploadFile({
        cloudPath: 'voices/' + that.timetostr(new Date()) + ".mp3", //必须指定文件名，否则返回的文件id不对 
        filePath: voice_url, // 小程序临时文件路径
        name: 'file', //后台获取的凭据
        success: res => {
          console.log('voice success: ', res)
          //获取录音文件存放云路径              
          this.data.voice.voiceUrl = res.fileID
          voice_url_ok = res.fileID
          console.log('voice cloud path: ', this.data.voice.voiceUrl)
          console.log('voice publish: ', voice_url_ok)
          that.Replay([], voice_url_ok)    
        },
        fail: err => {
          // handle error
          that.publishFail('语音上传失败')
          console.log('fail: ' + err.errMsg)
        }
      })
    }     
  },

  Replay: function (img_url_ok, voice_url_ok) {
    console.log('img_url_ok: ' , img_url_ok)
    console.log('voice_url_ok: ' , voice_url_ok)
    db.collection('replay').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        content: that.data.content,
        images: img_url_ok,
        voiceUrl: voice_url_ok,
        date: new Date(),
        user: that.data.user,
        u_id: that.data.openid,
        t_id: that.data.id,
      },
      success: function (res) {
        wx.showToast({
          title: '回复成功',
        })
        setTimeout(function () {
          wx.navigateBack({
            url: "../homeDetail/homeDetail?id=" + that.data.id + "&openid=" + that.data.openid
          })
        }, 1500)

      },
      fail: console.error
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

  onUnload: function () {
    innerAudioContext.stop()
    //清除计时器  即清除setInter
    clearInterval(that.data.setInter)
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
  }

})