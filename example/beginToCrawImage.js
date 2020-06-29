const fs = require('fs')

let Crawler = require('../lib/Crawler')
const crawler = new Crawler()
const path = '#SUBD1565235654333777 > div > div > div.content > ul > li > div.conBox > div.img > a > img'
let targetDomArray = crawler.beginToCrawlHtml('https://tv.cctv.com/', path)
let srcArray = []
targetDomArray.then(domArray => {
    srcArray = domArray.map(val => val.attr('src'))
    srcArray.forEach((val, index) => {
        console.log(val.substring(2))
        crawler.pipeTargetFile(val.substring(2), fs.createWriteStream(process.cwd() + `/example/imageTest/${index}.jpg`))
    })
})
