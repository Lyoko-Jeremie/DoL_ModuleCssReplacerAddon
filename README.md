
# ModuleCssReplacer

---

this mod export addon:

`ModuleCssReplacer` : `ModuleCssReplacerAddon`

```json lines
{
  "addonPlugin": [
    {
      "modName": "ModuleCssReplacer",
      "addonName": "ModuleCssReplacerAddon",
      "modVersion": "^1.0.0",
      "params": [
        {
          // the css file name
          // if the css you want to modify is : "modules/css/clock.css"
          // you need fill this to : "clock"
          "cssName": "",
          // find string, string/regex
          "findString": "",
          "findRegex": "",
          // replace content, string/filePathInZip
          "replace": "",
          "replaceFile": "",
          // When setting debug to true, the replacement operation corresponding to this parameter will be output to the Console.
          "debug": true,
          // if you want to replace all, set this to true, otherwise only replace the first one.
          "all": true
        },
      ]
    }
  ],
  "dependenceInfo": [
    {
      "modName": "ModuleCssReplacer",
      "version": "^1.0.0"
    }
  ]
}
```
