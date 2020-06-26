import * as superagent from 'superagent'
import * as cheerio from 'cheerio'
import Schedule from './Schedule';
require('superagent-charset')(superagent)
require('superagent-proxy')(superagent)

enum Methods {
    post = "post",
    get = "get",
    head = "head",
}

class Crawler {
    siteName: string
    domain: string
    scheduleMap: Map<string, Schedule> // 存储nodeschedule对象或interval的id
    commonHeader: Object

    constructor(
        siteName: string,
        domain: string
    ) {
        this.siteName = siteName
        this.scheduleMap = new Map()
        this.domain = domain
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
        let schedule = new Schedule(name, func, time, frequency)
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
    async beginToCrawlHtml(url: string, path: string, header?: object): Promise<Array<Cheerio>> {
        let html = await this.getTarget(url, Methods.get, header)
        return this.analysisHTML(html.text, path)
    }
    async beginToCrawlApi(
        url: string,
        method: Methods,
        header: object = this.commonHeader,
        body?: object,
    ): Promise<superagent.Response> {
        return await this.getTarget(url, method, header, body)
    }
    // 获取目标url
    async getTarget(
        url: string,
        method: Methods,
        header: Object = this.commonHeader,
        body?: Object
    ): Promise<superagent.Response> {
        return new Promise((resolve, reject) => {
            superagent[method](url)
                .set(header)
                .send(body)
                // @ts-ignore
                .charset() // superagent-charset 辅助解析
                .buffer(true)
                .end((err: superagent.ResponseError, res: superagent.Response) => {
                    if (!err) {
                        resolve(res)
                    } else {
                        reject(err)
                    }
                })
        })
    }
    // 爬取文件方法
    pipeTargetFile(uri: string, stream: NodeJS.WritableStream, header?: Object): NodeJS.WritableStream {
        header = header || this.commonHeader
        let resStream = superagent
            .get(uri)
            .set(header)
            .pipe(stream)
        return resStream
    }
    // 新建头部信息，初步反反爬虫
    createCommonHeader(custom?: Object) {
        if (custom) {
            this.commonHeader = custom
            return
        }
        this.commonHeader = {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'close',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36',
            'referer': this.domain,
            'host': this.domain
        }
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
        return result
    }
}

module.exports = Crawler