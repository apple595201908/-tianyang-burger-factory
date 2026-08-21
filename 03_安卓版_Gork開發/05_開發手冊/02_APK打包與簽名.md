# APK 打包與簽名

適用：Tianyang-Burger-Factory-HD-Xiaomi-Pad-Mini-v1.1.7-角色動作額外.apk
底包：原版 v1.1.7（只當資源底，不回寫原版資料夾）

Android 11 以上（含小米平板）會驗 ZIP flag_bits、zipalign、以及 v2 v3 簽名。只用 jarsigner 會顯示「應用程式套件無效」。

資產對照：assets/www/index.html 來自 android-svg/index.html；styles.css 同源；game.js 由 android-svg/src/game.ts 編譬；audio/alarm.wav 為新做警鈴；其余沿用原版；META-INF 重簽時整段重寫。

編譬：npx tsc --target ES2017 --outFile www/game.js android-svg/src/game.ts，並複製 index.html 與 styles.css。安卓音效路徑用相對 ./audio/，不要用網頁的 /audio/。

重打 ZIP：略過 META-INF；html css js 用 deflate；flag_bits = 0 不要 data descriptor；stored 條目補 4-byte extra 對齊；檔名 UTF-8 但不要亂開 UTF-8 general flag。

簽名：java -jar uber-apk-signer-1.3.0.jar --apks extras-unsigned.apk --ks tianyang-hd-preview.keystore --ksAlias tianyanghd --ksPass android --ksKeyPass android --out signed/

安裝：先卸載原版或舊額外包，允許未知來源，再裝額外包。進遊戲確認角色會動、點擊即時、失誤警鈴、結算鈴聲停。

驗包：game.js 含 ACTION_FILL_CLEAR、stopAlarm、layoutFactoryDressing；index.html 含 steam-layer、player-signal、belt-sheen；audio/alarm.wav 存在；有 v2 v3 簽名。

常見失敗：應用程式套件無效→重打 zip 加 uber-apk-signer；與現有應用程式衝突→先卸載；沒警鈴→補 alarm.wav；點了沒反應→確認 game.js 是新編譬。