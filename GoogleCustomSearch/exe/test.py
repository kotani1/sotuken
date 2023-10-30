# json読み込みテスト
import json
from urllib.parse import urlparse
json_open = open('data/response/response.json', 'r')
json_load = json.load(json_open)




for v in json_load["response"]:
  for i in range(0,len(v["items"])):
    url = v["items"][i]["link"]
    print("url："+ url)
    domain = urlparse(url).netloc
    print("ドメイン："+ domain)
  # print(len(v["items"]))

# with open('data/response/response.json') as f:
#     di = json.load(f)

# for k, v in di.items():  # キー／値の組を列挙
#     print(f'{k}:{v}')
