import requests
url = 'https://www.google.com/search?q=%E9%A6%99%E5%B7%9D%E7%9C%8C+%E6%B0%B4%E4%B8%8D%E8%B6%B3'
response = requests.get(url)
print(response.text)
