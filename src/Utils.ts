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
    if (Settings.buildInFilesToExclude.indexOf(file) !== -1) {
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
    if (!vscode.workspace.rootPath) { return filePath; }
    if (filePath.indexOf(path.sep) === -1) { return filePath; }
    return path.relative(vscode.workspace.rootPath, filePath);
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

// Copied from https://github.com/Microsoft/vscode/blob/0287c3cb40e4e8304f4c791cb2ef7a14a4630f4b/src/vs/base/common/labels.ts#L84
// Keeps the same logic

function endsWith(haystack: string, needle: string): boolean {
    let diff = haystack.length - needle.length;
    if (diff > 0) {
        return haystack.lastIndexOf(needle) === diff;
    } else if (diff === 0) {
        return haystack === needle;
    } else {
        return false;
    }
}
const ellipsis = '\u2026';
const unc = '\\\\';
const nativeSep = process.platform === 'win32' ? '\\' : '/';
export function shorten(paths: string[]): string[] {
    let shortenedPaths: string[] = new Array(paths.length);

    // for every path
    let match = false;
    for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        let path = paths[pathIndex];

        if (path === '') {
            shortenedPaths[pathIndex] = `.${nativeSep}`;
            continue;
        }

        if (!path) {
            shortenedPaths[pathIndex] = path;
            continue;
        }

        match = true;

        // trim for now and concatenate unc path (e.g. \\network) or root path (/etc) later
        let prefix = '';
        if (path.indexOf(unc) === 0) {
            prefix = path.substr(0, path.indexOf(unc) + unc.length);
            path = path.substr(path.indexOf(unc) + unc.length);
        } else if (path.indexOf(nativeSep) === 0) {
            prefix = path.substr(0, path.indexOf(nativeSep) + nativeSep.length);
            path = path.substr(path.indexOf(nativeSep) + nativeSep.length);
        }

        // pick the first shortest subpath found
        const segments: string[] = path.split(nativeSep);
        for (let subpathLength = 1; match && subpathLength <= segments.length; subpathLength++) {
            for (let start = segments.length - subpathLength; match && start >= 0; start--) {
                match = false;
                let subpath = segments.slice(start, start + subpathLength).join(nativeSep);

                // that is unique to any other path
                for (let otherPathIndex = 0; !match && otherPathIndex < paths.length; otherPathIndex++) {

                    // suffix subpath treated specially as we consider no match 'x' and 'x/...'
                    if (otherPathIndex !== pathIndex && paths[otherPathIndex] && paths[otherPathIndex].indexOf(subpath) > -1) {
                        const isSubpathEnding: boolean = (start + subpathLength === segments.length);

                        // Adding separator as prefix for subpath, such that 'endsWith(src, trgt)' considers subpath as directory name instead of plain string.
                        // prefix is not added when either subpath is root directory or path[otherPathIndex] does not have multiple directories.
                        const subpathWithSep: string = (start > 0 && paths[otherPathIndex].indexOf(nativeSep) > -1) ? nativeSep + subpath : subpath;
                        const isOtherPathEnding: boolean = endsWith(paths[otherPathIndex], subpathWithSep);

                        match = !isSubpathEnding || isOtherPathEnding;
                    }
                }

                // found unique subpath
                if (!match) {
                    let result = '';

                    // preserve disk drive or root prefix
                    if (endsWith(segments[0], ':') || prefix !== '') {
                        if (start === 1) {
                            // extend subpath to include disk drive prefix
                            start = 0;
                            subpathLength++;
                            subpath = segments[0] + nativeSep + subpath;
                        }

                        if (start > 0) {
                            result = segments[0] + nativeSep;
                        }

                        result = prefix + result;
                    }

                    // add ellipsis at the beginning if neeeded
                    if (start > 0) {
                        result = result + ellipsis + nativeSep;
                    }

                    result = result + subpath;

                    // add ellipsis at the end if needed
                    if (start + subpathLength < segments.length) {
                        result = result + nativeSep + ellipsis;
                    }

                    shortenedPaths[pathIndex] = result;
                }
            }
        }

        if (match) {
            shortenedPaths[pathIndex] = path; // use full path if no unique subpaths found
        }
    }

    shortenedPaths = shortenedPaths.map((path) => path + nativeSep);

    return shortenedPaths;
}
