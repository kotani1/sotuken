import pymysql


class AnaCrawlPipeline:
    def open_spider(self, spider):
        self.connection = pymysql.connect(
            host="localhost",
            user="root", # DBにあわせて変更
            passwd="", # DBにあわせて変更
            database="ana",
            charset="utf8mb4"
        )
        self.cursor = self.connection.cursor()

    def process_item(self, item, spider):
        insert_qry = "INSERT INTO bodys (body,page_url) VALUES (%s, %s)"
        self.cursor.execute(insert_qry, (item["body"], item["page_url"]))
        print(self.cursor._executed)
        self.connection.commit()
        return item

    def close_spider(self, spider):
        self.connection.close()
