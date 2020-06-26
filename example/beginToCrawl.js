let Crawler = require('../lib/Crawler')
const crawler = new Crawler('weibo', 'https://www.mzitu.com/')
let targetDomArray = crawler.beginToCrawlHtml('https://www.mzitu.com/', '#pins > img')
targetDomArray.then(domArray => {
    domArray.forEach(val => {
        console.log(val.attr('data-original'))
    })
})