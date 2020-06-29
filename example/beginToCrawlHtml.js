let Crawler = require('../lib/Crawler')

async function beginToCrawlHtml () {
    const crawler = new Crawler()
    const path = '#pl_top_realtimehot > table > tbody > tr > td.td-02 > a'
    let targetDomArray = await crawler.beginToCrawlHtml('https://s.weibo.com/top/summary', path)
    targetDomArray.forEach(val => {
        console.log(val.text())
    })
}
beginToCrawlHtml()