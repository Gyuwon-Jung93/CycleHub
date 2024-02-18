import requests
import traceback
import datetime
import time


CONTRACT_NAME = "dublin"
API_KEY = '99d3e65801ab0bdae585264b25d443c5545365b5'
BASE_URL = f"https://api.jcdecaux.com/vls/v1/stations?contract={CONTRACT_NAME}&apiKey={API_KEY}"

def write_to_file(tesxt):
    with open("data/bikes_{}".format(now).replace(" ", "_"), "w") as f:
        f.write(r.text)

def write_to_db(text):


def main():
    while True:
        try:
            now = datetime.datetime.now()
            r = requests.get(BASE_URL)
            print(r, now)
            write_to_file(r.text)
            write_to_db(r.text)
            time.sleep(5*60)
        except:
            print(traceback.format_exc())
            if engine is None:

    return
    