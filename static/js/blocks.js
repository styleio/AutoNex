// Blocklyが読み込まれるまで待機
if (typeof Blockly === 'undefined') {
    console.error('Blockly is not loaded');
}

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

console.log('Custom blocks loaded');