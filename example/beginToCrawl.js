let Crawler = require('../lib/Crawler')
const crawler = new Crawler('weibo', 'https://s.weibo.com/')
let targetDomArray = crawler.beginToCrawlHtml('https://s.weibo.com/top/summary?cate=realtimehot', '#pl_top_realtimehot > table > tbody > tr > td.td-02 > a')
console.log(typeof targetDomArray)
targetDomArray.then(val => {
    console.log(typeof val)
})