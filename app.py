from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from database import db
import os

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всех доменов


# Главная страница
@app.route('/')
def index():
    return render_template('index.html')


# API: Получить случайное предсказание
@app.route('/api/prediction/random', methods=['GET'])
def get_random_prediction():
    prediction = db.get_random_prediction()
    if prediction:
        return jsonify({
            "success": True,
            "prediction": prediction
        })
    return jsonify({"success": False, "error": "No predictions found"}), 404


# API: Добавить пожелание
@app.route('/api/wish/add', methods=['POST'])
def add_wish():
    try:
        data = request.get_json()
        wish_text = data.get('text', '').strip()

        if not wish_text:
            return jsonify({
                "success": False,
                "error": "Текст пожелания не может быть пустым"
            }), 400

        if len(wish_text) > 200:
            return jsonify({
                "success": False,
                "error": "Пожелание слишком длинное (макс. 200 символов)"
            }), 400

        wish = db.add_wish(wish_text)

        return jsonify({
            "success": True,
            "wish": wish,
            "message": "Шарик добавлен на ёлку!"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# API: Получить последние пожелания
@app.route('/api/wishes/recent', methods=['GET'])
def get_recent_wishes():
    limit = request.args.get('limit', 20, type=int)
    wishes = db.get_recent_wishes(limit)

    return jsonify({
        "success": True,
        "wishes": wishes,
        "count": len(wishes)
    })


# API: Получить статистику
@app.route('/api/stats', methods=['GET'])
def get_stats():
    count = db.get_wish_count()
    return jsonify({
        "success": True,
        "total_wishes": count
    })


# Для обслуживания статических файлов
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


if __name__ == '__main__':
    # Для запуска в Зерокодере
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)