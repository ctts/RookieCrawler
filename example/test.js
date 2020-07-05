let Crawler = require('../lib/RokieCrawler')

async function beginToCrawlHtml () {
    const path = ['#pl_top_realtimehot > table > tbody > tr > td.td-02 > a', '#plc_main > div.menu > a.cur']
    const url = 'https://s.weibo.com/top/summary'
    const crawler = new Crawler('微博', url, path)
    crawler.setSchedule(1000, (result, path) => {
        result.forEach((doms, index) => {
            console.log(doms.map(val => val.text()))
        })
    }, 1)
    crawler.beginToCrawl()
}
beginToCrawlHtml()