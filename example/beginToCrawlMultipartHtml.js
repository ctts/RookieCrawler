let Crawler = require('../lib/Crawler')
const fs = require('fs')
async function getData () {
    const crawler = new Crawler()
    const path = '#content > div > div.article > div > table > tbody > tr > td.title > a'
    let urls = []
    for (let i = 0; i < 10; i++) {
        urls.push(`https://www.douban.com/group/HZhome/discussion?start=${i * 25}`)
    }
    let targetPageArray = await crawler.beginToCrawlHtml(urls, path)
    let result = targetPageArray.reduce((sum, cur, index) => {
        let curdata = cur.map(dom => ` ${dom.text()} : ${dom.attr('href')}`)
        return sum.concat(curdata)
    }, [])
    fs.writeFile('./home.txt', JSON.stringify(result), (err) => {
        if (err) return
    })
    console.log(result)
}
getData()