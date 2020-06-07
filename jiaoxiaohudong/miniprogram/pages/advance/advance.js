// 意见反馈
var that
const db = wx.cloud.database();
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    title: '',
    content: '',
    user: {},
    id: '',
    openid: '', 
  },

  /**
   *  获取填写的内容
   */
  getTextAreaContent: function (event) {
    this.data.content = event.detail.value;
  },
 
  /**
   * 发布
   */
  formSubmit: function (e) {
    this.data.title = e.detail.value['title'];
    this.data.user = app.globalData.userInfo;
    this.data.openid = e.detail.openid;
    this.data.id = e.detail.id;
    if (this.data.canIUse) {
      if (this.data.title.trim() != '') {
        this.saveDataToServer();
      } else if (this.data.content.trim() != '') {
        this.saveDataToServer();
      } else {
        wx.showToast({
          title: '提点意见吧！',
        })
      }
    }
  },
  /**
   * 保存到发布集合中
   */
  saveDataToServer: function (event) {
    that = this;
    that.showTipAndSwitchTab();
    
  },
  /**
   * 添加成功添加提示，切换页面
   */
  showTipAndSwitchTab: function (event) {
    console.log(that.data.openid)
    console.log(that.data.id)
      db.collection('advance').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        title: that.data.title,
        content: that.data.content,
        date: new Date(),
        user: that.data.user,
        u_id: that.data.openid,
        t_id: that.data.id,

      },
      success: function (res) {
        wx.showToast({
          title: '反馈成功!',
        })
        setTimeout(function () {
          wx.navigateBack({
            url: "../home/home"
          })
        }, 1500)

      },
      fail: console.error
    })
    // wx.showToast({
    //   title: '反馈成功，后台会加急处理的~',
    // })
    // wx.navigateBack({
    //   url: '../home/home',
    // })
  },
 

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //this.jugdeUserLogin();
  },
  /**
   * 判断用户是否登录
   */
  jugdeUserLogin: function (event) {
     that = this;
    // 查看是否授权
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: function (res) {

              that.data.user = res.userInfo;
              console.log(that.data.user)
            }
          })
        }
      }
    })
  },
  /**
 * 生命周期函数--监听页面显示
 */
  onShow: function () {  
  },
  
})