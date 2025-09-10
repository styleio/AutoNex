from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import pyautogui
import json
import os
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

pyautogui.FAILSAFE = False  # フェイルセーフを無効化（本番環境では慎重に使用）
pyautogui.PAUSE = 0.1  # 各操作間に0.1秒の待機時間を設定
SAVE_DIR = 'save'

# 保存ディレクトリの作成
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/click', methods=['POST'])
def click():
    try:
        data = request.get_json()
        x = data.get('x')
        y = data.get('y')
        
        if x is None or y is None:
            return jsonify({'error': '座標が指定されていません'}), 400
        
        # 座標の妥当性チェック
        screen_width, screen_height = pyautogui.size()
        x, y = int(x), int(y)
        
        if x < 0 or x >= screen_width or y < 0 or y >= screen_height:
            return jsonify({'error': f'座標が画面範囲外です。画面サイズ: {screen_width}x{screen_height}'}), 400
        
        # フェイルセーフが有効な場合のみ画面の角をチェック
        if pyautogui.FAILSAFE:
            corner_margin = 10
            if ((x < corner_margin and y < corner_margin) or 
                (x > screen_width - corner_margin and y < corner_margin) or 
                (x < corner_margin and y > screen_height - corner_margin) or 
                (x > screen_width - corner_margin and y > screen_height - corner_margin)):
                return jsonify({'error': f'画面の角から{corner_margin}px以内はフェイルセーフのため使用できません'}), 400
        
        pyautogui.click(x=x, y=y)
        return jsonify({'status': 'success', 'message': f'座標 ({x}, {y}) をクリックしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/move', methods=['POST'])
def move():
    try:
        data = request.get_json()
        x = data.get('x')
        y = data.get('y')
        
        if x is None or y is None:
            return jsonify({'error': '座標が指定されていません'}), 400
        
        # 座標の妥当性チェック
        screen_width, screen_height = pyautogui.size()
        x, y = int(x), int(y)
        
        if x < 0 or x >= screen_width or y < 0 or y >= screen_height:
            return jsonify({'error': f'座標が画面範囲外です。画面サイズ: {screen_width}x{screen_height}'}), 400
        
        # フェイルセーフが有効な場合のみ画面の角をチェック
        if pyautogui.FAILSAFE:
            corner_margin = 10
            if ((x < corner_margin and y < corner_margin) or 
                (x > screen_width - corner_margin and y < corner_margin) or 
                (x < corner_margin and y > screen_height - corner_margin) or 
                (x > screen_width - corner_margin and y > screen_height - corner_margin)):
                return jsonify({'error': f'画面の角から{corner_margin}px以内はフェイルセーフのため使用できません'}), 400
        
        pyautogui.moveTo(x, y)
        return jsonify({'status': 'success', 'message': f'座標 ({x}, {y}) に移動しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scroll', methods=['POST'])
def scroll():
    try:
        data = request.get_json()
        amount = data.get('amount', 3)
        direction = data.get('direction', 'down')
        
        scroll_amount = int(amount) if direction == 'down' else -int(amount)
        pyautogui.scroll(scroll_amount)
        
        return jsonify({'status': 'success', 'message': f'{direction}方向に{amount}スクロールしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/keypress', methods=['POST'])
def keypress():
    try:
        data = request.get_json()
        key = data.get('key')
        
        if not key:
            return jsonify({'error': 'キーが指定されていません'}), 400
        
        pyautogui.press(key)
        return jsonify({'status': 'success', 'message': f'キー「{key}」を押しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/type', methods=['POST'])
def type_text():
    try:
        data = request.get_json()
        text = data.get('text')
        
        if not text:
            return jsonify({'error': 'テキストが指定されていません'}), 400
        
        pyautogui.typewrite(text)
        return jsonify({'status': 'success', 'message': f'テキスト「{text}」を入力しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/position', methods=['GET'])
def get_position():
    try:
        x, y = pyautogui.position()
        return jsonify({'x': x, 'y': y})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 新しいマウス操作API
@app.route('/api/mouse/move-absolute', methods=['POST'])
def mouse_move_absolute():
    try:
        data = request.get_json()
        x = data.get('x')
        y = data.get('y')
        
        if x is None or y is None:
            return jsonify({'error': '座標が指定されていません'}), 400
        
        # 座標の妥当性チェック
        screen_width, screen_height = pyautogui.size()
        x, y = int(x), int(y)
        
        if x < 0 or x >= screen_width or y < 0 or y >= screen_height:
            return jsonify({'error': f'座標が画面範囲外です。画面サイズ: {screen_width}x{screen_height}'}), 400
        
        # フェイルセーフが有効な場合のみ画面の角をチェック
        if pyautogui.FAILSAFE:
            corner_margin = 10
            if ((x < corner_margin and y < corner_margin) or 
                (x > screen_width - corner_margin and y < corner_margin) or 
                (x < corner_margin and y > screen_height - corner_margin) or 
                (x > screen_width - corner_margin and y > screen_height - corner_margin)):
                return jsonify({'error': f'画面の角から{corner_margin}px以内はフェイルセーフのため使用できません'}), 400
        
        pyautogui.moveTo(x, y)
        return jsonify({'status': 'success', 'message': f'絶対座標 ({x}, {y}) に移動しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mouse/move-relative', methods=['POST'])
def mouse_move_relative():
    try:
        data = request.get_json()
        x = data.get('x', 0)
        y = data.get('y', 0)
        
        x, y = int(x), int(y)
        pyautogui.move(x, y)
        return jsonify({'status': 'success', 'message': f'相対座標 ({x}, {y}) だけ移動しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mouse/single-click', methods=['POST'])
def mouse_single_click():
    try:
        data = request.get_json()
        button = data.get('button', 'left')
        
        pyautogui.click(button=button)
        return jsonify({'status': 'success', 'message': f'{button}ボタンでシングルクリックしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mouse/double-click', methods=['POST'])
def mouse_double_click():
    try:
        data = request.get_json()
        button = data.get('button', 'left')
        
        pyautogui.doubleClick(button=button)
        return jsonify({'status': 'success', 'message': f'{button}ボタンでダブルクリックしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mouse/triple-click', methods=['POST'])
def mouse_triple_click():
    try:
        data = request.get_json()
        button = data.get('button', 'left')
        
        pyautogui.tripleClick(button=button)
        return jsonify({'status': 'success', 'message': f'{button}ボタンでトリプルクリックしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mouse/long-press', methods=['POST'])
def mouse_long_press():
    try:
        data = request.get_json()
        button = data.get('button', 'left')
        duration = float(data.get('duration', 1))
        
        pyautogui.mouseDown(button=button)
        time.sleep(duration)
        pyautogui.mouseUp(button=button)
        return jsonify({'status': 'success', 'message': f'{button}ボタンを{duration}秒長押ししました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mouse/release', methods=['POST'])
def mouse_release():
    try:
        data = request.get_json()
        button = data.get('button', 'left')
        
        pyautogui.mouseUp(button=button)
        return jsonify({'status': 'success', 'message': f'{button}ボタンをリリースしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mouse/middle-click', methods=['POST'])
def mouse_middle_click():
    try:
        pyautogui.click(button='middle')
        return jsonify({'status': 'success', 'message': '中クリックしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/set-failsafe', methods=['POST'])
def set_failsafe():
    try:
        data = request.get_json()
        failsafe = data.get('failsafe', True)
        
        pyautogui.FAILSAFE = failsafe
        return jsonify({'status': 'success', 'message': f'フェイルセーフを{"有効" if failsafe else "無効"}にしました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save', methods=['POST'])
def save_program():
    try:
        data = request.get_json()
        name = data.get('name')
        program_data = data.get('data')
        failsafe_enabled = data.get('failsafeEnabled', True)
        
        if not name or not program_data:
            return jsonify({'error': 'プログラム名またはデータが指定されていません'}), 400
        
        # ファイル名の安全性チェック
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not safe_name:
            return jsonify({'error': '無効なプログラム名です'}), 400
        
        file_path = os.path.join(SAVE_DIR, f"{safe_name}.json")
        
        save_data = {
            'name': name,
            'data': program_data,
            'failsafeEnabled': failsafe_enabled,
            'created': datetime.now().isoformat(),
            'modified': datetime.now().isoformat()
        }
        
        # 既存ファイルの場合は作成日時を保持
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
                save_data['created'] = old_data.get('created', save_data['created'])
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'success', 'message': 'プログラムを保存しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/load/<name>', methods=['GET'])
def load_program(name):
    try:
        file_path = os.path.join(SAVE_DIR, f"{name}.json")
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'プログラムが見つかりません'}), 404
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return jsonify({
            'status': 'success',
            'name': data.get('name'),
            'data': data.get('data'),
            'failsafeEnabled': data.get('failsafeEnabled', True)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/programs', methods=['GET'])
def list_programs():
    try:
        programs = []
        
        if os.path.exists(SAVE_DIR):
            for filename in os.listdir(SAVE_DIR):
                if filename.endswith('.json'):
                    name = filename[:-5]  # .json を除去
                    programs.append(name)
        
        programs.sort()
        return jsonify({'status': 'success', 'programs': programs})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)