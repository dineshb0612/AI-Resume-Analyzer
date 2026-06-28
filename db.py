import mysql.connector

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="ai_resume_analyzer"
)

cursor = db.cursor()

print("Database Connected Successfully")