import * as superagent from 'superagent'
import * as cheerio from 'cheerio'
import Schedule from './Schedule';
require('superagent-charset')(superagent)
require('superagent-proxy')(superagent)

interface CrawlerBase {
    siteName: string
    domain: string
    scheduleMap: Map<string, Schedule> // 存储nodeschedule对象或interval的id
    commonHeader: Object
    targetHtml: string
    createSchedule: Function
    cancelSchedule: Function
    cancelAllSchedule: Function
    beginToCrawlHtml: Function
    getTarget: Function
    pipeTargetFile: Function
    createCommonHeader: Function
    analysisHTML: Function
}

enum Methods {
    post = "post",
    get = "get",
    head = "head",
}

class RookieCrawler implements CrawlerBase {
    siteName: string
    domain: string
    targetHtml: string;
    scheduleMap: Map<string, Schedule> // 存储nodeschedule对象或interval的id
    commonHeader: Object

    constructor(
        siteName: string = '',
        domain: string = ''
    ) {
        this.siteName = siteName
        this.domain = domain.replace(/(http|https):\/\//, '')
        this.scheduleMap = new Map()
        this.createCommonHeader()
    }
    /**
     * 创建一个定时任务
     * @param name 任务名
     * @param func 任务体
     * @param frequency 频率
     * @param time 次数
     */
    createSchedule(
        name: string,
        func: Function,
        frequency?: string | number,
        time?: number,
    ) {
        // let schedule = new Schedule(name, func, time, frequency)
        let schedule = new Schedule(func, time, frequency)
        this.scheduleMap.set(name, schedule)
    }
    // 删除定时任务
    cancelSchedule(name: string) {
        let schedule = this.scheduleMap.get(name)
        schedule.cancelSchedule()
        this.scheduleMap.delete(name)
    }
    // 删除所有定时任务
    cancelAllSchedule() {
        this.scheduleMap.forEach((val) => {
            val.cancelSchedule()
        })
        this.scheduleMap.clear()
    }
    // 开始爬取html
    async beginToCrawlHtml(url: string | Array<string>, path: string, header?: object): Promise<Array<Cheerio> | Array<Array<Cheerio>>> {
        if (typeof url === 'string') {
            let html: superagent.Response = await this.getTarget(url, Methods.get, header)
            return this.analysisHTML(html.text, path)
        } else {
            let responses: Array<Promise<superagent.Response>> = []
            let res: Array<Array<Cheerio>> = []
            responses = url.map(u => this.getTarget(u, Methods.get, header))
            let htmls = await Promise.all(responses)
            res = htmls.map(html => this.analysisHTML(html.text, path))
            return res
        }
    }
    // 获取目标资源
    async getTarget(
        url: string,
        method: Methods = Methods.get,
        header: Object = this.commonHeader,
        body?: Object
    ): Promise<superagent.Response> {
        let res: Promise<superagent.Response>
        try {
            res = await superagent[method](url)
                .set(header)
                .send(body)
                // @ts-ignore
                .charset() // superagent-charset 辅助解析
                .buffer(true)
        } catch (error) {
            console.warn(error)
        }
        return res
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
    analysisHTML(html: string, path: string): Array<Cheerio> {
        let allPath: Array<string> = path.split('>').map(v => v.trim())
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
    }
}

module.exports = RookieCrawler