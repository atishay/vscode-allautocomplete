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
import minimatch from 'minimatch';
import { Utils } from 'vscode-uri';

/**
 * Checks if the file is marked for exclusion by the user settings
 *
 * @export
 * @param {string} file
 * @returns {boolean}
 */
export function shouldExcludeFile(file: vscode.Uri): boolean {
    var filename = Utils.basename(file);
    if (Settings.buildInFilesToExclude.indexOf(filename) !== -1) {
        return true;
    }
    if (Settings.buildInRegexToExclude.find((regex) => Array.isArray(file.path.match(regex))) !== undefined) {
        return true;
    }
    return minimatch(relativePath(file), Settings.excludeFiles, {dot: true});
}

/**
 * Converts document path to relative path
 *
 * @export
 * @param {string} filePath
 * @returns
 */
export function relativePath(filePath: vscode.Uri) {
    return vscode.workspace.asRelativePath(filePath);
}
