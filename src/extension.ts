'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Trie from 'triejs';
import { TextDocument, Position, workspace, TextDocumentChangeEvent, Range, TextEditor, window } from "vscode";

// https://github.com/Microsoft/vscode/issues/12115

const MIN_WORD_LENGTH = 3;
const MAX_LINES = 9999;
const WHITESPACE_SPLITTER = /[^\w+]/g;
const APPLY_OPEN_DOCS_HACK = true;
const SHOW_CURRENT_DOCUMENT = true;
//exclude_from_completion

let wordList: Array<{ document: TextDocument, words: {find: Function} }> = [];

/**
 * Implements the CompletionItem returned by autocomplete
 *
 * @class CompletionItem
 * @extends {vscode.CompletionItem}
 */
class CompletionItem extends vscode.CompletionItem{
    file: string;
    line: number;
    count: number;
    constructor(word: string, file: string) {
        super(word);
        this.count = 1;
        this.file = file;
        this.detail = `${file}`;
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
        for (i = position.character; i > 0; --i) {
            if ((line[i] || "").match(WHITESPACE_SPLITTER)) {
                break;
            }
        }
        var pos = new Position(position.line, i);
        let word = document.getText(new Range(pos, position))
        let results = [];
        wordList.forEach((item) => {
            let words = item.words.find(word);
            if (words) {
                results = results.concat(words);
            }
        });
        return results;
    }
}

/**
 * Parses a document to create a trie for the document.
 *
 * @param {TextDocument} document
 */
function parseDocument(document: TextDocument) {
    const trie = new Trie({ enableCache: false });
    // TODO(atjain): Can use a web worker here if needed.
    for (let i = 0; i < Math.min(MAX_LINES, document.lineCount); ++i) {
        const line = document.lineAt(i);
        const text = line.text;
        // TODO(atjain): Add option for whitespace splitter
        const words = text.split(WHITESPACE_SPLITTER);
        words.forEach((word) => {
            addWord(word, trie, document.fileName);
        });
    }
    wordList.push({
        document: document,
        words: trie
    });
}

function addWord(word, trie, fileName) {
    if (word.length >= MIN_WORD_LENGTH) {
        let item = trie.find(word);
        if (item && item[0]) {
            item = item[0];
        }
        if (item && item.label === word) {
            item.count++
        } else {
            item = new CompletionItem(word, fileName);
            trie.add(word, item);
        }
    }
}

function removeWord(word, trie) {
    if (word.length >= MIN_WORD_LENGTH) {
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

class ActiveDocManager {
    static _activeDoc: TextDocument;
    static activeText: string[];
    static activeIndex: any;
    static _transaction = false;
    static setActiveDoc(doc: TextDocument) {
        ActiveDocManager._activeDoc = doc;
        let i = -1;
        wordList.some((item, index) => {
            if (item.document === doc) {
                i = index;
                return true;
            }
        });
        ActiveDocManager.activeIndex = wordList[i];
        if (doc) {
            ActiveDocManager.activeText = doc.getText().split(doc.eol === vscode.EndOfLine.LF ? "\n" : "\r\n");
        }
    }

    static beginTransaction() {
        ActiveDocManager._transaction = true;
    }

    static endTransaction() {
        ActiveDocManager._transaction = false;
        const doc = ActiveDocManager._activeDoc;
        ActiveDocManager.activeText = doc.getText().split(doc.eol === vscode.EndOfLine.LF ? "\n" : "\r\n");
    }

    static replace(r: Range, newText: string): any {
        // Find old text
        let doc = ActiveDocManager.activeText;
        console.log(ActiveDocManager._activeDoc.lineAt(r.start.line).text);
        let line:string = doc[r.start.line] || "";
        //let startChar = line.substr(0, r.start.character);
        // Get the closest space to the left and right;
        let start: number;
        for (start = r.start.character; start > 0; --start) {
            if ((line[start] || "").match(WHITESPACE_SPLITTER)) {
                start = start + 1;
                break;
            }
        }
        // start is the actual start wordIndex
        let end: number;
        let nLine = doc[r.end.line];
        for (end = r.end.character; end < nLine.length; ++end) {
            if ((nLine[end] || "").match(/\s/)) {
                end = end;
                break;
            }
        }
        // end is the actual end wordIndex
        let oldText, nwText;
        if (r.isSingleLine) {
            oldText = line.substring(start, end);
        } else {
            let oldText = nLine.substring(start);
            for (let i = r.start.line + 1; i < r.end.line; ++i) {
                oldText += "\n" + doc[line];
            }
            oldText += nLine.substring(0, end);
        }
        nwText = line.substring(start, r.start.character) + newText + nLine.substring(end, r.end.character);
        if (!ActiveDocManager._transaction) {
            // Since we do not have a transaction lets do the changes now.
            if (r.isSingleLine) {
                // newText can have a newline character
                doc[r.start.line] = line.substring(0, r.start.character) + newText + nLine.substring(r.end.character);
            }
        }
        return {
            old: oldText.split(WHITESPACE_SPLITTER),
            new: nwText.split(WHITESPACE_SPLITTER)
        };
    }
    static handleContextChange(e: TextDocumentChangeEvent) {
        let changes = e.contentChanges;
        let doc = e.document;
        if (!ActiveDocManager.activeIndex) {
            console.log("No index found");
            return;
        }
        if (doc !== ActiveDocManager._activeDoc) {
            console.log("Unexpected Active Doc. Parsing broken");
            return;
        }
        if (changes.length > 1) {
            ActiveDocManager.beginTransaction();
        }
        changes.forEach((change) => {
            let diff = ActiveDocManager.replace(change.range, change.text);
            diff.old.forEach((string) => {
                removeWord(string, ActiveDocManager.activeIndex.words);
            });
            diff.new.forEach((string) => {
                addWord(string, ActiveDocManager.activeIndex.words, doc.fileName);
            })
        });
        if (changes.length > 1) {
            ActiveDocManager.endTransaction();
        }
    }
}

function attachActiveDocListener() {
    window.onDidChangeActiveTextEditor((newDoc: TextEditor) => {
        ActiveDocManager.setActiveDoc(newDoc.document);
    });
    ActiveDocManager.setActiveDoc(window.activeTextEditor ? window.activeTextEditor.document: null)
}

/**
 * Removes the document from the list of indexed documents.
 *
 * @param {TextDocument} document
 */
function clearDocument(document: TextDocument) {
    let i = -1;
    wordList.some((item, index) => {
        if (item.document === document) {
            i = index;
            return true;
        }
    });
    wordList = wordList.splice(i, 1);
}

/**
 * On extension activation register the autocomplete handler.
 *
 * @export
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: vscode.ExtensionContext) {
    const triggerCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
    vscode.languages.registerCompletionItemProvider('*', provider, ...triggerCharacters)

    workspace.onDidOpenTextDocument((document: TextDocument) => {
        parseDocument(document);
    });

    workspace.onDidCloseTextDocument((document: TextDocument) => {
        clearDocument(document);
    });

    // TODO(atjain); Apply diff on change
    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
        ActiveDocManager.handleContextChange(e);
    });

    // workspace.onDidSaveTextDocument((document: TextDocument) => {
    //     // Optimize this
    //     clearDocument(document);
    //     parseDocument(document);
    // });

    for (let i = 0; i < workspace.textDocuments.length; ++i) {
        // Parse all words in this document
        // All open editors are not available: https://github.com/Microsoft/vscode/issues/15178

        parseDocument(workspace.textDocuments[i]);
    }

    if (APPLY_OPEN_DOCS_HACK) {
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
    wordList = [];
}
