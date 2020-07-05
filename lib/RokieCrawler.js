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
class RokieCrawler {
    constructor(siteName, siteUrl, path) {
        this.siteName = siteName;
        this.siteUrl = siteUrl;
        // this.domain = siteUrl[0].replace(/(http|https):\/\//, '') || <string>siteUrl.replace(/(http|https):\/\//, '')
        this.path = path;
        this.createCommonHeader();
    }
    setSchedule(frequency, callback, time) {
        let func = this.createScheduleCallback.call(this, callback);
        this.schedule = new Schedule_1.default(func, time, frequency);
    }
    createScheduleCallback(callback) {
        let _this = this;
        let paths = _this.path;
        return function () {
            return __awaiter(this, void 0, void 0, function* () {
                let result;
                if (typeof _this.siteUrl === 'string') {
                    _this.targetHtml = (yield _this.crawlTarget(_this.siteUrl)).text;
                }
                else {
                    _this.targetHtml = (yield Promise.all(_this.crawlMutipartTarget(_this.siteUrl))).map(res => res.text);
                }
                if (typeof paths === 'string') {
                    result = _this.analysisHTML(_this.targetHtml, paths);
                }
                else {
                    result = paths.map(path => _this.analysisHTML(_this.targetHtml, path));
                }
                return callback.call(_this, result, paths);
            });
        };
    }
    beginToCrawl() {
        this.schedule.work();
    }
    // 开始爬取html
    beginToCrawlHtml(url, path, header) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof url === 'string') {
                let html = yield this.crawlTarget(url, Methods.get, header);
                return this.analysisHTML(html.text, path);
            }
            else {
                let responses = [];
                let res = [];
                responses = url.map(u => this.crawlTarget(u, Methods.get, header));
                let htmls = yield Promise.all(responses);
                res = htmls.map(html => this.analysisHTML(html.text, path));
                return res;
            }
        });
    }
    crawlMutipartTarget(urls, method = Methods.get, header = this.commonHeader, body) {
        return urls.map(url => {
            return superagent[method](url)
                .set(header)
                .send(body)
                // @ts-ignore
                .charset() // superagent-charset 辅助解析
                .buffer(true);
        });
    }
    // 获取目标资源
    crawlTarget(url, method = Methods.get, header = this.commonHeader, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield superagent[method](url)
                .set(header)
                .send(body)
                // @ts-ignore
                .charset() // superagent-charset 辅助解析
                .buffer(true);
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
        if (typeof html === 'string') {
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
        else {
            return html.reduce((sum, cur) => {
                let $ = cheerio.load(cur);
                let target = allPath.reduce((sum, cur, index) => {
                    return index === 0 ? $(cur) : sum.find(cur);
                }, {});
                $(target).each((index, element) => {
                    let content = $(element);
                    sum.push(content);
                });
                return sum;
            }, []);
        }
    }
}
module.exports = RokieCrawler;
//# sourceMappingURL=RokieCrawler.js.map