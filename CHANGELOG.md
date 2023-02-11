# Change Log
### 0.0.26
* Add support for VSCode web
### 0.0.25
* Better support for Accént Characters.
### 0.0.24
* Update dependencies.
* Fix warnings.
* Remove the cycle editors hack as the API is now available.
* Remove rootPath from `wordListFiles`.

### 0.0.23
* Update the build system to webpack.
### 0.0.22
* Add support for `AllAutocomplete.nonContributingLanguages` for excluding certain languages from contributing words.
* Add support for `AllAutocomplete.nonContributingToSelfLanguages` for having languages that provide autocomplete words to all languages apart from their own documents. The default list is empty. Requesting the community try out this feature.
* Add support for `AllAutocomplete.dontContributeToSelf` to disable self contribution completely.
### 0.0.21
* Update dependencies.
* Add `YAML` and `Plain Text` to autocompleted languages
### 0.0.20
* Fix installation issues.

### 0.0.19
* Update dependencies

### 0.0.18
* Update dependencies.
* Add settings for CSV

### 0.0.17
* Add option showOpenDocuments which allows disabling autocomplete items from other open documents (#24)

### 0.0.16
* Fix issues in PHP and ELM related to case sensitivity.

### 0.0.15
* Fix memory issues (#20) by removing `>` and `.` characters from PHP autocompletion.

### 0.0.14
* Fix memory increase (#20)
* Remove vulnerable dependencies
* Fix arrow characters in C++

### 0.0.13
* Add support for using the filename in autocomplete.
* Fix issues in PHP. (#18)
* Add support for giving all word definitions if no word is found eg in case of '.' and other such special characters.

### 0.0.12
* Add support Unicode variable names/words.
* Added support for specifying a set of wordlist files from where the words could be taken for autocomplete.
* Added a hack for the broken getWordRangeAtPosition API in ELM language server.
* Bug fixes

### 0.0.11
* Add support for language specific special characters like "." which are needed in CSS autocompletions.
* Bug fixes

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
