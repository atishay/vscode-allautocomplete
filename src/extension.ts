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
import * as path from 'path';
import * as minimatch from 'minimatch';
import { TextDocument, Position, workspace, TextDocumentChangeEvent, Range, window } from "vscode";

const Settings: any = {};

/**
 * Utility function to load all settings
 */
function loadConfiguration() {
    const config = vscode.workspace.getConfiguration('AllAutocomplete');
    Settings.minWordLength = config.get("minWordLength", 3);
    Settings.maxLines = config.get("maxLines", 9999);
    Settings.whitespaceSplitter = new RegExp(config.get("whitespace", "[^\\w]+"), "g");
    Settings.triggerCharacters = config.get("trigger", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_");
    Settings.cycleOpenDocumentsOnLaunch = config.get("cycleOpenDocumentsOnLaunch", false);
    Settings.showCurrentDocument = config.get("showCurrentDocument", true);
    Settings.ignoredWords = config.get("ignoredWords", "").split(Settings.whitespaceSplitter);
    Settings.updateOnlyOnSave = config.get("updateOnlyOnSave", false);
    Settings.excludeFiles = config.get("excludeFiles", "(**/*.git)|(**/*.rendered)");
    Settings.buildInFilesToExclude = ["settings", "settings/editor", "vscode-extensions"];
}

function shouldExcludeFile(file: string): boolean {
    if (Settings.buildInFilesToExclude.indexOf(file) !== -1) {
        return true;
    }
    return minimatch(relativePath(file), Settings.excludeFiles);
}

/**
 * Utility function to get path relative to the workspace root
 */
function relativePath(filePath: string) {
    if (!workspace.rootPath) { return filePath; }
    if (filePath.indexOf(path.sep) === -1) { return filePath; }
    return path.relative(workspace.rootPath, filePath);
}

let activeWord: string = "";
let wordList: Map<TextDocument, { find: Function }> = new Map<TextDocument, { find: Function }>();

/**
 * Implements the CompletionItem returned by autocomplete
 *
 * @class CompletionItem
 * @extends {vscode.CompletionItem}
 */
class CompletionItem extends vscode.CompletionItem {
    file: string;
    line: number;
    count: number;
    constructor(word: string, file: string) {
        super(word);
        this.kind = vscode.CompletionItemKind.Text;
        this.count = 1;
        this.file = file;
        this.detail = `${relativePath(file)}`;
    }
}


const provider = {
    /**
     * Provides the completion items for the supplied words.
     *
     * @param {TextDocument} document
     * @param {Position} position
     * @param {CancellationToken} token
     * @returns
     */
    provideCompletionItems(document: TextDocument, position: Position, token: vscode.CancellationToken) {
        let line = document.lineAt(position.line).text, i = 0;
        for (i = position.character - 1; i > 0; --i) {
            if ((line[i] || "").match(Settings.whitespaceSplitter)) {
                break;
            }
        }
        var pos = new Position(position.line, i);
        let word = document.getText(new Range(pos, position));
        word = word.replace(Settings.whitespaceSplitter, '');
        let results = [];
        wordList.forEach((trie, doc) => {
            if (!Settings.showCurrentDocument) {
                if (doc === document) {
                    return;
                }
            }
            let words = trie.find(word);
            if (words) {
                results = results.concat(words);
            }
        });
        let clean = [], map = {};
        // Do not show the same word in autocomplete.
        map[word] = {};
        map[activeWord] = {};
        // Deduplicate results now.
        results.forEach((item) => {
            if (!map[item.label]) {
                clean.push(item);
                map[item.label] = item;
            }
        });
        return clean;
    }
}

/**
 * Parses a document to create a trie for the document.
 *
 * @param {TextDocument} document
 */
function parseDocument(document: TextDocument) {
    if (shouldExcludeFile(document.fileName)) {
        return;
    }
    const trie = new Trie({ enableCache: false });
    for (let i = 0; i < Math.min(Settings.maxLines, document.lineCount); ++i) {
        const line = document.lineAt(i);
        const text = line.text;
        const words = text.split(Settings.whitespaceSplitter);
        words.forEach((word) => {
            addWord(word, trie, document.fileName);
        });
    }
    wordList.set(document, trie);
}

/**
 * Add word to the autocomplete list
 *
 * @param {string} word
 * @param {any} trie
 * @param {string} fileName
 */
function addWord(word:string, trie:any, fileName:string) {
    word = word.replace(Settings.whitespaceSplitter, '');
    // Active word is used to hide the given word from the autocomplete.
    activeWord = word;
    if (Settings.ignoredWords.indexOf(word) !== -1) return;
    if (word.length >= Settings.minWordLength) {
        let item = trie.find(word);
        if (item && item[0]) {
            item = item[0];
        }
        if (item && item.label === word) {
            item.count++;
        } else {
            item = new CompletionItem(word, fileName);
            trie.add(word, item);
        }
    }
}

/**
 * Remove word from the search index.
 *
 * @param {string} word
 * @param {any} trie
 */
function removeWord(word: string, trie) {
    word = word.replace(Settings.whitespaceSplitter, '');
    if (word.length >= Settings.minWordLength) {
        let item = trie.find(word)[0];
        if (item && item[0]) {
            item = item[0];
        }
        if (item && item.label === word) {
            item.count--;
            if (item.count <= 0) {
                trie.remove(word);
            }
        }
    }
}

/**
 * Finds active documents by cycling them.
 *
 * @returns
 */
function findActiveDocsHack() {
    // Based on https://github.com/eamodio/vscode-restore-editors/blob/master/src/documentManager.ts#L57
    return new Promise((resolve, reject) => {
        let active = window.activeTextEditor as any;
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
                editor = window.activeTextEditor;
                if (editor !== undefined && openEditors.some(_ => _._id === editor._id)) return resolve();
                if ((active === undefined && editor === undefined) || editor._id !== active._id) return handleNextEditor();
                resolve();
            }, 500);
            vscode.commands.executeCommand('workbench.action.nextEditor')
        }
        handleNextEditor();
    });
}

