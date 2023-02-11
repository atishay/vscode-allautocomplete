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
import * as Diacritic from 'diacritic';
import { Settings } from './Settings';
import { CompletionItem } from './CompletionItem'

class WordListClass extends Map<vscode.TextDocument, { find: Function }> {
    activeWord: string;
    /**
     * Add word to the autocomplete list
     *
     * @param {string} word
     * @param {any} trie
     * @param {vscode.TextDocument} document
     */
    addWord(word: string, trie: any, document: vscode.TextDocument) {
        word = word.replace(Settings.whitespaceSplitter(document.languageId), '');
        // Active word is used to hide the given word from the autocomplete.
        this.activeWord = word;
        if (Settings.ignoredWords.indexOf(word) !== -1) return;
        if (word.length >= Settings.minWordLength) {
            let items = trie.find(word);
            let item: CompletionItem;
            // check for the dialect free verion as well.
            let cleaned = Diacritic.clean(word);
            if (cleaned === word) {
                items && items.some(elem => {
                    if (elem.label === word) {
                        item = elem;
                        return true;
                    }
                });
                if (item) {
                    item.count++;
                } else {
                    item = new CompletionItem(word, document.uri);
                    trie.add(word, item);
                }
                
            } else {
                let itemList: Array<CompletionItem> = [];
                items && items.filter(elem => {
                    if (elem.label === word) {
                        itemList.push(elem);
                        return true;
                    }
                });
                if (itemList.length > 0) {
                    itemList.forEach(item => item.count++);
                } else {
                    item = new CompletionItem(word, document.uri);
                    trie.add(word, item);
                    if (cleaned !== word) {
                        item = new CompletionItem(word, document.uri, cleaned);
                        trie.add(word, item);
                    }
                }
            }
        }
    }
    /**
     * Remove word from the search index.
     *
     * @param {string} word
     * @param {any} trie
     */
    removeWord(word: string, trie, document: vscode.TextDocument) {
        word = word.replace(Settings.whitespaceSplitter(document.languageId), '');
        if (word.length >= Settings.minWordLength) {
            let cleaned = Diacritic.clean(word);
            let items = trie.find(word);
            if (cleaned === word) {
                items = items?.filter(elem => {
                    return elem.label === word;
                }) ?? [];
                if (items.length > 0) {
                    for (let item of items) {
                        if (item && item.label === word) {
                            item.count--;
                            if (item.count <= 0) {
                                trie.remove(word);
                            }
                        }
                    }
                }
            } else {
                let item: CompletionItem;
                items && items.some(elem => {
                    if (elem.label === word) {
                        item = elem;
                        return true;
                    }
                });
                if (item && item.label === word) {
                    item.count--;
                    if (item.count <= 0) {
                        trie.remove(word);
                    }
                }
            }
        }
    }
}

export const WordList = new WordListClass();
