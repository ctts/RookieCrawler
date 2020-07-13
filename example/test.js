let Crawler = require('../lib/RokieCrawler')

async function beginToCrawlHtml () {
    const path = [
        '#content > div > div.article > ol > li > div > div.info > div.hd > a > span:nth-child(1)',
        '#content > div > div.article > ol > li > div > div.info > div.hd > a > span:nth-child(2)'
    ]
    // const path = '#content > div > div.article > ol > li > div > div.info > div.hd > a > span:nth-child(1)'
    let urls = []
    for (let i = 0; i < 10; i++) {
        urls.push(`https://movie.douban.com/top250?start=${i * 25}&filter=`)
    }
    const crawler = new Crawler('豆瓣', urls, path)
    crawler.setSchedule(1000, (result) => {
        // result.forEach((doms, index) => {
        //     console.log(index + doms.text())
        // })
        result.forEach((doms, index) => {
            console.log(doms.map(val => val.text()))
        })
    }, 1)
    crawler.work()
}
beginToCrawlHtml()