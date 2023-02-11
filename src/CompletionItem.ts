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
import { DocumentManager } from './DocumentManager';

/**
 * Implements the CompletionItem returned by autocomplete
 *
 * @class CompletionItem
 * @extends {vscode.CompletionItem}
 */
export class CompletionItem extends vscode.CompletionItem {
    file: vscode.Uri;
    line: number;
    count: number;
    details: String[];
    constructor(word: string, file: vscode.Uri, sortText: string = undefined) {
        super(word);
        this.kind = vscode.CompletionItemKind.Text;
        this.count = 1;
        this.file = file;
        this.detail = `${DocumentManager.documentDisplayPath(this.file)} (${this.count})`;
        this.documentation = Array.isArray(this.details) ? this.details.join("\n") : new vscode.MarkdownString(`Used \`${this.count}\` times in \n ${this.file.path.replaceAll(/\//g, " > ")}`);
        this.sortText = this.filterText = sortText;
    }
    
    static copy(item: CompletionItem) {
        let newItem = new CompletionItem(item.label.toString(), item.file);
        newItem.count = item.count;
        newItem.details = item.details;
        return newItem;
    }
}
