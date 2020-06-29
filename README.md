# RookieCrawler

菜鸟爬虫，即使是不懂爬虫原理的，用完就懂了。

## 简介

有些时候，我们的爬虫需求可能只是抓取几个静态页面，可能只是爬取网站上的几张图片,可能只是获取几串json,使用 node 原生或一些大型 node 爬虫框架 可能在学习成本上得不偿失，所以，我想到整合一个**低学习成本**，**语法简洁**，**入门级**的基于 node 的爬虫框架。

## 为什么使用node

抛开性能、效率等对于绝大部分爬虫开发者不太能感知不到的因素，主要的原因就是因为我是一个**前端**，js 是我的第一语言，我不想付出 Python 的学习成本，所以使用 node 来开发。我相信大部分使用 node 来实现爬虫的开发者都是这个原因吧。

## 使用了哪些库

框架集成了 superagent + cheerio + nodeSchedule 

利用面向对象和模块化的思想将这三个库进行了整合，源码也是简单易懂，如果有这三个库的开发经验的同学相信一天就能读懂源码。

源码使用 typescript 编写

## 基础使用方法

```
let Crawler = require('../lib/Crawler')
const crawler = new Crawler('weibo', 'https://s.weibo.com')
let targetDomArray = crawler.beginToCrawlHtml('https://s.weibo.com/top/summary', '#pins > img')
targetDomArray.then(domArray => {
    domArray.forEach(val => {
        console.log(val.attr('data-original'))
    })
})
```