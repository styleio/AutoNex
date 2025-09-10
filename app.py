from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import pyautogui
import json
import os
import time
import webbrowser
import subprocess
import cv2
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

pyautogui.FAILSAFE = False  # フェイルセーフを無効化（本番環境では慎重に使用）
pyautogui.PAUSE = 0.1  # 各操作間に0.1秒の待機時間を設定
SAVE_DIR = 'save'
PROGRAM_DIR = os.path.join(SAVE_DIR, 'program')
IMG_DIR = os.path.join(SAVE_DIR, 'img')
IMG_JSON = os.path.join(IMG_DIR, 'images.json')

# ディレクトリの作成
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)
if not os.path.exists(PROGRAM_DIR):
    os.makedirs(PROGRAM_DIR)
if not os.path.exists(IMG_DIR):
    os.makedirs(IMG_DIR)

# 画像管理JSONファイルの初期化
if not os.path.exists(IMG_JSON):
    with open(IMG_JSON, 'w', encoding='utf-8') as f:
        json.dump({'images': []}, f, ensure_ascii=False, indent=2)

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
        
        file_path = os.path.join(PROGRAM_DIR, f"{safe_name}.json")
        
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
        file_path = os.path.join(PROGRAM_DIR, f"{name}.json")
        
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
        
        if os.path.exists(PROGRAM_DIR):
            for filename in os.listdir(PROGRAM_DIR):
                if filename.endswith('.json'):
                    name = filename[:-5]  # .json を除去
                    programs.append(name)
        
        programs.sort()
        return jsonify({'status': 'success', 'programs': programs})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ブラウザ制御API
