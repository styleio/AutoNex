// アプリケーションのメインスクリプト
let executionLog;
let isRunning = false;
let stopRequested = false;

// 初期化
window.addEventListener('load', function() {
    console.log('Initializing application...');
    
    // Blocklyワークスペースを初期化（blockly-init.jsの関数を使用）
    workspace = initializeBlockly();
    
    // コントロールを初期化
    initControls();
    
    // マウス位置の更新を開始
    updateMousePosition();
    
    // 保存済みプログラムを読み込み
    loadSavedPrograms();
    
    // 画像ライブラリを読み込み
    refreshImageLibrary();
    
    // 定期的に画像ドロップダウンを更新（30秒ごと）
    setInterval(() => {
        forceUpdateImageDropdowns();
    }, 30000);
});

// コントロールの初期化
function initControls() {
    executionLog = document.getElementById('execution-log');
    
    document.getElementById('run-btn').addEventListener('click', runProgram);
    document.getElementById('stop-btn').addEventListener('click', stopProgram);
    document.getElementById('save-btn').addEventListener('click', saveProgram);
    document.getElementById('load-btn').addEventListener('click', loadProgram);
    document.getElementById('clear-btn').addEventListener('click', clearWorkspace);
    
    document.getElementById('saved-programs').addEventListener('change', function() {
        if (this.value) {
            document.getElementById('program-name').value = this.value;
        }
    });
    
    // 画像ライブラリコントロールを初期化
    initImageLibrary();
}

// プログラム実行
async function runProgram() {
    if (isRunning) return;
    
    isRunning = true;
    stopRequested = false;
    document.getElementById('run-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
    
    clearLog();
    addLog('プログラム実行開始', 'info');
    
    // フェイルセーフ設定をサーバーに送信
    const failsafeEnabled = document.getElementById('failsafe-enabled').checked;
    await setFailsafeMode(failsafeEnabled);
    
    try {
        const code = javascript.javascriptGenerator.workspaceToCode(workspace);
        console.log('Generated code:', code);
        
        const wrappedCode = `
            (async () => {
                ${code}
            })();
        `;
        
        await eval(wrappedCode);
        addLog('プログラム実行完了', 'success');
    } catch (error) {
        addLog(`エラー: ${error.message}`, 'error');
        console.error('Execution error:', error);
    } finally {
        isRunning = false;
        document.getElementById('run-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
    }
}

// プログラム停止
function stopProgram() {
    stopRequested = true;
    addLog('プログラム停止要求', 'info');
}

// プログラム保存
async function saveProgram() {
    const programName = document.getElementById('program-name').value.trim();
    
    if (!programName) {
        showMessage('プログラム名を入力してください', 'error');
        return;
    }
    
    // 新しいBlocklyバージョンに対応した保存
    let serializedData;
    if (typeof Blockly.serialization !== 'undefined') {
        // 新しいシリアライゼーション方式
        serializedData = JSON.stringify(Blockly.serialization.workspaces.save(workspace));
    } else {
        // 古いXML方式
        const xml = Blockly.Xml.workspaceToDom(workspace);
        serializedData = Blockly.Xml.domToText(xml);
    }
    
    const failsafeEnabled = document.getElementById('failsafe-enabled').checked;
    
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: programName,
                data: serializedData,
                failsafeEnabled: failsafeEnabled
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('保存しました', 'success');
            loadSavedPrograms();
        } else {
            showMessage(data.error || '保存に失敗しました', 'error');
        }
    } catch (error) {
        showMessage('通信エラーが発生しました', 'error');
    }
}

