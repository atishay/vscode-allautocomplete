/**
 * COPYRIGHT 2017 Atishay Jain<contact@atishay.me>
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';
import * as vscode from 'vscode';
import { Settings } from './Settings';
import * as path from 'path';
import * as minimatch from 'minimatch';

/**
 * Checks if the file is marked for exclusion by the user settings
 *
 * @export
 * @param {string} file
 * @returns {boolean}
 */
export function shouldExcludeFile(file: string): boolean {
    var filename = path.basename(file);
    if (Settings.buildInFilesToExclude.indexOf(filename) !== -1) {
        return true;
    }
    if (Settings.buildInRegexToExclude.find((regex) => Array.isArray(file.match(regex))) !== undefined) {
        return true;
    }
    return minimatch(this.relativePath(file), Settings.excludeFiles);
}

/**
 * Converts document path to relative path
 *
 * @export
 * @param {string} filePath
 * @returns
 */
export function relativePath(filePath: string) {
    return vscode.workspace.asRelativePath(filePath);
}

/**
 * Finds active documents by cycling them.
 *
 * @returns
 */
export function findActiveDocsHack() {
    // Based on https://github.com/eamodio/vscode-restore-editors/blob/master/src/documentManager.ts#L57
    return new Promise((resolve, reject) => {
        let active = vscode.window.activeTextEditor as any;
        let editor = active;
        const openEditors: any[] = [];
        function handleNextEditor() {
            if (editor !== undefined) {
                // If we didn't start with a valid editor, set one once we find it
                if (active === undefined) {
                    active = editor;
                }

                openEditors.push(editor);
            }
            // window.onDidChangeActiveTextEditor should work here but I don't know why it doesn't
            setTimeout(() => {
                editor = vscode.window.activeTextEditor;
                if (editor !== undefined && openEditors.some(_ => _._id === editor._id)) return resolve();
                if ((active === undefined && editor === undefined) || editor._id !== active._id) return handleNextEditor();
                resolve();
            }, 500);
            vscode.commands.executeCommand('workbench.action.nextEditor')
        }
        handleNextEditor();
    });
}
