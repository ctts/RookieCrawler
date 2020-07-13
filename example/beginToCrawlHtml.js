const RokieCrawler = require('../lib/RokieCrawler')
async function beginToCrawlHtml () {
    const path = '#pl_top_realtimehot > table > tbody > tr > td.td-02 > a'
    const url = 'https://s.weibo.com/top/summary'
    const rokieCrawler = new RokieCrawler('weibo', url, path)
    rokieCrawler.setSchedule(100, (res, path) => {
        res.forEach(val => {
            console.log(val.text())
        })
    }, 1)
    rokieCrawler.work()
}
beginToCrawlHtml()