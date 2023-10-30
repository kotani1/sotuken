from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from urllib.parse import urlparse
import json


process = CrawlerProcess(get_project_settings())

# url取得
json_open = open('./response.json', 'r')
json_load = json.load(json_open)


# クローラ実行
for v in json_load["response"]:
  for i in range(0,len(v["items"])):
    url = v["items"][i]["link"]
    domain = urlparse(url).netloc
    process.crawl('ana_spider', domain=domain,url = url)

process.start()
