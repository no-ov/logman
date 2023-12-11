
import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

function insertLog() {
	console.log('insertLog command executed'); // 验证命令是否被触发
	const editor = vscode.window.activeTextEditor;
	// console.log('editor', editor)
	if (!editor) {
			return; 
	}

	const document = editor.document;
	const text = document.getText();

	const ast = parse(text, {
			sourceType: 'module',
			plugins: ['typescript', 'jsx']
	});


	traverse(ast, {
			enter(path) {
					if (path.isMethod() || path.isFunctionExpression() || path.isArrowFunctionExpression()) {
							 // 获取方法名
							 let functionName = '';
							
							 if (path.isArrowFunctionExpression()) {
								// 处理箭头函数
								if (path.parentPath.isVariableDeclarator() && t.isIdentifier(path.parentPath.node.id)) {
									functionName = path.parentPath.node.id.name; // 箭头函数赋值给变量
								} else if (path.parentPath.isObjectProperty() && t.isIdentifier(path.parentPath.node.key)) {
									functionName = path.parentPath.node.key.name; // 箭头函数作为对象属性
								}
							} else if (path.isFunctionExpression() && path.node.id && t.isIdentifier(path.node.id)) {
								functionName = path.node.id.name; // 普通函数表达式
							} else if (path.isMethod() && t.isIdentifier(path.node.key)) {
								functionName = path.node.key.name; // 类方法
							}
				


							 // 创建 console.log 语句
							 const consoleLog = t.expressionStatement(
									 t.callExpression(
											 t.memberExpression(t.identifier('console'), t.identifier('log')),
											 [t.stringLiteral(functionName)] // 插入方法名
									 )
							 );

							 // 将 console.log 插入方法体的开始处
							 if (path.node.body && path.node.body.type === 'BlockStatement') {
									 path.node.body.body.unshift(consoleLog);
							 }
					}
			}
	});

	// 使用 @babel/generator 生成修改后的代码
	const output = generate(ast, {
		retainLines: true, // 保留行号
		concise: true, // 简洁输出
}, text);

	    // 应用更改到编辑器
			editor.edit(editBuilder => {
        const entireRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );

        editBuilder.replace(entireRange, output.code);
    });
}


export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('logman.insertLog', insertLog);

	context.subscriptions.push(disposable);
}


export function deactivate() {}
