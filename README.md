# VSCode All Autocomplete
[![](http://vsmarketplacebadge.apphb.com/version/Atishay-Jain.All-Autocomplete.svg)](https://marketplace.visualstudio.com/items?itemName=Atishay-Jain.All-Autocomplete)

Provides autocompletion in [Visual Studio Code](https://github.com/Microsoft/vscode) items based on all open editors.

## Features

![](https://cdn.rawgit.com/atishay/vscode-allautocomplete/1ea2b07b/images/All-Autocomplete.gif)

## Items in the Cmd+P Menu
* `Toggle Suggestions From The Current File`
* `Cycle Open Editors`

## Extension Settings

This extension has the following settings:

* `AllAutocomplete.minWordLength`: Minimum word length to keep in autocomplete list.
* `AllAutocomplete.maxLines`: Maximum number of lines to read from a file.
* `AllAutocomplete.whitespace`: Regex to use for splitting whitespace.
* `AllAutocomplete.cycleOpenDocumentsOnLaunch`: Cycles through open documents on launch to enable autocomplete to include those documents on restore.
* `AllAutocomplete.showCurrentDocument`: Show results from the current document in the autocomplete results.
* `AllAutocomplete.ignoredWords`: Words to ignore(separated by AllAutocomplete.whitespace) from autocomplete.
* `AllAutocomplete.updateOnlyOnSave`: Do not update the autocomplete list unless the document is saved.
* `AllAutocomplete.excludeFiles`: Glob pattern for files to exclude from autocomplete search.
* `AllAutocomplete.languageWhitespace`: Regex for splitting whitespace (Language specific). Specify as a map with a language ID and regex.

## Known Issues

### Markdown support
To enable autocomplete to work with markdown files, please enable it in settings:
```
"[markdown]": {
    "editor.quickSuggestions": true
}
```

### Documents do not show up in autocomplete on restore.

Upon restoring Visual Studio, the documents that have never been opened do not appear in autocomplete. ([VSCode Issue#15178](https://github.com/Microsoft/vscode/issues/15178))

Click on open tabs to enable them in the document. Alternatively, you can use the Cmd+P menu and select `Cycle Open Editors`. You can enable this to be done on launch with `AllAutocomplete.cycleOpenDocumentsOnLaunch`.

## Performance Impact
* When using real-time mode by setting `AllAutocomplete.showCurrentDocument` = `true`, the plugin tries to update the index on each addition/deletion.
* When `AllAutocomplete.showCurrentDocument` = `false`, the index updates itself on each change to focussed editor.
* When `AllAutocomplete.updateOnlyOnSave` = `true`, the index is updated only on save and open/close of documents.

## TODO
* Support open file names in word completion.
* Support completion of the license header.

**Enjoy!**
