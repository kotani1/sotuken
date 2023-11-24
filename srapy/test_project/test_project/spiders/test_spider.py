import scrapy
from urllib.parse import urlparse
from bs4 import BeautifulSoup



class TestSpiderSpider(scrapy.Spider):
    name = "test_spider"
    url = "https://www.pref.kagawa.lg.jp/mizusigen/mizushigen/faq/f73sdo151214152351.html"
    allowed_domains = [urlparse(url).netloc]
    start_urls = [url]

    def parse(self, response):
        body = response.xpath('body').getall()
        body=BeautifulSoup(body[0],"html.parser")
        for script in body(["script", "style","noscript","footer"]):
            script.decompose()


        lines = []
        body_text=body.get_text()
        for line in body_text.splitlines():
            line = line.strip()
            lines.append(line.replace('\u3000', ''))
        lines = list(filter(None, lines))
        print(lines)
        # lines=[]
        # for line in body_text.splitlines():
        #     line = line.strip()
        #     lines.append(line.replace('\u3000', ''))
        # text="".join(line for line in lines if line)
