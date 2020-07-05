import * as superagent from 'superagent'
import * as cheerio from 'cheerio'
import Schedule from './Schedule';
require('superagent-charset')(superagent)
require('superagent-proxy')(superagent)

interface RokieCrawlerBase {
    siteName: string
    siteUrl: string | Array<string>
    path: Array<string> | string
}


enum Methods {
    post = "post",
    get = "get",
    head = "head",
}

class RokieCrawler implements RokieCrawlerBase {
    siteName: string
    siteUrl: string | Array<string>
    domain: string
    path: Array<string> | string
    targetHtml: string | Array<string>
    commonHeader: Object
    schedule: Schedule
    constructor(siteName: string, siteUrl: string | Array<string>, path: string | Array<string>) {
        this.siteName = siteName
        this.siteUrl = siteUrl
        // this.domain = siteUrl[0].replace(/(http|https):\/\//, '') || <string>siteUrl.replace(/(http|https):\/\//, '')
        this.path = path
        this.createCommonHeader()
    }
    setSchedule(
        frequency: string | number,
        callback: Function,
        time?: number
    ) {
        let func = this.createScheduleCallback.call(this, callback)
        this.schedule = new Schedule(func, time, frequency)
    }
    createScheduleCallback(callback: Function): Function {
        let _this: RokieCrawler = this
        let paths = _this.path

        return async function () {
            let result: Array<Array<Cheerio> | Cheerio>

            if (typeof _this.siteUrl === 'string') {
                _this.targetHtml = (await _this.crawlTarget(_this.siteUrl)).text
            } else {
                _this.targetHtml = (await Promise.all(_this.crawlMutipartTarget(_this.siteUrl))).map(res => res.text)
            }

            if (typeof paths === 'string') {
                result = _this.analysisHTML(_this.targetHtml, paths)
            } else {
                result = paths.map(path => _this.analysisHTML(_this.targetHtml, path))
            }

            return callback.call(_this, result, paths)
        }
    }
    beginToCrawl() {
        this.schedule.work()
    }
    // 开始爬取html
    async beginToCrawlHtml(url: string | Array<string>, path: string, header?: object): Promise<Array<Cheerio> | Array<Array<Cheerio>>> {
        if (typeof url === 'string') {
            let html: superagent.Response = await this.crawlTarget(url, Methods.get, header)
            return this.analysisHTML(html.text, path)
        } else {
            let responses: Array<Promise<superagent.Response>> = []
            let res: Array<Array<Cheerio>> = []
            responses = url.map(u => this.crawlTarget(u, Methods.get, header))
            let htmls = await Promise.all(responses)
            res = htmls.map(html => this.analysisHTML(html.text, path))
            return res
        }
    }
    crawlMutipartTarget(
        urls: Array<string>,
        method: Methods = Methods.get,
        header: Object = this.commonHeader,
        body?: Object
    ): Array<Promise<superagent.Response>> {
        return urls.map(url => {
            return superagent[method](url)
                .set(header)
                .send(body)
                // @ts-ignore
                .charset() // superagent-charset 辅助解析
                .buffer(true)
        })

    }
    // 获取目标资源
    async crawlTarget(
        url: string,
        method: Methods = Methods.get,
        header: Object = this.commonHeader,
        body?: Object
    ): Promise<superagent.Response> {
        return await superagent[method](url)
            .set(header)
            .send(body)
            // @ts-ignore
            .charset() // superagent-charset 辅助解析
            .buffer(true)
    }
    /**
     * // 爬取文件方法
     * @param uri 文件uri
     * @param stream node写入流
     * @param header 请求头
     */
    pipeTargetFile(uri: string, stream: NodeJS.WritableStream, header: Object = this.commonHeader): NodeJS.WritableStream {
        let resStream: NodeJS.WritableStream
        try {
            resStream = superagent
                .get(uri)
                .set(header)
                .pipe(stream)
        } catch (error) {
            console.warn(error)
        }
        return resStream
    }
    // 新建头部信息，初步反反爬虫
    createCommonHeader(custom?: Object) {
        if (custom) {
            this.commonHeader = custom
            return
        }
        let domain = this.domain
        let commonHeader = {
            'Accept': '*/*',
            'Connection': 'close',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36',
            'referer': domain || 'www.baidu.com',
        }
        domain && (commonHeader['host'] = domain)
        this.commonHeader = commonHeader
    }
    /**
     * html解析方法，使用cheerio辅助解析
     * @param html html文本
     * @param path 目标路径，中间以 > 隔开，依次调用find方法
     */
    analysisHTML(html: string | Array<string>, path: string): Array<Cheerio> {
        let allPath: Array<string> = path.split('>').map(v => v.trim())
        if (typeof html === 'string') {
            let $ = cheerio.load(html)
            let result: Array<Cheerio> = []
            let target: CheerioElement = allPath.reduce((sum: any, cur: string, index) => {
                return index === 0 ? $(cur) : sum.find(cur)
            }, {})
            $(target).each((index: number, element: CheerioElement) => {
                let content = $(element)
                result.push(content)
            })
            result.length === 0 && console.warn('No data found in this path!')
            return result
        } else {
            return html.reduce((sum: Array<Cheerio>, cur: string) => {
                let $ = cheerio.load(cur)
                let target: CheerioElement = allPath.reduce((sum: any, cur: string, index) => {
                    return index === 0 ? $(cur) : sum.find(cur)
                }, {})
                $(target).each((index: number, element: CheerioElement) => {
                    let content = $(element)
                    sum.push(content)
                })
                return sum
            }, [])
        }
    }
}

module.exports = RokieCrawler