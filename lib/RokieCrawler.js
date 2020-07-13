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
        this.path = path;
    }
    setSchedule(frequency, callback, time) {
        let func = this.createScheduleCallback.call(this, callback);
        this.schedule = new Schedule_1.default(func, time, frequency);
    }
    createScheduleCallback(callback) {
        let paths = this.path;
        return () => __awaiter(this, void 0, void 0, function* () {
            let result;
            if (typeof this.siteUrl === 'string') {
                this.targetHtml = (yield this.crawlTarget(this.siteUrl)).text;
            }
            else {
                this.targetHtml = (yield Promise.all(this.crawlMutipartTarget(this.siteUrl))).map(res => res.text);
            }
            if (typeof paths === 'string') {
                result = this.analysisHTML(this.targetHtml, paths);
            }
            else {
                result = paths.map(path => this.analysisHTML(this.targetHtml, path));
            }
            return callback.call(this, result, paths);
        });
    }
    work() {
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
    crawlMutipartTarget(urls, method = Methods.get, header = {}, body) {
        return urls.map(url => {
            return this.crawlTarget(url, method, header, body);
        });
    }
    // 获取目标资源
    crawlTarget(url, method = Methods.get, header = {}, body) {
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
     * // 获取文件方法
     * @param uri 文件uri
     * @param stream node写入流
     * @param header 请求头
     */
    pipeTargetFile(uri, stream, header) {
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
            return html.reduce((resSum, curhtml) => {
                let $ = cheerio.load(curhtml);
                let target = allPath.reduce((sum, cur, index) => {
                    return index === 0 ? $(cur) : sum.find(cur);
                }, {});
                $(target).each((index, element) => {
                    let content = $(element);
                    resSum.push(content);
                });
                return resSum;
            }, []);
        }
    }
}
module.exports = RokieCrawler;
//# sourceMappingURL=RokieCrawler.js.map