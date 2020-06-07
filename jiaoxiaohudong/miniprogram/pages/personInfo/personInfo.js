// pages/personInfo/personInfo.js
var app = getApp();
const dbquery = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: null,
    name: ''
  },

  /**
   *  获取填写的内容
   */
  getTextName: function(event) {
    this.data.name = event.detail.value;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },

  /**
   * 保存
   */
  formSubmitSave: function(e) {
    this.data.name = e.detail.value['name']
    if (this.data.name.trim() != '') {    
      //调用云函数修改姓名
      wx.cloud.callFunction({
        name: 'UpdateUsers',
        data: {
          openid: app.globalData.openid,
          name: this.data.name
        },
        success: res => {
          wx.showToast({
            title: '更新用户成功！',
          })
          console.log('更新用户成功')
          //刷新用户信息
          app.globalData.userInfo.nickName = this.data.name 
          // dbquery.collection('loginusers').where({
          //     _openid: app.globalData.openid
          //   })
          //   .get({
          //     success: function(res) {
          //       console.log(res.data[0].user.nickName)
          //       app.globalData.userInfo.nickName = res.data[0].user.nickName
          //     }
          //   })
          wx.navigateBack({
            url: "../me/me"
          })
        }
      })
    } else {
      wx.showToast({
        title: '不能为空！',
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.setData({
      'inputValue': app.globalData.userInfo.nickName,
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})