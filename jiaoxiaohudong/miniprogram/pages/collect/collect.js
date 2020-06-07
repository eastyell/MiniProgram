//我的收藏
var that
const db = wx.cloud.database()
const app = getApp()
const util = require('../../utils/util.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 0,
    pageSize: 5,
    totalCount: 0,
    collects: {},
    topics: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    that = this
  },

  onShow: function() {
    that.getData(that.data.page);
  },
  /**
   * 获取列表数据
   * 
   */
  getData: function(page) {
    console.log('openid:' + app.globalData.openid)
    db.collection('collect')
      .where({
        _openid: app.globalData.openid, // 填入当前用户 openid
      }).orderBy('date', 'desc')
      .get({
        success: function(res) {
          // res.data 是包含以上定义的两条记录的数组
          that.data.collects = res.data;
          that.getTopicFromCollects();
        },
      })
  },
  /**
   * 获取收藏中的 id 的话题
   */
  getTopicFromCollects: function(event) {
    var tempTopics = [];
    // for (var i = 0; i < that.data.collects.length; i++) {
    for (var i in that.data.collects) {
      var topicId = that.data.collects[i].tid;
      console.log("tempTopics_date.topicId:" + topicId)
      db.collection('topic')
        .doc(topicId)
        .get({
          success: function(res) {
            res.data.date = util.formatTime(new Date(res.data.date))
            console.log("res.data.date：" + res.data.date)
            tempTopics.push(res.data);
            //that.data.topics.push(tempTopics);
            that.setData({
              topics: tempTopics, //that.data.topics,
            })
          },
          fail: console.log
        })
    }
  },
  /**
   * item 点击
   */
  onItemClick: function(event) {
    var id = event.currentTarget.dataset.topicid;
    console.log('event.currentTarget.dataset.topicid ' + id);
    wx.navigateTo({
      url: "../homeDetail/homeDetail?id=" + id
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})