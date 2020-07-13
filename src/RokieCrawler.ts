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
    path: Array<string> | string
    targetHtml: string | Array<string>
    schedule: Schedule
    constructor(siteName: string, siteUrl: string | Array<string>, path: string | Array<string>) {
        this.siteName = siteName
        this.siteUrl = siteUrl
        this.path = path
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
        let paths = this.path

        return async () => {
            let result: Array<Array<Cheerio> | Cheerio>

            if (typeof this.siteUrl === 'string') {
                this.targetHtml = (await this.crawlTarget(this.siteUrl)).text
            } else {
                this.targetHtml = (await Promise.all(this.crawlMutipartTarget(this.siteUrl))).map(res => res.text)
            }

            if (typeof paths === 'string') {
                result = this.analysisHTML(this.targetHtml, paths)
            } else {
                result = paths.map(path => this.analysisHTML(this.targetHtml, path))
            }

            return callback.call(this, result, paths)
        }
    }
    work() {
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
        header: Object = {},
        body?: Object
    ): Array<Promise<superagent.Response>> {
        return urls.map(url => {
            return this.crawlTarget(url, method, header, body)
        })
    }
    // 获取目标资源
    async crawlTarget(
        url: string,
        method: Methods = Methods.get,
        header: Object = {},
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
     * // 获取文件方法
     * @param uri 文件uri
     * @param stream node写入流
     * @param header 请求头
     */
    pipeTargetFile(uri: string, stream: NodeJS.WritableStream, header?: Object): NodeJS.WritableStream {
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
            return html.reduce((resSum: Array<Cheerio>, curhtml: string) => {
                let $ = cheerio.load(curhtml)
                let target: CheerioElement = allPath.reduce((sum: any, cur: string, index) => {
                    return index === 0 ? $(cur) : sum.find(cur)
                }, {})
                $(target).each((index: number, element: CheerioElement) => {
                    let content = $(element)
                    resSum.push(content)
                })
                return resSum
            }, [])
        }
    }
}

module.exports = RokieCrawler