@app.route('/api/browser/open-url', methods=['POST'])
def browser_open_url():
    try:
        data = request.get_json()
        url = data.get('url')
        wait_for_load = data.get('waitForLoad', False)
        wait_time = data.get('waitTime', 3)  # デフォルト3秒
        
        if not url:
            return jsonify({'error': 'URLが指定されていません'}), 400
        
        # URLの妥当性チェック（基本的な形式チェック）
        if not (url.startswith('http://') or url.startswith('https://') or url.startswith('file://')):
            # プロトコルが指定されていない場合はhttpsを追加
            url = 'https://' + url
        
        webbrowser.open(url)
        
        # ページ読み込み待機が有効な場合
        if wait_for_load:
            time.sleep(float(wait_time))
        
        return jsonify({'status': 'success', 'message': f'URL「{url}」を開きました{"（" + str(wait_time) + "秒待機）" if wait_for_load else ""}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/browser/refresh', methods=['POST'])
def browser_refresh():
    try:
        # F5キーを押してページを更新
        pyautogui.press('f5')
        return jsonify({'status': 'success', 'message': 'ページを更新しました'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/browser/wait-for-element', methods=['POST'])
def wait_for_element():
    try:
        data = request.get_json()
        image_data = data.get('imageData')  # Base64エンコードされた画像データ
        timeout = data.get('timeout', 30)  # デフォルト30秒
        confidence = data.get('confidence', 0.8)  # デフォルト80%
        
        if not image_data:
            return jsonify({'error': '検索する要素の画像データが指定されていません'}), 400
        
        # Base64データをデコードして画像に変換
        import base64
        from io import BytesIO
        from PIL import Image
        
        # Base64のヘッダーを除去
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        template_image = Image.open(BytesIO(image_bytes))
        
        # PILからOpenCV形式に変換
        template_cv = cv2.cvtColor(np.array(template_image), cv2.COLOR_RGB2BGR)
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                # スクリーンショットを取得
                screenshot = pyautogui.screenshot()
                screenshot_cv = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
                
                # テンプレートマッチング
                result = cv2.matchTemplate(screenshot_cv, template_cv, cv2.TM_CCOEFF_NORMED)
                min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
                
                if max_val >= confidence:
                    # 要素が見つかった
                    h, w = template_cv.shape[:2]
                    center_x = max_loc[0] + w // 2
                    center_y = max_loc[1] + h // 2
                    
                    return jsonify({
                        'status': 'success', 
                        'message': f'要素が見つかりました（信頼度: {max_val:.2f}）',
                        'location': {'x': center_x, 'y': center_y},
                        'confidence': max_val
                    })
                
                time.sleep(0.5)  # 0.5秒間隔でチェック
                
            except Exception as e:
                # スクリーンショットエラーなどは無視して継続
                continue
        
        return jsonify({'error': f'{timeout}秒以内に要素が見つかりませんでした'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 画像管理API
@app.route('/api/images/upload', methods=['POST'])
def upload_image():
    try:
        data = request.get_json()
        name = data.get('name')
        image_data = data.get('imageData')
        
        if not name or not image_data:
            return jsonify({'error': '名前と画像データが必要です'}), 400
        
        # ファイル名の安全性チェック
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        if not safe_name:
            return jsonify({'error': '無効な名前です'}), 400
        
        # Base64データをデコード
        import base64
        import uuid
        from io import BytesIO
        from PIL import Image as PILImage
        
        # Base64のヘッダーを除去
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # 一意のファイル名を生成
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}.png"
        filepath = os.path.join(IMG_DIR, filename)
        
        # 画像を保存
        image_bytes = base64.b64decode(image_data)
        image = PILImage.open(BytesIO(image_bytes))
        image.save(filepath, 'PNG')
        
        # JSON管理ファイルを更新
        with open(IMG_JSON, 'r', encoding='utf-8') as f:
            images_data = json.load(f)
        
        # 同名の画像があるかチェック
        for img in images_data['images']:
            if img['name'] == safe_name:
                return jsonify({'error': f'名前「{safe_name}」は既に使用されています'}), 400
        
        # 新しい画像を追加
        new_image = {
            'id': unique_id,
            'name': safe_name,
            'filename': filename,
            'created': datetime.now().isoformat()
        }
        images_data['images'].append(new_image)
        
        with open(IMG_JSON, 'w', encoding='utf-8') as f:
            json.dump(images_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'success', 'message': f'画像「{safe_name}」を保存しました', 'id': unique_id})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/list', methods=['GET'])
def list_images():
    try:
        with open(IMG_JSON, 'r', encoding='utf-8') as f:
            images_data = json.load(f)
        
        return jsonify({'status': 'success', 'images': images_data['images']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/get/<name>', methods=['GET'])
def get_image_by_name(name):
    try:
        import base64
        
        print(f"[DEBUG] Getting image: {name}")
        print(f"[DEBUG] IMG_JSON path: {IMG_JSON}")
        print(f"[DEBUG] IMG_DIR path: {IMG_DIR}")
        
        with open(IMG_JSON, 'r', encoding='utf-8') as f:
            images_data = json.load(f)
        
        print(f"[DEBUG] Images data: {images_data}")
        
        # 名前で画像を検索
        for img in images_data['images']:
            if img['name'] == name:
                filepath = os.path.join(IMG_DIR, img['filename'])
                print(f"[DEBUG] Looking for file: {filepath}")
                print(f"[DEBUG] File exists: {os.path.exists(filepath)}")
                
                if os.path.exists(filepath):
                    # 画像をBase64エンコードして返す
                    with open(filepath, 'rb') as f:
                        file_content = f.read()
                        print(f"[DEBUG] File size: {len(file_content)} bytes")
                        image_data = base64.b64encode(file_content).decode('utf-8')
                        print(f"[DEBUG] Base64 length: {len(image_data)}")
                    
                    return jsonify({
                        'status': 'success',
                        'image': {
                            'id': img['id'],
                            'name': img['name'],
                            'data': f"data:image/png;base64,{image_data}",
                            'created': img['created']
                        }
                    })
        
        print(f"[DEBUG] Image not found: {name}")
        return jsonify({'error': f'画像「{name}」が見つかりません'}), 404
    except Exception as e:
        print(f"[DEBUG] Exception in get_image_by_name: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/delete/<name>', methods=['DELETE'])
def delete_image(name):
    try:
        with open(IMG_JSON, 'r', encoding='utf-8') as f:
            images_data = json.load(f)
        
        # 名前で画像を検索して削除
        for i, img in enumerate(images_data['images']):
            if img['name'] == name:
                # ファイルを削除
                filepath = os.path.join(IMG_DIR, img['filename'])
                if os.path.exists(filepath):
                    os.remove(filepath)
                
                # JSONから削除
                images_data['images'].pop(i)
                
                with open(IMG_JSON, 'w', encoding='utf-8') as f:
                    json.dump(images_data, f, ensure_ascii=False, indent=2)
                
                return jsonify({'status': 'success', 'message': f'画像「{name}」を削除しました'})
        
        return jsonify({'error': f'画像「{name}」が見つかりません'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)