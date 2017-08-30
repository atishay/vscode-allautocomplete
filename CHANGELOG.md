# Change Log
### 0.0.10
* Add support for language specific auto completions. You can now specify word splitters based on the language.

### 0.0.9
* Remove rootPath API for multi-project workflows.
* Allow -, _ and $ to be a part of the words.
* Updated readme about markdown support (#6)

### 0.0.8
* Show usage count in the details per file.
* Using higher level APIs for better performance.
* Fix glob pattern for exclusion.

### 0.0.7
* Fix for a bug introduced in 0.0.5 where all words were not showing up due to autocomplete not being called for new characters typed.

### 0.0.6
* Fix a bug where incomplete word results show up in parallel to the complete word results.

### 0.0.5
* Remove trigger characters to allow other autocomplete results to show up.

### 0.0.4
* Fix a bug which causes items in the middle of brackets to not show up.
* Fix the default value of whitespace regex.
* Fix an issue where autocomplete would show up the current word if in the middle of editing a word.

### 0.0.3
* Added optimization for the special case of normal typing.
* Remove some vscode specific files from showing up.
* Fix a bug where autocomplete was not working inside the if statement.

### 0.0.2
* Update description and icon.

### 0.0.1
* Initial Release. Supports autocomplete based on all open files with real time updates.
