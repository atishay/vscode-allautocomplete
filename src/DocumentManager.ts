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
import * as Trie from 'triejs';
import { Settings } from './Settings';
import { WordList } from './WordList';
import { shouldExcludeFile } from './Utils';

/**
 * Class to manage addition and removal of documents from the index
 *
 * @class DocumentManagerClass
 */
class DocumentManagerClass {
    /**
     * Parses a document to create a trie for the document.
     *
     * @param {TextDocument} document
     * @memberof DocumentManagerClass
     */
    parseDocument(document: vscode.TextDocument) {
        if (shouldExcludeFile(document.fileName)) {
            return;
        }
        const trie = new Trie({ enableCache: false });
        for (let i = 0; i < Math.min(Settings.maxLines, document.lineCount); ++i) {
            const line = document.lineAt(i);
            const text = line.text;
            const words = text.split(Settings.whitespaceSplitter);
            words.forEach((word) => {
                WordList.addWord(word, trie, document.fileName);
            });
        }
        WordList.set(document, trie);
    }

    /**
     * Removes the document from the list of indexed documents.
     *
     * @param {TextDocument} document
     *@memberof DocumentManagerClass
     */
    clearDocument(document: vscode.TextDocument) {
        WordList.delete(document);
    }

}

export const DocumentManager = new DocumentManagerClass();
