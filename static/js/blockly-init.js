// Blocklyの初期化とカスタムブロック定義を統合
let workspace;

// カスタムブロックとコード生成器の定義
function defineCustomBlocks() {
    // マウス操作ブロック群
    Blockly.defineBlocksWithJsonArray([
        // マウス絶対座標移動
        {
            "type": "mouse_move_absolute",
            "message0": "マウスを絶対座標 X: %1  Y: %2 に移動",
            "args0": [
                {
                    "type": "input_value",
                    "name": "X",
                    "check": "Number"
                },
                {
                    "type": "input_value",
                    "name": "Y", 
                    "check": "Number"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "マウスを指定した絶対座標に移動します"
        },
        // マウス相対座標移動
        {
            "type": "mouse_move_relative",
            "message0": "マウスを相対座標 X: %1  Y: %2 だけ移動",
            "args0": [
                {
                    "type": "input_value",
                    "name": "X",
                    "check": "Number"
                },
                {
                    "type": "input_value",
                    "name": "Y",
                    "check": "Number"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "マウスを現在位置から指定した相対座標だけ移動します"
        },
        // スクロール
        {
            "type": "mouse_scroll",
            "message0": "スクロール %1 %2",
            "args0": [
                {
                    "type": "input_value",
                    "name": "AMOUNT",
                    "check": "Number"
                },
                {
                    "type": "field_dropdown",
                    "name": "DIRECTION",
                    "options": [
                        ["下", "down"],
                        ["上", "up"]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "画面をスクロールします"
        },
        // シングルクリック
        {
            "type": "mouse_single_click",
            "message0": "%1 シングルクリック",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BUTTON",
                    "options": [
                        ["左ボタン", "left"],
                        ["右ボタン", "right"]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "現在位置でシングルクリックします"
        },
        // ダブルクリック
        {
            "type": "mouse_double_click",
            "message0": "%1 ダブルクリック",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BUTTON",
                    "options": [
                        ["左ボタン", "left"],
                        ["右ボタン", "right"]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "現在位置でダブルクリックします"
        },
        // トリプルクリック
        {
            "type": "mouse_triple_click",
            "message0": "%1 トリプルクリック",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BUTTON",
                    "options": [
                        ["左ボタン", "left"],
                        ["右ボタン", "right"]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "現在位置でトリプルクリックします"
        },
        // 長押しクリック
        {
            "type": "mouse_long_press",
            "message0": "%1 長押し %2 秒",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BUTTON",
                    "options": [
                        ["左ボタン", "left"],
                        ["右ボタン", "right"]
                    ]
                },
                {
                    "type": "input_value",
                    "name": "DURATION",
                    "check": "Number"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "指定した秒数長押しします"
        },
        // リリース
        {
            "type": "mouse_release",
            "message0": "%1 リリース",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BUTTON",
                    "options": [
                        ["左ボタン", "left"],
                        ["右ボタン", "right"]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "マウスボタンをリリースします"
        },
        // 中クリック
        {
            "type": "mouse_middle_click",
            "message0": "中クリック",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "現在位置で中クリック（ホイールクリック）します"
        },
        // キーボード操作
        {
            "type": "key_press",
            "message0": "キー %1 を押す",
            "args0": [
                {
                    "type": "field_input",
                    "name": "KEY",
                    "text": "enter"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 230,
            "tooltip": "指定したキーを押します"
        },
        {
            "type": "type_text",
            "message0": "テキスト %1 を入力",
            "args0": [
                {
                    "type": "field_input",
                    "name": "TEXT",
                    "text": "入力テキスト"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 230,
            "tooltip": "指定したテキストを入力します"
        },
        // 制御構造
        {
            "type": "wait",
            "message0": "待機 %1 秒",
            "args0": [
                {
                    "type": "input_value",
                    "name": "TIME",
                    "check": "Number"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 160,
            "tooltip": "指定した秒数待機します"
        },
        {
            "type": "repeat_times",
            "message0": "繰り返し %1 回 %2",
            "args0": [
                {
                    "type": "input_value",
                    "name": "TIMES",
                    "check": "Number"
                },
                {
                    "type": "input_statement",
                    "name": "DO"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 160,
            "tooltip": "指定した回数繰り返します"
        },
        // ブラウザ制御
        {
            "type": "browser_open_url",
            "message0": "URL %1 を開く",
            "args0": [
                {
                    "type": "field_input",
                    "name": "URL",
                    "text": "https://"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 290,
            "tooltip": "指定したURLをブラウザで開きます"
        },
        {
            "type": "browser_refresh",
            "message0": "ブラウザを更新",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 290,
            "tooltip": "現在のブラウザページを更新します"
        },
        {
            "type": "wait_for_element",
            "message0": "要素 %1 が出現するまで %2 秒待機（信頼度 %3 %）",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "IMAGE_NAME",
                    "options": function() {
                        // 画像リストを取得してオプションを生成
                        const options = [['画像を選択', '']];
                        if (typeof window.imageList !== 'undefined' && Array.isArray(window.imageList)) {
                            window.imageList.forEach(img => {
                                options.push([img.name, img.name]);
                            });
                        }
                        return options;
                    }
                },
                {
                    "type": "input_value",
                    "name": "TIMEOUT",
                    "check": "Number"
                },
                {
                    "type": "input_value", 
                    "name": "CONFIDENCE",
                    "check": "Number"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 290,
            "tooltip": "指定した画像要素が画面に出現するまで待機します"
        },
        // 画像管理
        {
            "type": "image_variable",
            "message0": "画像 %1",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "IMAGE_NAME",
                    "options": function() {
                        // 画像リストを取得してオプションを生成
                        const options = [['画像を選択', '']];
                        if (typeof window.imageList !== 'undefined' && Array.isArray(window.imageList)) {
                            window.imageList.forEach(img => {
                                options.push([img.name, img.name]);
                            });
                        }
                        return options;
                    }
                }
            ],
            "output": "String",
            "colour": 340,
            "tooltip": "保存された画像変数を参照します"
        }
    ]);

    // コード生成器の定義
    javascript.javascriptGenerator.forBlock['mouse_move_absolute'] = function(block, generator) {
        const value_x = generator.valueToCode(block, 'X', javascript.Order.ATOMIC) || '0';
        const value_y = generator.valueToCode(block, 'Y', javascript.Order.ATOMIC) || '0';
        return 'await mouseMoveAbsolute(' + value_x + ', ' + value_y + ');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_move_relative'] = function(block, generator) {
        const value_x = generator.valueToCode(block, 'X', javascript.Order.ATOMIC) || '0';
        const value_y = generator.valueToCode(block, 'Y', javascript.Order.ATOMIC) || '0';
        return 'await mouseMoveRelative(' + value_x + ', ' + value_y + ');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_scroll'] = function(block, generator) {
        const value_amount = generator.valueToCode(block, 'AMOUNT', javascript.Order.ATOMIC) || '3';
        const dropdown_direction = block.getFieldValue('DIRECTION');
        return 'await mouseScroll(' + value_amount + ', \'' + dropdown_direction + '\');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_single_click'] = function(block, generator) {
        const dropdown_button = block.getFieldValue('BUTTON');
        return 'await mouseSingleClick(\'' + dropdown_button + '\');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_double_click'] = function(block, generator) {
        const dropdown_button = block.getFieldValue('BUTTON');
        return 'await mouseDoubleClick(\'' + dropdown_button + '\');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_triple_click'] = function(block, generator) {
        const dropdown_button = block.getFieldValue('BUTTON');
        return 'await mouseTripleClick(\'' + dropdown_button + '\');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_long_press'] = function(block, generator) {
        const dropdown_button = block.getFieldValue('BUTTON');
        const value_duration = generator.valueToCode(block, 'DURATION', javascript.Order.ATOMIC) || '1';
        return 'await mouseLongPress(\'' + dropdown_button + '\', ' + value_duration + ');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_release'] = function(block, generator) {
        const dropdown_button = block.getFieldValue('BUTTON');
        return 'await mouseRelease(\'' + dropdown_button + '\');\n';
    };

    javascript.javascriptGenerator.forBlock['mouse_middle_click'] = function(block, generator) {
        return 'await mouseMiddleClick();\n';
    };

    javascript.javascriptGenerator.forBlock['key_press'] = function(block, generator) {
        const text_key = block.getFieldValue('KEY');
        return 'await keyPress(\'' + text_key + '\');\n';
    };

    javascript.javascriptGenerator.forBlock['type_text'] = function(block, generator) {
        const text_text = block.getFieldValue('TEXT');
        const escaped_text = text_text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return 'await typeText(\'' + escaped_text + '\');\n';
    };

    javascript.javascriptGenerator.forBlock['wait'] = function(block, generator) {
        const value_time = generator.valueToCode(block, 'TIME', javascript.Order.ATOMIC) || '1';
        return 'await wait(' + value_time + ');\n';
    };

    javascript.javascriptGenerator.forBlock['repeat_times'] = function(block, generator) {
        const value_times = generator.valueToCode(block, 'TIMES', javascript.Order.ATOMIC) || '1';
        const statements_do = generator.statementToCode(block, 'DO');
        return 'for (let i = 0; i < ' + value_times + '; i++) {\n' + statements_do + '}\n';
    };

    javascript.javascriptGenerator.forBlock['browser_open_url'] = function(block, generator) {
        const text_url = block.getFieldValue('URL');
        const escaped_url = text_url.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return 'await openUrl(\'' + escaped_url + '\');\n';
    };


    javascript.javascriptGenerator.forBlock['browser_refresh'] = function(block, generator) {
        return 'await refreshBrowser();\n';
    };

    javascript.javascriptGenerator.forBlock['wait_for_element'] = function(block, generator) {
        const image_name = block.getFieldValue('IMAGE_NAME');
        const timeout = generator.valueToCode(block, 'TIMEOUT', javascript.Order.ATOMIC) || '30';
        const confidence = generator.valueToCode(block, 'CONFIDENCE', javascript.Order.ATOMIC) || '80';
        return 'await waitForElementByName(\'' + image_name + '\', ' + timeout + ', ' + confidence + ');\n';
    };


    javascript.javascriptGenerator.forBlock['image_variable'] = function(block, generator) {
        const image_name = block.getFieldValue('IMAGE_NAME');
        return ['\'' + image_name + '\'', javascript.Order.ATOMIC];
    };
}

// Blocklyワークスペースの初期化
function initializeBlockly() {
    // カスタムブロックを定義
    defineCustomBlocks();
    
    // ワークスペースを作成
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
        trashcan: true,
    });
    
    // ワークスペースの変更イベントを監視して画像ドロップダウンを更新
    workspace.addChangeListener(function(event) {
        if (event.type === Blockly.Events.BLOCK_CREATE || 
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.FINISHED_LOADING) {
            setTimeout(() => {
                if (typeof forceUpdateImageDropdowns === 'function') {
                    forceUpdateImageDropdowns();
                }
            }, 100);
        }
    });
    
    console.log('Blockly workspace initialized with custom blocks');
    return workspace;
}