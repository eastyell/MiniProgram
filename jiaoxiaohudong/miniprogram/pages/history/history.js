//发布历史
const app = getApp()
var that
const db = wx.cloud.database();
const util = require('../../utils/util.js');  

Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 0,
    pageSize: 10,
    totalCount: 0,   
    topics: {},
    openId:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    that = this
    that.openId = app.globalData.openid
    console.log("app.globalData.openid:  " + app.globalData.openid)
    that.getData(that.data.page);
  },
  /**
   * 获取列表数据
   * 
   */
  getData: function (page) {
    // 获取总数
    db.collection('bbs').where({
      _openid: that.openId, // 填入当前用户 openid 
    }).count({
      success: function (res) {
        that.data.totalCount = res.total;
      }
    })
    // 获取前十条
    console.log("app.globalData.openId:  " + that.openId)
    try {  
      db.collection('bbs')
        .where({
          _openid: that.openId , // 填入当前用户 openid
        })
        .limit(that.data.pageSize) // 限制返回数量为 10 条
        .orderBy('date', 'desc')
        .get({
          success: function (res) {
            that.data.topics = res.data;
            for (let i = 0; i < that.data.topics.length; i++) {
              that.data.topics[i].date = util.formatTime(new Date(that.data.topics[i].date))
            }
            that.setData({
              topics: that.data.topics,
            })
            wx.hideNavigationBarLoading();//隐藏加载
            wx.stopPullDownRefresh();

          },
          fail: function (event) {
            wx.hideNavigationBarLoading();//隐藏加载
            wx.stopPullDownRefresh();
          }
        })
    } catch (e) {
      wx.hideNavigationBarLoading();//隐藏加载
      wx.stopPullDownRefresh();
      console.error(e);
    }
  },
  /**
   * item 点击
   */
  onItemClick: function (event) {
    var id = event.currentTarget.dataset.topicid;
    console.log(id);
    wx.navigateTo({
      url: "../bbsDetail/bbsDetail?id=" + id
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
    that.getData(that.data.page);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var temp = [];
    // 获取后面十条
    console.log("that.data.totalCount: " + that.data.totalCount);
    console.log("that.data.topics.length: " + that.data.topics.length);
    let page = that.data.page + that.data.pageSize
    console.log("page: " + page);
    //if (that.data.topics.length  < that.data.totalCount) {
    if (true) {
      try {
        db.collection('bbs')
          .where({
            _openid: app.globalData.openid, // 填入当前用户 openid
          })
          .skip(page)
          .limit(that.data.pageSize) // 限制返回数量为 10 条
          .orderBy('date', 'desc')
          .get({
            success: function (res) {
              // res.data 是包含以上定义的两条记录的数组
              console.log("res.data: " + res.data.length);
              if (res.data.length > 0) {
                 for (var i = 0; i < res.data.length; i++) {
                //   var tempTopic = res.data[i];
                     res.data[i].date = util.formatTime(new Date(res.data[i].date))
                //   console.log(tempTopic);
                //   temp.push(tempTopic);
                 }

                // var totalTopic = {};
                // totalTopic = that.data.topics.concat(temp);

                // console.log(totalTopic);
                // that.setData({
                //   topics: totalTopic,
                // })
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
      } catch (e) {
        console.error(e);
      }
    } else {
      wx.showToast({
        title: '没有更多数据了',
      })
    }

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})