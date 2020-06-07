//发布界面
var that
const db = wx.cloud.database();
const app = getApp()
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
  onLoad: function(options) {
    that = this
    that.setData({
      user: app.globalData.userInfo
    })
    console.log("app.globalData.userInfo: " ,that.data.user)
  },
  /**
   * 获取填写的内容
   */
  getTextAreaContent: function(event) {
    that.data.content = event.detail.value;
  },

  /**
   * 选择图片
   */
  chooseImage: function(event) {
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有 
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有 
      success: function(res) {
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

  
  /**
   * 选择文件
   */
  chooseFiles: function(event) {
    wx.chooseMessageFile({
      count: 3,
      type: 'file', //能选择文件的类型
      success: function(res) {
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
    var str = randnum + "_" + time.getMilliseconds() + ".png";
    return str;
  },

  /**
   * 执行发布时图片已经上传完成，写入数据库的是图片的fileId
   */
  publish: function(img_url_ok, file_url_ok) {
    console.log('img_url_ok: ',img_url_ok)
    console.log('file_url_ok: ',file_url_ok)
    db.collection('topic').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        content: that.data.content,
        date: new Date(),
        images: img_url_ok,
        files: file_url_ok,
        user: that.data.user,
        isLike: that.data.isLike,
      },
      success: function(res) {
        // 保存到发布历史
        that.saveToHistoryServer();
        wx.hideLoading()
        // 清空数据
        that.data.content = "";
        that.data.images = [];
        that.setData({
          textContent: '',
          images: [],
          files: [],
        })
        // 强制刷新，这个传参很粗暴
        var pages = getCurrentPages();             //  获取页面栈
        var prevPage = pages[pages.length - 2];    // 上一个页面
        prevPage.setData({
          update: true
        })       
        that.showTipAndSwitchTab();
      },
      fail: function(res) {
        that.publishFail('发布失败')
      }
    })
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
  formSubmit: function(e) {
    console.log('图片：', that.data.images)
    this.data.content = e.detail.value['input-content'];
    if (this.data.canIUse) {
      if (this.data.images.length > 0) {
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
  saveDataToServer: function(event) {
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
        cloudPath: 'images/' + that.timetostr(new Date()), //必须指定文件名，否则返回的文件id不对 
        filePath: img_url[i], // 小程序临时文件路径
        success: res => {
          // get resource ID: 
          console.log(res)
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
  showTipAndSwitchTab: function(event) {
    wx.showToast({
      title: '发布成功！',
    })
    wx.switchTab({
      url: '../home/home',
    })
  },

  
  /**
   * 删除文件
   */
  removeFile: function(event) {
    var position = event.currentTarget.dataset.index;
    console.log('del index:' + position)
    this.data.files.splice(position, 1);
    // 渲染图片

  },

  // 预览文件
  previewFile: function(e) {
    //获取当前图片的下标
    var position = e.currentTarget.dataset.index;
    console.log('file index:' + position);
    let path = this.data.files[position].path;
    console.log('file path: ' + path)
    wx.openDocument({
      filePath: path,
      success: function(res) {
        console.log('打开文档成功')
      }
    })
  },

  /**
   * 删除图片
   */
  removeImg: function(event) {
    var position = event.currentTarget.dataset.index;
    console.log('del index:' + position)
    this.data.images.splice(position, 1);
    // 渲染图片
    this.setData({
      images: this.data.images,
    })
  },
  // 预览图片
  previewImg: function(e) {
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
  saveToHistoryServer: function(event) {
    db.collection('history').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        content: that.data.content,
        date: new Date(),
        images: that.data.images,
        user: that.data.user,
        isLike: that.data.isLike,
      },
      success: function(res) {
        // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
        console.log(res)
      },
      fail: console.error
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})