let content = [];
/**
 * Utility class to manage the active document
 *
 * @class ActiveDocManager
 */
class ActiveDocManager {
    static beginTransaction() { }
    static endTransaction(updated: boolean) {
        if (updated) {
            return;
        }
        ActiveDocManager.updateContent();
    }
    static updateContent() {
        if (!window.activeTextEditor || !window.activeTextEditor.document) {
            return;
        }
        content = [];
        let doc = window.activeTextEditor.document;
        if (shouldExcludeFile(doc.fileName)) {
            return;
        }
        for (let i = 0; i < doc.lineCount; ++i) {
            content.push(doc.lineAt(i).text);
        }
    }
    /**
     * Gets content replacement information for range replacement
     *
     * @static
     * @param {Range} r
     * @param {string} newText
     * @returns {new:string, old:string}
     *
     * @memberof ActiveDocManager
     */
    static replace(r: Range, newText: string, noOfChangesInTransaction: number): any {
        // Find old text
        let line: string = content[r.start.line] || "";
        // Get the closest space to the left and right;

        // Start is the actual start wordIndex
        let start: number;
        for (start = r.start.character - 1; start > 0; --start) {
            if ((line[start] || "").match(Settings.whitespaceSplitter)) {
                start = start + 1;
                break;
            }
        }

        // End is the actual end wordIndex
        let end: number;
        let nLine = content[r.end.line] || "";
        for (end = r.end.character; end < nLine.length; ++end) {
            if ((nLine[end] || "").match(/\s/)) {
                end = end;
                break;
            }
        }

        let oldText;
        if (r.isSingleLine) {
            oldText = line.substring(start, end);
        } else {
            let oldText = nLine.substring(start);
            for (let i = r.start.line + 1; i < r.end.line; ++i) {
                oldText += "\n" + content[i];
            }
            oldText += nLine.substring(0, end);
        }
        const nwText = line.substring(start, r.start.character) + newText + nLine.substring(r.end.character, end);
        let updated = false;
        if (noOfChangesInTransaction === 1 && r.isSingleLine) {
            // Special case. Optimize for a single cursor in a single line as that is too frequent to do a re-read.
            const newLine = line.substring(0, r.start.character) + newText + nLine.substring(r.end.character);
            const n = newLine.split(window.activeTextEditor.document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n");
            content[r.start.line] = n[0];
            for (let i = 1; i < n.length; ++i) {
                content.splice(r.start.line + i, 0, n[i]);
            }
            updated = true;
        }

        return {
            old: oldText.split(Settings.whitespaceSplitter),
            new: nwText.split(Settings.whitespaceSplitter),
            updated: updated
        };
    }
    /**
     * Handle content changes to active document
     *
     * @static
     * @param {TextDocumentChangeEvent} e
     * @returns
     *
     * @memberof ActiveDocManager
     */
    static handleContextChange(e: TextDocumentChangeEvent) {
        const activeIndex = wordList.get(e.document);
        if (!activeIndex) {
            console.log("No index found");
            return;
        }
        if (e.document !== window.activeTextEditor.document) {
            console.log("Unexpected Active Doc. Parsing broken");
            return;
        }
        ActiveDocManager.beginTransaction();
        let updated = true;
        e.contentChanges.forEach((change) => {
            let diff = ActiveDocManager.replace(change.range, change.text, e.contentChanges.length);
            diff.old.forEach((string) => {
                removeWord(string, activeIndex);
            });
            diff.new.forEach((string) => {
                addWord(string, activeIndex, e.document.fileName);
            });
            updated = updated && diff.updated;
        });
        ActiveDocManager.endTransaction(updated);
    }
}
let olderActiveDocument:TextDocument;
/**
 * Handle setting of the new active document
 */
function handleNewActiveEditor() {
    if (Settings.showCurrentDocument) {
        ActiveDocManager.updateContent();
    } else {
        if (olderActiveDocument) {
            clearDocument(olderActiveDocument);
            parseDocument(olderActiveDocument);
        }
        olderActiveDocument = window.activeTextEditor ? window.activeTextEditor.document: null;
    }
}

/**
 * Mark all words when the active document changes.
 */
function attachActiveDocListener() {
    if (!Settings.updateOnlyOnSave) {
        window.onDidChangeActiveTextEditor((newDoc: vscode.TextEditor) => {
            handleNewActiveEditor();
        });
        handleNewActiveEditor();
    }
}
/**
 * Removes the document from the list of indexed documents.
 *
 * @param {TextDocument} document
 */
function clearDocument(document: TextDocument) {
    wordList.delete(document);
}

/**
 * On extension activation register the autocomplete handler.
 *
 * @export
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: vscode.ExtensionContext) {
    loadConfiguration();

    const triggerCharacters = Settings.triggerCharacters.split('');
    vscode.languages.registerCompletionItemProvider('*', provider, ...triggerCharacters);
    vscode.commands.registerCommand("AllAutocomplete.cycleDocuments", () => {
        findActiveDocsHack();
    });
    vscode.commands.registerCommand("AllAutocomplete.toggleCurrentFile", () => {
        const config = vscode.workspace.getConfiguration('AllAutocomplete');
        if (Settings.showCurrentDocument) {
            config.update("showCurrentDocument", false);
            Settings.showCurrentDocument = false;
        } else {
            config.update("showCurrentDocument", true);
            Settings.showCurrentDocument = true;
            let currentDocument = window.activeTextEditor ? window.activeTextEditor.document : null;
            if (currentDocument) {
                clearDocument(currentDocument);
                parseDocument(currentDocument);
                ActiveDocManager.updateContent();
            }
        }
    });

    workspace.onDidOpenTextDocument((document: TextDocument) => {
        parseDocument(document);
    });

    workspace.onDidCloseTextDocument((document: TextDocument) => {
        if (olderActiveDocument === document) {
            olderActiveDocument = null;
        }
        clearDocument(document);
    });

    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
        if (shouldExcludeFile(e.document.fileName)) {
            return;
        }
        if (!Settings.updateOnlyOnSave && Settings.showCurrentDocument) {
            ActiveDocManager.handleContextChange(e);
        }
    });
    if (Settings.updateOnlyOnSave) {
        workspace.onDidSaveTextDocument((document: TextDocument) => {
            clearDocument(document);
            parseDocument(document);
        });
    }

    for (let i = 0; i < workspace.textDocuments.length; ++i) {
        // Parse all words in this document
        parseDocument(workspace.textDocuments[i]);
    }

    // All open editors are not available: https://github.com/Microsoft/vscode/issues/15178
    if (Settings.cycleOpenDocumentsOnLaunch) {
        findActiveDocsHack().then(attachActiveDocListener);
    } else {
        attachActiveDocListener();
    }
}

/**
 * Free up everything on deactivation
 *
 * @export
 */
export function deactivate() {
    wordList.clear();
    content = [];
}
