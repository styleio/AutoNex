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