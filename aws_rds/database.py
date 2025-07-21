from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

USER = os.getenv('DB_USER')
PASSWORD = os.getenv('DB_PASSWORD')
URI = os.getenv('DB_URI')
PORT = os.getenv('DB_PORT')
DB = os.getenv('DB_NAME')

engine = create_engine(f"mysql+mysqldb://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}", echo=True)

Session = sessionmaker(bind=engine)
Base = declarative_base()