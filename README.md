
# ModuleCssReplacer

---

如非必须，尽量不要使用这个 mod ，因为游戏本身的设计原因，再加上浏览器本身工作原理的的设计缺陷，使用这个mod会导致触发css重排，导致性能急剧下降。

https://github.com/Eltirosto/Degrees-of-Lewdity-Chinese-Localization/issues/203

如果可以的话，请尽可能使用css “层叠样式表” 的 “层叠” 特性，来覆盖游戏原有的css样式。  
例如可以用更加精确的css选择器来选择要修改的元素，以便以比原有游戏css更高的优先级来修改样式。  
或者可以通过在css中使用 `!important` 来覆盖原有的css样式，（但这样会造成其他问题，不推荐这么做）。   

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
