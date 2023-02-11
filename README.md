# VSCode All Autocomplete

[![](https://raw.githubusercontent.com/atishay/vscode-allautocomplete/master/images/icon.png)](https://marketplace.visualstudio.com/items?itemName=Atishay-Jain.All-Autocomplete)

* [View on VS Marketplace](https://marketplace.visualstudio.com/items?itemName=Atishay-Jain.All-Autocomplete) 
* [View Source](https://github.com/atishay/vscode-allautocomplete)

Provides autocompletion in [Visual Studio Code](https://github.com/Microsoft/vscode) items based on all open editors.

## Features

![](https://cdn.rawgit.com/atishay/vscode-allautocomplete/1ea2b07b/images/All-Autocomplete.gif)

## Native VSCode

Use `editor.wordBasedSuggestionsMode` setting and set this to `allDocuments` to have VSCode to support most of this natively.

## Items in the Cmd+P Menu

* `Toggle Suggestions From The Current File`

## Extension Settings

This extension has the following settings:

* `AllAutocomplete.minWordLength`: Minimum word length to keep in autocomplete list.
* `AllAutocomplete.maxLines`: Maximum number of lines to read from a file.
* `AllAutocomplete.maxItemsInSingleList`: Maximum number of items sent to autocomplete in a single API call (Autocomplete might not complete more items than this in a call).
* `AllAutocomplete.whitespace`: Regex to use for splitting whitespace.
* `AllAutocomplete.showCurrentDocument`: Show results from the current document in the autocomplete results.
* `AllAutocomplete.ignoredWords`: Words to ignore(separated by AllAutocomplete.whitespace) from autocomplete.
* `AllAutocomplete.updateOnlyOnSave`: Do not update the autocomplete list unless the document is saved.
* `AllAutocomplete.excludeFiles`: Glob pattern for files to exclude from autocomplete search.
* `AllAutocomplete.languageWhitespace`: Regex for splitting whitespace (Language specific). Specify as a map with a language ID and regex.
* `AllAutocomplete.languageSpecialCharacters`: Regex for finding special characters that languages treat differently in autocomplete. For example, `.` in CSS.
* `AllAutocomplete.wordListFiles`: Array of strings that represent path to files that behave as if they are always open. These can be used as stores for headers, word lists etc. for autocomplete. Absolute paths can be used here or relative paths to the folder(s) which form the workspace root.
* `AllAutocomplete.nonContributingLanguages` List of languages that do not contribute words but can consume words from the autocomplete list.
* `AllAutocomplete.nonContributingToSelfLanguages` List of languages that do not supply word lists to the files of the same language but can consume words from All Autocomplete as well as supply word lists to other files.
* `AllAutocomplete.dontContributeToSelf` Disables supplying word lists to files of the same language. Equivalent to putting all languages in `AllAutocomplete.nonContributingToSelfLanguages`.

## Suggestions in comments/strings
* Autocomplete can provide suggestions within suggestions/strings. To get those, please enable the following settings:
```
  // Controls whether suggestions should automatically show up while typing.
  "editor.quickSuggestions": {
    "other": true,
    "comments": true,
    "strings": true
  }
 ```

## Needs Suggestions

If you feel that the whitespace splitter is wrong in some language, please report a github issue or better a pull request with the correct regex in package.json.

## Known Issues

### Emmet collision

The emmet plugin takes over the special character `#` in CSS and therefore that cannot be auto-completed.

## Performance Impact

### CPU

* When using real-time mode by setting `AllAutocomplete.showCurrentDocument` = `true`, the plugin tries to update the index on each addition/deletion.
* When `AllAutocomplete.showCurrentDocument` = `false`, the index updates itself on each change to focussed editor.
* When `AllAutocomplete.updateOnlyOnSave` = `true`, the index is updated only on save and open/close of documents.

### RAM

* `AllAutocomplete.maxItemsInSingleList` controls the number of items populating the autocomplete list.
* `AllAutocomplete.maxLines` control the number of lines to read in a document. Longer documents can be ignored.

**Enjoy!**
