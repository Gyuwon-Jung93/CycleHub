import sys
import os
import requests
import json
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from aws_rds.models import Station, Availability, Base  # 기존 모델 임포트

USER = 'root'  # 당신의 MySQL 사용자
PASSWORD = 'gyuwon123'  # 비밀번호
URI = 'localhost'
PORT = 3306
DB = 'cyclehub'
engine = create_engine(f"mysql+mysqldb://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}", echo=True)

# 테이블 생성 (이미 있으면 스킵)
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)

# JCDecaux API 호출
contract_name = "dublin"
api_key = 'ada91b252842ac03f63f71ec55250632bc1c11ee'  # 당신의 키
base_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}"
response = requests.get(base_url)
if response.status_code != 200:
    print(f"API Error: {response.status_code}")
    exit()

stations = response.json()

# DB에 삽입
session = Session()
try:
    for station in stations:  # Use 'stations' from API response
        # Station 테이블 삽입/업데이트
        db_station = session.query(Station).filter_by(station_id=station['number']).first()
        if not db_station:
            db_station = Station(
                station_id=station['number'],
                name=station['name'],
                address=station['address'],
                position_lat=station['position']['lat'],
                position_lng=station['position']['lng'],
                banking=1 if station['banking'] else 0,
                bonus=1 if station['bonus'] else 0
            )
            session.add(db_station)
        
        # Availability 테이블 삽입 (최신 데이터)
        last_update = datetime.fromtimestamp(station['last_update'] / 1000) if station['last_update'] else datetime.now()
        availability = Availability(
            station_id=station['number'],
            last_update=last_update,
            available_bike_stands=station['available_bike_stands'],
            bike_stands=station['bike_stands'],
            available_bikes=station['available_bikes'],
            status=station['status']
        )
        session.merge(availability)
    
    session.commit()
    print(f"Successfully inserted {len(stations)} stations into DB!")
except Exception as e:
    session.rollback()
    print(f"DB Insert Error: {e}")
finally:
    session.close()