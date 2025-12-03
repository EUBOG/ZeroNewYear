import sqlite3
import json
from datetime import datetime
import random


class Database:
    def __init__(self, db_path='wishes.db'):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Таблица предсказаний (хлопушки)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                color TEXT DEFAULT 'gold'
            )
        ''')

        # Таблица пожеланий (шарики)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS wishes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                color TEXT DEFAULT 'red',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_visible BOOLEAN DEFAULT 1
            )
        ''')

        # Заполняем предсказания если таблица пуста
        cursor.execute("SELECT COUNT(*) FROM predictions")
        if cursor.fetchone()[0] == 0:
            self.seed_predictions()

        conn.commit()
        conn.close()

    def seed_predictions(self):
        predictions = [
            ("Новый год принесёт неожиданную радость!", "red"),
            ("Вас ждёт встреча со старым другом", "blue"),
            ("Исполнится самое заветное желание", "gold"),
            ("Год будет полон путешествий", "green"),
            ("Вы найдёте то, что давно искали", "silver"),
            ("Ждите приятных финансовых новостей", "gold"),
            ("Вас ждёт творческий подъём", "purple"),
            ("Здоровье и энергия будут на максимуме", "blue"),
            ("Вы научитесь чему-то совершенно новому", "green"),
            ("Любовь и гармония войдут в ваш дом", "red")
        ]

        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.executemany(
            "INSERT INTO predictions (text, color) VALUES (?, ?)",
            predictions
        )
        conn.commit()
        conn.close()

    def get_random_prediction(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions ORDER BY RANDOM() LIMIT 1")
        prediction = cursor.fetchone()
        conn.close()

        if prediction:
            return {
                "id": prediction[0],
                "text": prediction[1],
                "color": prediction[2]
            }
        return None

    def add_wish(self, wish_text):
        colors = ['red', 'blue', 'gold', 'silver', 'green', 'purple']
        color = random.choice(colors)

        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO wishes (text, color) VALUES (?, ?)",
            (wish_text, color)
        )
        wish_id = cursor.lastrowid

        # Получаем созданное пожелание
        cursor.execute("SELECT * FROM wishes WHERE id = ?", (wish_id,))
        wish = cursor.fetchone()

        conn.commit()
        conn.close()

        return {
            "id": wish[0],
            "text": wish[1],
            "color": wish[2],
            "created_at": wish[3]
        }

    def get_recent_wishes(self, limit=20):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, text, color, created_at 
            FROM wishes 
            WHERE is_visible = 1 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,))

        wishes = []
        for row in cursor.fetchall():
            wishes.append({
                "id": row[0],
                "text": row[1],
                "color": row[2],
                "created_at": row[3]
            })

        conn.close()
        return wishes

    def get_wish_count(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM wishes WHERE is_visible = 1")
        count = cursor.fetchone()[0]
        conn.close()
        return count


# Синглтон для доступа к БД
db = Database()