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

/**
 * Utility class to hold all settings.
 *
 * @class SettingsClass
 */
class SettingsClass {
    buildInFilesToExclude: string[];
    excludeFiles: string;
    updateOnlyOnSave: boolean;
    ignoredWords: string[];
    showCurrentDocument: boolean;
    cycleOpenDocumentsOnLaunch: boolean;
    whitespaceSplitter: RegExp;
    maxLines: number;
    minWordLength: number;
    init() {
        const config = vscode.workspace.getConfiguration('AllAutocomplete');
        this.minWordLength = config.get("minWordLength", 3);
        this.maxLines = config.get("maxLines", 9999);
        this.whitespaceSplitter = new RegExp(config.get("whitespace", "[^\\w]+"), "g");
        this.cycleOpenDocumentsOnLaunch = config.get("cycleOpenDocumentsOnLaunch", false);
        this.showCurrentDocument = config.get("showCurrentDocument", true);
        this.ignoredWords = config.get("ignoredWords", "").split(this.whitespaceSplitter);
        this.updateOnlyOnSave = config.get("updateOnlyOnSave", false);
        this.excludeFiles = config.get("excludeFiles", "*.+(git|rendered)");
        this.buildInFilesToExclude = ["settings", "settings/editor", "vscode-extensions"];
    }
}

export const Settings = new SettingsClass();
