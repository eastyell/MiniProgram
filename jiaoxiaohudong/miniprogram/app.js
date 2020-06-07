//app.js
App({
  onLaunch: function() {

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {
      //openid: 'wx9aef094b9eb7dc88',
      evn: 'eastyell-5279'      
      
    }
  }
})