// プログラム読み込み
async function loadProgram() {
    const programName = document.getElementById('saved-programs').value;
    
    if (!programName) {
        showMessage('プログラムを選択してください', 'error');
        return;
    }
    
    try {
        console.log('Loading program:', programName);
        const response = await fetch(`/api/load/${encodeURIComponent(programName)}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            showMessage(`読み込みエラー: ${response.status}`, 'error');
            return;
        }
        
        const data = await response.json();
        console.log('Loaded data:', data);
        
        workspace.clear();
        
        // 新しいBlocklyバージョンに対応
        if (typeof Blockly.serialization !== 'undefined') {
            // 新しいシリアライゼーション方式
            try {
                const serializedData = JSON.parse(data.data);
                Blockly.serialization.workspaces.load(serializedData, workspace);
            } catch (e) {
                // JSON解析に失敗した場合は古いXML形式として処理
                const xml = Blockly.utils.xml.textToDom(data.data);
                Blockly.Xml.domToWorkspace(xml, workspace);
            }
        } else {
            // 古いXML方式（Blockly.Xml.textToDomが使用可能な場合）
            const xml = Blockly.utils.xml.textToDom(data.data);
            Blockly.Xml.domToWorkspace(xml, workspace);
        }
        
        // フェイルセーフ設定を復元
        const failsafeCheckbox = document.getElementById('failsafe-enabled');
        failsafeCheckbox.checked = data.failsafeEnabled !== false; // デフォルトはtrue
        
        // ドロップダウンを更新（少し遅延を入れて確実に更新）
        setTimeout(() => {
            forceUpdateImageDropdowns();
        }, 100);
        
        showMessage('読み込みました', 'success');
    } catch (error) {
        console.error('Load program error:', error);
        showMessage(`通信エラー: ${error.message}`, 'error');
    }
}

// 保存済みプログラムリストの更新
async function loadSavedPrograms() {
    try {
        console.log('Loading saved programs list...');
        const response = await fetch('/api/programs');
        console.log('Programs response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Programs response error:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('Programs data:', data);
        
        const select = document.getElementById('saved-programs');
        select.innerHTML = '<option value="">-- 保存済みプログラムを選択 --</option>';
        
        if (data.programs && data.programs.length > 0) {
            data.programs.forEach(program => {
                const option = document.createElement('option');
                option.value = program;
                option.textContent = program;
                select.appendChild(option);
            });
            console.log(`Loaded ${data.programs.length} programs`);
        } else {
            console.log('No programs found');
        }
    } catch (error) {
        console.error('プログラムリスト取得エラー:', error);
    }
}

// ワークスペースクリア
function clearWorkspace() {
    if (confirm('ワークスペースをクリアしますか？')) {
        workspace.clear();
        showMessage('ワークスペースをクリアしました', 'success');
    }
}

// 実行関数（グローバルスコープに配置）
async function mouseClick(x, y) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`クリック: (${x}, ${y})`, 'info');
    
    const response = await fetch('/api/click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ x, y })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'クリックエラー');
    }
}

// 新しいマウス操作関数群
async function mouseMoveAbsolute(x, y) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`マウス絶対座標移動: (${x}, ${y})`, 'info');
    
    const response = await fetch('/api/mouse/move-absolute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ x, y })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || '絶対座標移動エラー');
    }
}

async function mouseMoveRelative(x, y) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`マウス相対座標移動: (${x}, ${y})`, 'info');
    
    const response = await fetch('/api/mouse/move-relative', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ x, y })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || '相対座標移動エラー');
    }
}

async function mouseScroll(amount, direction) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`スクロール: ${direction} ${amount}`, 'info');
    
    const response = await fetch('/api/scroll', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, direction })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'スクロールエラー');
    }
}

async function mouseMove(x, y) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`マウス移動: (${x}, ${y})`, 'info');
    
    const response = await fetch('/api/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ x, y })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'マウス移動エラー');
    }
}

async function mouseMoveToImage(imageName, position) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    if (!imageName) {
        throw new Error('画像名が指定されていません');
    }
    
    addLog(`画像「${imageName}」の${position === 'center' ? '中央' : '起点'}へマウス移動`, 'info');
    
    // 画像を検索
    const findResponse = await fetch('/api/images/find', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageName })
    });
    
    const findData = await findResponse.json();
    if (!findResponse.ok) {
        throw new Error(findData.error || '画像検索エラー');
    }
    
    // 座標を計算
    let targetX, targetY;
    if (position === 'center') {
        targetX = findData.location.center_x;
        targetY = findData.location.center_y;
    } else {
        targetX = findData.location.x;
        targetY = findData.location.y;
    }
    
    // マウスを移動
    await mouseMove(targetX, targetY);
    addLog(`画像が見つかりました: (${targetX}, ${targetY})`, 'success');
}

async function keyPress(key) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`キー押下: ${key}`, 'info');
    
    const response = await fetch('/api/keypress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'キー押下エラー');
    }
}

async function typeText(text) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`テキスト入力: ${text}`, 'info');
    
    const response = await fetch('/api/type', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'テキスト入力エラー');
    }
}

async function wait(seconds) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`待機: ${seconds}秒`, 'info');
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function mouseSingleClick(button) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`${button}ボタンシングルクリック`, 'info');
    
    const response = await fetch('/api/mouse/single-click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ button })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'シングルクリックエラー');
    }
}

async function mouseDoubleClick(button) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`${button}ボタンダブルクリック`, 'info');
    
    const response = await fetch('/api/mouse/double-click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ button })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'ダブルクリックエラー');
    }
}

async function mouseTripleClick(button) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`${button}ボタントリプルクリック`, 'info');
    
    const response = await fetch('/api/mouse/triple-click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ button })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'トリプルクリックエラー');
    }
}

async function mouseLongPress(button, duration) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`${button}ボタン長押し: ${duration}秒`, 'info');
    
    const response = await fetch('/api/mouse/long-press', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ button, duration })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || '長押しエラー');
    }
}

async function mouseRelease(button) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`${button}ボタンリリース`, 'info');
    
    const response = await fetch('/api/mouse/release', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ button })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'リリースエラー');
    }
}

async function mouseMiddleClick() {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`中クリック`, 'info');
    
    const response = await fetch('/api/mouse/middle-click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || '中クリックエラー');
    }
}

// フェイルセーフ設定をサーバーに送信
async function setFailsafeMode(enabled) {
    try {
        const response = await fetch('/api/set-failsafe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ failsafe: enabled })
        });
        
        const data = await response.json();
        if (!response.ok) {
            console.error('フェイルセーフ設定エラー:', data.error);
        }
    } catch (error) {
        console.error('フェイルセーフ設定通信エラー:', error);
    }
}

// ブラウザ制御関数
async function openUrl(url, waitForLoad = false, waitTime = 3) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    const logMessage = waitForLoad ? 
        `URL開く: ${url} (${waitTime}秒待機)` : 
        `URL開く: ${url}`;
    addLog(logMessage, 'info');
    
    const response = await fetch('/api/browser/open-url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            url, 
            waitForLoad, 
            waitTime 
        })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'URL開くエラー');
    }
}

async function refreshBrowser() {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog('ブラウザ更新', 'info');
    
    const response = await fetch('/api/browser/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'ブラウザ更新エラー');
    }
}

async function waitForElement(imageData, timeout = 30, confidence = 80) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog(`要素出現待機: タイムアウト${timeout}秒、信頼度${confidence}%`, 'info');
    
    const response = await fetch('/api/browser/wait-for-element', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            imageData,
            timeout: parseInt(timeout),
            confidence: parseFloat(confidence) / 100  // パーセントから小数に変換
        })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || '要素出現待機エラー');
    }
    
    addLog(`要素が見つかりました: (${data.location.x}, ${data.location.y})`, 'success');
    return data.location;
}

async function waitForElementByName(imageName, timeout = 30, confidence = 80) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    if (!imageName) {
        throw new Error('画像名が指定されていません');
    }
    
    // 画像データを名前で取得
    const imageResponse = await fetch(`/api/images/get/${encodeURIComponent(imageName)}`);
    if (!imageResponse.ok) {
        throw new Error(`画像「${imageName}」が見つかりません`);
    }
    
    const imageData = await imageResponse.json();
    return await waitForElement(imageData.image.data, timeout, confidence);
}


function updateImageDropdowns(images) {
    // グローバル変数に画像リストを保存
    window.imageList = images;
    
    // すべてのimage_nameドロップダウンを更新
    const blocks = workspace.getAllBlocks();
    
    blocks.forEach(block => {
        if (block.type === 'wait_for_element' || block.type === 'image_variable' || block.type === 'mouse_move_to_image') {
            const dropdown = block.getField('IMAGE_NAME');
            if (dropdown) {
                // 現在の選択値を保存
                const currentValue = dropdown.getValue();
                
                // 新しいオプションを作成
                const options = [['画像を選択', '']];
                images.forEach(img => {
                    options.push([img.name, img.name]);
                });
                
                // ドロップダウンを更新
                dropdown.menuGenerator_ = options;
                
                // 現在の値が新しいオプションに存在するかチェック
                const valueExists = images.some(img => img.name === currentValue);
                if (valueExists && currentValue !== '') {
                    // 既存の選択値を維持
                    dropdown.setValue(currentValue);
                } else if (currentValue !== '') {
                    // 選択されていた画像が削除された場合のみリセット
                    dropdown.setValue('');
                }
                // 初期状態（''）の場合は何もしない
            }
        }
    });
}

// ドロップダウン更新を強制的に行う関数
async function forceUpdateImageDropdowns() {
    try {
        const response = await fetch('/api/images/list');
        const data = await response.json();
        
        if (response.ok && data.images) {
            updateImageDropdowns(data.images);
            console.log('画像ドロップダウンを更新しました:', data.images);
        }
    } catch (error) {
        console.error('画像ドロップダウン更新エラー:', error);
    }
}


// 画像ライブラリの初期化
function initImageLibrary() {
    const uploadZone = document.getElementById('upload-zone');
    const uploadInput = document.getElementById('image-upload-input');
    
    // クリックでファイル選択
    uploadZone.addEventListener('click', () => {
        uploadInput.click();
    });
    
    // ファイル選択時の処理
    uploadInput.addEventListener('change', handleFileUpload);
    
    // ドラッグ＆ドロップ機能
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files: files } });
        }
    });
}

async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            showMessage('画像ファイルのみアップロード可能です', 'error');
            continue;
        }
        
        // 画像名を入力
        const imageName = prompt('画像の名前を入力してください:', file.name.replace(/\.[^/.]+$/, ""));
        if (!imageName) continue;
        
        try {
            // ファイルをBase64に変換
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const imageData = e.target.result;
                    
                    // サーバーにアップロード
                    const response = await fetch('/api/images/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: imageName,
                            imageData: imageData
                        })
                    });
                    
                    const result = await response.json();
                    if (response.ok) {
                        showMessage(`画像「${imageName}」をアップロードしました`, 'success');
                        await refreshImageLibrary();
                    } else {
                        showMessage(result.error || 'アップロードエラー', 'error');
                    }
                } catch (error) {
                    showMessage(`アップロードエラー: ${error.message}`, 'error');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            showMessage(`ファイル読み込みエラー: ${error.message}`, 'error');
        }
    }
    
    // input をリセット
    event.target.value = '';
}

async function refreshImageLibrary() {
    try {
        const response = await fetch('/api/images/list');
        const data = await response.json();
        
        if (response.ok) {
            displayImageList(data.images);
            updateImageDropdowns(data.images);
        }
    } catch (error) {
        console.error('画像リスト取得エラー:', error);
    }
}

function displayImageList(images) {
    const imageList = document.getElementById('image-list');
    
    if (images.length === 0) {
        imageList.innerHTML = '<div class="no-images">画像がありません</div>';
        return;
    }
    
    imageList.innerHTML = '';
    
    images.forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        const createdDate = new Date(image.created).toLocaleDateString('ja-JP');
        
        imageItem.innerHTML = `
            <img class="image-thumbnail" src="" alt="${image.name}" data-image-name="${image.name}">
            <div class="image-info">
                <div class="image-name">${image.name}</div>
                <div class="image-meta">${createdDate}</div>
            </div>
            <div class="image-actions">
                <button class="btn-icon delete" onclick="deleteImage('${image.name}')" title="削除">🗑️</button>
            </div>
        `;
        
        // サムネイル画像を非同期で読み込み
        const thumbnail = imageItem.querySelector('.image-thumbnail');
        // 初期状態でローディング表示
        setLoadingThumbnail(thumbnail);
        loadThumbnail(thumbnail, image.name);
        
        imageList.appendChild(imageItem);
    });
}

async function loadThumbnail(imgElement, imageName) {
    try {
        console.log('Loading thumbnail for:', imageName);
        const response = await fetch(`/api/images/get/${encodeURIComponent(imageName)}`);
        console.log('Thumbnail response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Thumbnail data received:', data);
            
            if (data.status === 'success' && data.image && data.image.data) {
                imgElement.src = data.image.data;
                console.log('Thumbnail set successfully');
            } else {
                console.error('Invalid thumbnail data:', data);
                setErrorThumbnail(imgElement);
            }
        } else {
            console.error('Thumbnail fetch failed:', response.status);
            setErrorThumbnail(imgElement);
        }
    } catch (error) {
        console.error('サムネイル読み込みエラー:', error);
        setErrorThumbnail(imgElement);
    }
}

function setLoadingThumbnail(imgElement) {
    // ローディング用のプレースホルダー画像
    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlY2YwZjEiLz48dGV4dCB4PSIyMCIgeT0iMjMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM3ZjhjOGQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4cHgiPi4uLjwvdGV4dD48L3N2Zz4K';
}

function setErrorThumbnail(imgElement) {
    // エラー用のプレースホルダー画像
    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSIyMCIgeT0iMjMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNlNzRjM2MiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMnB4Ij7ijJw8L3RleHQ+PC9zdmc+';
}

async function deleteImage(imageName) {
    if (!confirm(`画像「${imageName}」を削除しますか？`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/images/delete/${encodeURIComponent(imageName)}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (response.ok) {
            showMessage(result.message, 'success');
            await refreshImageLibrary();
        } else {
            showMessage(result.error || '削除エラー', 'error');
        }
    } catch (error) {
        showMessage(`削除エラー: ${error.message}`, 'error');
    }
}

// ユーティリティ関数
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

function addLog(message, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    executionLog.appendChild(entry);
    executionLog.scrollTop = executionLog.scrollHeight;
}

function clearLog() {
    executionLog.innerHTML = '';
}

// ファイル読み込み関数（ダイアログ）
async function readTextFile() {
    if (stopRequested) throw new Error('実行が停止されました');
    
    addLog('ファイルダイアログを開いています...', 'info');
    
    try {
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'ファイル読み込みエラー');
        }
        
        if (data.status === 'cancelled') {
            addLog('ファイル選択がキャンセルされました', 'info');
            return '';
        }
        
        addLog(`ファイル「${data.filename}」を読み込みました`, 'success');
        return data.content;
    } catch (error) {
        addLog(`ファイル読み込みエラー: ${error.message}`, 'error');
        throw error;
    }
}

// ファイル読み込み関数（パス指定）
async function readTextFileFromPath(filePath) {
    if (stopRequested) throw new Error('実行が停止されました');
    
    if (!filePath) {
        throw new Error('ファイルパスが指定されていません');
    }
    
    addLog(`ファイル「${filePath}」を読み込んでいます...`, 'info');
    
    try {
        const response = await fetch('/api/file/read-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: filePath })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'ファイル読み込みエラー');
        }
        
        addLog(`ファイル「${data.filename}」を読み込みました`, 'success');
        return data.content;
    } catch (error) {
        addLog(`ファイル読み込みエラー: ${error.message}`, 'error');
        throw error;
    }
}

// マウス位置の更新
function updateMousePosition() {
    setInterval(async () => {
        try {
            const response = await fetch('/api/position');
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('pos-x').textContent = data.x;
                document.getElementById('pos-y').textContent = data.y;
            }
        } catch (error) {
            console.error('位置取得エラー:', error);
        }
    }, 1000);
}