let workspace;
let executionLog;
let isRunning = false;
let stopRequested = false;

// 初期化 - Blocklyが完全にロードされてから実行
window.addEventListener('load', function() {
    // カスタムブロックが登録されているか確認
    setTimeout(function() {
        console.log('Initializing Blockly workspace...');
        initBlockly();
        initControls();
        updateMousePosition();
        loadSavedPrograms();
        
        // JavaScript生成器が登録されているか確認
        if (typeof Blockly.JavaScript['mouse_click'] === 'undefined') {
            console.error('Custom block generators are not loaded!');
        }
    }, 100);
});

// Blocklyワークスペースの初期化
function initBlockly() {
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true
    });
    console.log('Blockly workspace initialized');
}

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
    
    try {
        // JavaScript生成器の確認
        console.log('Available generators:', Object.keys(Blockly.JavaScript));
        
        const code = Blockly.JavaScript.workspaceToCode(workspace);
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
    
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: programName,
                data: xmlText
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
        const response = await fetch(`/api/load/${programName}`);
        const data = await response.json();
        
        if (response.ok) {
            workspace.clear();
            const xml = Blockly.Xml.textToDom(data.data);
            Blockly.Xml.domToWorkspace(xml, workspace);
            showMessage('読み込みました', 'success');
        } else {
            showMessage(data.error || '読み込みに失敗しました', 'error');
        }
    } catch (error) {
        showMessage('通信エラーが発生しました', 'error');
    }
}

// 保存済みプログラムリストの更新
async function loadSavedPrograms() {
    try {
        const response = await fetch('/api/programs');
        const data = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('saved-programs');
            select.innerHTML = '<option value="">-- 保存済みプログラムを選択 --</option>';
            
            data.programs.forEach(program => {
                const option = document.createElement('option');
                option.value = program;
                option.textContent = program;
                select.appendChild(option);
            });
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

// 実行関数
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
        throw new Error(data.error || '移動エラー');
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