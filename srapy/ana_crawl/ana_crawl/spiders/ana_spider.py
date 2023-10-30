import scrapy
from bs4 import BeautifulSoup
from ana_crawl.items import AnaCrawlItem


class AnaSpiderSpider(scrapy.Spider):
    name = "ana_spider"

    handle_httpstatus_list = [302]

    # allowed_domains = ['mitoyo-city.note.jp']
    # start_urls =['https://mitoyo-city.note.jp/n/na3afe4cd6284']

    allowed_domains = []
    start_urls =[]

    # def __init__(self, domain,url):
    #     super(AnaSpiderSpider, self).__init__()
    #     self.allowed_domains = [domain]
    #     self.start_urls = [url]
    #     self.rank = int()

    def parse(self, response):
        item = AnaCrawlItem()

        body = response.xpath('body').getall()

        body=BeautifulSoup(body[0],"html.parser")

        for script in body(["script", "style","noscript","footer"]):
            script.decompose()

        body_text=body.get_text()
        lines=[]
        for line in body_text.splitlines():
            line = line.strip()
            lines.append(line.replace('\u3000', ''))
        text="".join(line for line in lines if line)

        item["body"] = text
        item["page_url"] = self.start_urls

        # yield item
        print(text)
