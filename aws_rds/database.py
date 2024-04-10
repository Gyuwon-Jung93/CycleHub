from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session,sessionmaker
from aws_rds.models import Base
import pymysql
pymysql.install_as_MySQLdb()
#Connection Details
URI = "cyclehub-db.cpywewmkcpo2.eu-north-1.rds.amazonaws.com"
PORT = "3306"
DB = "CycleHubDB"
USER = "carlo"
PASSWORD = "carlogyuwonchristian"

#Connect to the MySQL server and select the database
engine = create_engine(f"mysql+mysqldb://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}", echo=True)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)



