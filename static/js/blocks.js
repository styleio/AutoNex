// Blocklyが読み込まれるまで待機
if (typeof Blockly === 'undefined') {
    console.error('Blockly is not loaded');
}

// ジェネレータの初期化関数
function initializeGenerators() {
    if (typeof javascript !== 'undefined' && javascript.javascriptGenerator) {
        // 新しい形式のジェネレータを使用
        javascript.javascriptGenerator.forBlock['mouse_click'] = function(block, generator) {
            var value_x = generator.valueToCode(block, 'X', javascript.Order.ATOMIC) || '0';
            var value_y = generator.valueToCode(block, 'Y', javascript.Order.ATOMIC) || '0';
            var code = 'await mouseClick(' + value_x + ', ' + value_y + ');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['mouse_move'] = function(block, generator) {
            var value_x = generator.valueToCode(block, 'X', javascript.Order.ATOMIC) || '0';
            var value_y = generator.valueToCode(block, 'Y', javascript.Order.ATOMIC) || '0';
            var code = 'await mouseMove(' + value_x + ', ' + value_y + ');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['mouse_move_to_image'] = function(block, generator) {
            var dropdown_image = block.getFieldValue('IMAGE_NAME');
            var dropdown_position = block.getFieldValue('POSITION');
            var code = 'await mouseMoveToImage(\'' + dropdown_image + '\', \'' + dropdown_position + '\');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['mouse_scroll'] = function(block, generator) {
            var value_amount = generator.valueToCode(block, 'AMOUNT', javascript.Order.ATOMIC) || '3';
            var dropdown_direction = block.getFieldValue('DIRECTION');
            var code = 'await mouseScroll(' + value_amount + ', \'' + dropdown_direction + '\');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['key_press'] = function(block, generator) {
            var text_key = block.getFieldValue('KEY');
            var code = 'await keyPress(\'' + text_key + '\');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['type_text'] = function(block, generator) {
            var text_text = block.getFieldValue('TEXT');
            var escaped_text = text_text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            var code = 'await typeText(\'' + escaped_text + '\');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['wait'] = function(block, generator) {
            var value_time = generator.valueToCode(block, 'TIME', javascript.Order.ATOMIC) || '1';
            var code = 'await wait(' + value_time + ');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['repeat_times'] = function(block, generator) {
            var value_times = generator.valueToCode(block, 'TIMES', javascript.Order.ATOMIC) || '1';
            var statements_do = generator.statementToCode(block, 'DO');
            var code = 'for (let i = 0; i < ' + value_times + '; i++) {\n' + statements_do + '}\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['browser_open_url'] = function(block, generator) {
            var text_url = block.getFieldValue('URL');
            var escaped_url = text_url.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            var code = 'await openUrl(\'' + escaped_url + '\');\n';
            return code;
        };

        javascript.javascriptGenerator.forBlock['browser_refresh'] = function(block, generator) {
            var code = 'await refreshBrowser();\n';
            return code;
        };
    }
}

// ページロード時に実行
window.addEventListener('load', function() {
    setTimeout(initializeGenerators, 100);
});

// マウスクリックブロック
Blockly.Blocks['mouse_click'] = {
    init: function() {
        this.appendValueInput("X")
            .setCheck("Number")
            .appendField("座標");
        this.appendValueInput("Y")
            .setCheck("Number")
            .appendField("X:")
            .appendField("  Y:");
        this.appendDummyInput()
            .appendField("をクリック");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("指定した座標をクリックします");
    }
};

Blockly.JavaScript['mouse_click'] = function(block) {
    var value_x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var value_y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var code = 'await mouseClick(' + value_x + ', ' + value_y + ');\n';
    return code;
};

// マウス移動ブロック
Blockly.Blocks['mouse_move'] = {
    init: function() {
        this.appendValueInput("X")
            .setCheck("Number")
            .appendField("マウスを座標");
        this.appendValueInput("Y")
            .setCheck("Number")
            .appendField("X:")
            .appendField("  Y:");
        this.appendDummyInput()
            .appendField("に移動");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("マウスを指定した座標に移動します");
    }
};

Blockly.JavaScript['mouse_move'] = function(block) {
    var value_x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var value_y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var code = 'await mouseMove(' + value_x + ', ' + value_y + ');\n';
    return code;
};

// 画像へマウス移動ブロック
Blockly.Blocks['mouse_move_to_image'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("画像")
            .appendField(new Blockly.FieldDropdown(this.generateImageOptions.bind(this)), "IMAGE_NAME")
            .appendField("の")
            .appendField(new Blockly.FieldDropdown([["中央", "center"], ["起点", "topleft"]]), "POSITION")
            .appendField("までマウスを移動");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("画像を検索してマウスを移動します");
    },
    generateImageOptions: function() {
        // 画像リストを取得してオプションを生成
        const options = [['画像を選択', '']];
        
        // グローバル変数から画像リストを取得（blockly-init.jsで定義）
        if (typeof window.imageList !== 'undefined' && Array.isArray(window.imageList)) {
            window.imageList.forEach(img => {
                options.push([img.name, img.name]);
            });
        }
        
        return options;
    }
};

