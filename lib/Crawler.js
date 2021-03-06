"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const superagent = require("superagent");
const cheerio = require("cheerio");
const Schedule_1 = require("./Schedule");
require('superagent-charset')(superagent);
require('superagent-proxy')(superagent);
var Methods;
(function (Methods) {
    Methods["post"] = "post";
    Methods["get"] = "get";
    Methods["head"] = "head";
})(Methods || (Methods = {}));
class RookieCrawler {
    constructor(siteName = '', domain = '') {
        this.siteName = siteName;
        this.domain = domain.replace(/(http|https):\/\//, '');
        this.scheduleMap = new Map();
        this.createCommonHeader();
    }
    /**
     * 创建一个定时任务
     * @param name 任务名
     * @param func 任务体
     * @param frequency 频率
     * @param time 次数
     */
    createSchedule(name, func, frequency, time) {
        // let schedule = new Schedule(name, func, time, frequency)
        let schedule = new Schedule_1.default(func, time, frequency);
        this.scheduleMap.set(name, schedule);
    }
    // 删除定时任务
    cancelSchedule(name) {
        let schedule = this.scheduleMap.get(name);
        schedule.cancelSchedule();
        this.scheduleMap.delete(name);
    }
    // 删除所有定时任务
    cancelAllSchedule() {
        this.scheduleMap.forEach((val) => {
            val.cancelSchedule();
        });
        this.scheduleMap.clear();
    }
    // 开始爬取html
    beginToCrawlHtml(url, path, header) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof url === 'string') {
                let html = yield this.getTarget(url, Methods.get, header);
                return this.analysisHTML(html.text, path);
            }
            else {
                let responses = [];
                let res = [];
                responses = url.map(u => this.getTarget(u, Methods.get, header));
                let htmls = yield Promise.all(responses);
                res = htmls.map(html => this.analysisHTML(html.text, path));
                return res;
            }
        });
    }
    // 获取目标资源
    getTarget(url, method = Methods.get, header = this.commonHeader, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let res;
            try {
                res = yield superagent[method](url)
                    .set(header)
                    .send(body)
                    // @ts-ignore
                    .charset() // superagent-charset 辅助解析
                    .buffer(true);
            }
            catch (error) {
                console.warn(error);
            }
            return res;
        });
    }
    /**
     * // 爬取文件方法
     * @param uri 文件uri
     * @param stream node写入流
     * @param header 请求头
     */
    pipeTargetFile(uri, stream, header = this.commonHeader) {
        let resStream;
        try {
            resStream = superagent
                .get(uri)
                .set(header)
                .pipe(stream);
        }
        catch (error) {
            console.warn(error);
        }
        return resStream;
    }
    // 新建头部信息，初步反反爬虫
    createCommonHeader(custom) {
        if (custom) {
            this.commonHeader = custom;
            return;
        }
        let domain = this.domain;
        let commonHeader = {
            'Accept': '*/*',
            'Connection': 'close',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36',
            'referer': domain || 'www.baidu.com',
        };
        domain && (commonHeader['host'] = domain);
        this.commonHeader = commonHeader;
    }
    /**
     * html解析方法，使用cheerio辅助解析
     * @param html html文本
     * @param path 目标路径，中间以 > 隔开，依次调用find方法
     */
    analysisHTML(html, path) {
        let allPath = path.split('>').map(v => v.trim());
        let $ = cheerio.load(html);
        let result = [];
        let target = allPath.reduce((sum, cur, index) => {
            return index === 0 ? $(cur) : sum.find(cur);
        }, {});
        $(target).each((index, element) => {
            let content = $(element);
            result.push(content);
        });
        result.length === 0 && console.warn('No data found in this path!');
        return result;
    }
}
module.exports = RookieCrawler;
//# sourceMappingURL=Crawler.js.map