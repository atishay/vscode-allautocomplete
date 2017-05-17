'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Trie from 'triejs';
import * as path from 'path';
import { TextDocument, Position, workspace, TextDocumentChangeEvent, Range, TextEditor, window } from "vscode";

// https://github.com/Microsoft/vscode/issues/12115

const MIN_WORD_LENGTH = 3;
const MAX_LINES = 9999;
const WHITESPACE_SPLITTER = /[^\w+]/g;
const APPLY_OPEN_DOCS_HACK = true;
const SHOW_CURRENT_DOCUMENT = false;
const EXCLUDE_FROM_COMPLETION = [".git"];
const PERFORM_LIVE_UPDATE = true;
const IGNORE_LIST = [];
const TRIGGER_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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
        this.detail = `${path.basename(file)}`;
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
        let word = document.getText(new Range(pos, position));
        word = word.replace(WHITESPACE_SPLITTER, '');
        let results = [];
        wordList.forEach((trie, doc) => {
            if (!SHOW_CURRENT_DOCUMENT) {
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
    if (EXCLUDE_FROM_COMPLETION.indexOf(path.extname(document.fileName)) !== -1) {
        return;
    }
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
    word = word.replace(WHITESPACE_SPLITTER, '');
    if (IGNORE_LIST.indexOf(word) !== -1) return;
    if (word.length >= MIN_WORD_LENGTH) {
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
function removeWord(word:string, trie) {
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

let content = [];
/**
 * Utility class to manage the active document
 *
 * @class ActiveDocManager
 */
class ActiveDocManager {
    static beginTransaction() { }
    static endTransaction() {
        ActiveDocManager.updateContent();
    }
    static updateContent() {
        content = [];
        let doc = window.activeTextEditor.document;
        if (EXCLUDE_FROM_COMPLETION.indexOf(path.extname(doc.fileName)) !== -1) {
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
    static replace(r: Range, newText: string): any {
        // Find old text
        let line: string = content[r.start.line] || "";
        // Get the closest space to the left and right;

        // Start is the actual start wordIndex
        let start: number;
        for (start = r.start.character; start > 0; --start) {
            if ((line[start] || "").match(WHITESPACE_SPLITTER)) {
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
        const nwText = line.substring(start, r.start.character) + newText + nLine.substring(end, r.end.character);

        return {
            old: oldText.split(WHITESPACE_SPLITTER),
            new: nwText.split(WHITESPACE_SPLITTER)
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
        e.contentChanges.forEach((change) => {
            let diff = ActiveDocManager.replace(change.range, change.text);
            diff.old.forEach((string) => {
                removeWord(string, activeIndex);
            });
            diff.new.forEach((string) => {
                addWord(string, activeIndex, e.document.fileName);
            })
        });
        ActiveDocManager.endTransaction();
    }
}

/**
 * Mark all words when the active document changes.
 */
function attachActiveDocListener() {
    if (PERFORM_LIVE_UPDATE) {
        window.onDidChangeActiveTextEditor((newDoc: TextEditor) => {
            ActiveDocManager.updateContent();
        });
        ActiveDocManager.updateContent();
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
    const triggerCharacters = TRIGGER_CHARACTERS.split('');
    vscode.languages.registerCompletionItemProvider('*', provider, ...triggerCharacters)

    workspace.onDidOpenTextDocument((document: TextDocument) => {
        parseDocument(document);
    });

    workspace.onDidCloseTextDocument((document: TextDocument) => {
        clearDocument(document);
    });

    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
        if (EXCLUDE_FROM_COMPLETION.indexOf(path.extname(e.document.fileName))) {
            return;
        }
        if (PERFORM_LIVE_UPDATE) {
            ActiveDocManager.handleContextChange(e);
        }
    });
    if (!PERFORM_LIVE_UPDATE) {
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
    wordList.clear();
}