// JavaScript generator for mouse_move_to_image
if (typeof javascript !== 'undefined' && javascript.javascriptGenerator) {
    javascript.javascriptGenerator.forBlock['mouse_move_to_image'] = function(block, generator) {
        var dropdown_image = block.getFieldValue('IMAGE_NAME');
        var dropdown_position = block.getFieldValue('POSITION');
        var code = 'await mouseMoveToImage(\'' + dropdown_image + '\', \'' + dropdown_position + '\');\n';
        return code;
    };
} else if (typeof Blockly.JavaScript !== 'undefined') {
    Blockly.JavaScript['mouse_move_to_image'] = function(block) {
        var dropdown_image = block.getFieldValue('IMAGE_NAME');
        var dropdown_position = block.getFieldValue('POSITION');
        var code = 'await mouseMoveToImage(\'' + dropdown_image + '\', \'' + dropdown_position + '\');\n';
        return code;
    };
}

// スクロールブロック
Blockly.Blocks['mouse_scroll'] = {
    init: function() {
        this.appendValueInput("AMOUNT")
            .setCheck("Number")
            .appendField("スクロール");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["下", "down"], ["上", "up"]]), "DIRECTION");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("画面をスクロールします");
    }
};

Blockly.JavaScript['mouse_scroll'] = function(block) {
    var value_amount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '3';
    var dropdown_direction = block.getFieldValue('DIRECTION');
    var code = 'await mouseScroll(' + value_amount + ', \'' + dropdown_direction + '\');\n';
    return code;
};

// キー押下ブロック
Blockly.Blocks['key_press'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("キー")
            .appendField(new Blockly.FieldTextInput("enter"), "KEY")
            .appendField("を押す");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("指定したキーを押します");
    }
};

Blockly.JavaScript['key_press'] = function(block) {
    var text_key = block.getFieldValue('KEY');
    var code = 'await keyPress(\'' + text_key + '\');\n';
    return code;
};

// テキスト入力ブロック
Blockly.Blocks['type_text'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("テキスト")
            .appendField(new Blockly.FieldTextInput("入力テキスト"), "TEXT")
            .appendField("を入力");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("指定したテキストを入力します");
    }
};

Blockly.JavaScript['type_text'] = function(block) {
    var text_text = block.getFieldValue('TEXT');
    // エスケープ処理
    var escaped_text = text_text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    var code = 'await typeText(\'' + escaped_text + '\');\n';
    return code;
};

// 待機ブロック
Blockly.Blocks['wait'] = {
    init: function() {
        this.appendValueInput("TIME")
            .setCheck("Number")
            .appendField("待機");
        this.appendDummyInput()
            .appendField("秒");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("指定した秒数待機します");
    }
};

Blockly.JavaScript['wait'] = function(block) {
    var value_time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC) || '1';
    var code = 'await wait(' + value_time + ');\n';
    return code;
};

// 繰り返しブロック
Blockly.Blocks['repeat_times'] = {
    init: function() {
        this.appendValueInput("TIMES")
            .setCheck("Number")
            .appendField("繰り返し");
        this.appendDummyInput()
            .appendField("回");
        this.appendStatementInput("DO")
            .setCheck(null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("指定した回数繰り返します");
    }
};

Blockly.JavaScript['repeat_times'] = function(block) {
    var value_times = Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC) || '1';
    var statements_do = Blockly.JavaScript.statementToCode(block, 'DO');
    var code = 'for (let i = 0; i < ' + value_times + '; i++) {\n' + statements_do + '}\n';
    return code;
};

// ブラウザ制御ブロック
// URLを開くブロック
Blockly.Blocks['browser_open_url'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("URL")
            .appendField(new Blockly.FieldTextInput("https://"), "URL")
            .appendField("を開く");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("指定したURLをブラウザで開きます");
    }
};

Blockly.JavaScript['browser_open_url'] = function(block) {
    var text_url = block.getFieldValue('URL');
    var escaped_url = text_url.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    var code = 'await openUrl(\'' + escaped_url + '\');\n';
    return code;
};

// ブラウザ更新ブロック
Blockly.Blocks['browser_refresh'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("ブラウザを更新");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("現在のブラウザページを更新します");
    }
};

Blockly.JavaScript['browser_refresh'] = function(block) {
    var code = 'await refreshBrowser();\n';
    return code;
};

console.log('Custom blocks loaded');