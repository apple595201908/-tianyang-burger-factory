# 《天陽的漢堡工廠》Android SVG/DOM HD

版本：`1.1.6-reaction-layout-refill-fix`  
套件名稱：`com.tianyang.burgerfactory`  
最低系統：Android 7.0（API 24）  
目標系統：Android API 35

## 1. 目標

Android HD 版解決高 DPI 手機上低解析畫布被放大後的模糊問題。它不使用 Phaser Renderer，也不建立 Canvas；遊戲中的角色、漢堡、輸送帶、站點、特效、文字和 HUD 全部由 SVG 或 HTML/CSS 繪製，會依裝置尺寸重新排版並由 WebView 以螢幕原生密度光柵化。

兩張工廠背景仍使用方向專用 HD WebP：

- 直式：`1872 × 3328`
- 橫式：`3328 × 1872`

背景是高解析點陣圖，互動物件與文字則是無固定像素尺寸的向量節點。

## 2. 不可破壞的玩法契約

| 狀況 | 操作 | 結果 |
|---|---|---|
| 完整漢堡 | 點螢幕左半邊 | FINISH，品管站計分 |
| 缺料漢堡 | 點螢幕右半邊 | RETURN，整條產線回捲 |
| 完整漢堡按右 | 錯誤 | Game Over |
| 缺料漢堡按左 | 錯誤 | Game Over |
| 未處理漢堡越過最右品管員 | 無操作 | Game Over |

RETURN 期間：

- 所有仍在產線上的漢堡套用完全相同的 X 位移。
- 回捲速度等於當下正轉速度，只改變方向。
- 暫停生成、Deadline 與其他輸入判定。
- 已通過玩家站的完整漢堡隱藏，但仍在真正到達品管站時記分。
- 配料員漏補機率隨分數提高；同一顆最多連漏兩次。

## 3. 架構

```text
android-svg/
  index.html             SVG Scene Graph、HUD、選單與 Overlay
  styles.css             響應式向量美術、Safe Area 與動畫
  src/game.ts            無 Phaser 的完整遊戲 Runtime

android/
  app/src/main/
    AndroidManifest.xml  離線、全螢幕、雙方向 Activity
    java/.../MainActivity.java
                         本地 WebView 殼與 Lifecycle
    res/                 App 名稱、主題與 Icon
    assets/www/          Build 時產生的離線遊戲包

scripts/
  build-android-assets.sh
                         編譯 TypeScript、複製背景／音訊並拒絕 Canvas
  build-android-apk.sh   aapt2 → javac → d8 → zipalign → apksigner
```

Web V1 與 Android HD Runtime 彼此獨立，避免更換 Renderer 時破壞已上線的 Phaser 版本。兩者共用相同的數值與核心玩法契約。

## 4. 解析度策略

SVG Stage 的 `viewBox` 永遠等於目前 WebView 的 CSS 尺寸，旋轉或 Resize 時重新計算四個工作站、輸送帶、食品與 Deadline。SVG path、shape 和文字不保存成低解析畫布，因此沒有固定 1×、2× 或 3× backing buffer，也不需要 600 萬 Canvas 像素預算。

視覺 Scale 以短邊為基準並限制在合理範圍；Gameplay 速度、食品寬度與 205 基準間距使用同一個 Motion Scale，確保不同尺寸的操作時間與密度一致。

## 5. 音訊與離線

APK 內含：

- 30 秒循環 BGM
- FINISH
- RETURN
- APPROVED
- SPEED UP
- FAIL
- BUTTON

所有音訊由 `HTMLAudioElement` 從 `android_asset` 相對路徑載入。第一次點擊開始按鈕後解鎖播放；進入背景會暫停，回到遊戲由玩家按「繼續」恢復。Manifest 不含 `android.permission.INTERNET`，因此安裝後可完全離線遊玩。

## 6. Build

需要：

- Node.js 22.13+
- JDK 17
- Android SDK Platform 35
- Android Build Tools 35.0.0

先驗證向量資產：

```bash
npm run test:android
```

建立 APK：

```bash
npm run build:android:apk
```

輸出：

```text
outputs/Tianyang-Burger-Factory-HD-Xiaomi-Pad-Mini-v1.1.6.apk
```

Build Script 會執行：

1. 編譯 `android-svg/src/game.ts`。
2. 搜尋並拒絕任何 Canvas 建立語法。
3. 複製 HTML、CSS、HD 背景、Icon、BGM 與 SFX。
4. 使用 `aapt2` 編譯資源並封裝 Asset。
5. 使用 `javac` 編譯原生 Activity。
6. 使用 `d8` 產生 `classes.dex`。
7. 使用 `zipalign` 對齊 APK。
8. 使用 `apksigner` 產生 v2／v3 簽章並驗證。

## 7. 簽章邊界

目前交付檔使用本機產生的 Preview Key 簽署，可直接側載安裝與真機測試。Key 位於被 Git 忽略的 `outputs/.signing/`，不會進入 Repository。

若要上架 Google Play，必須另外建立正式且安全備份的 Release／Upload Key，並以正式版本號重新簽署；不可把 Preview Key 當成商店正式簽章。

## 8. 安裝與驗收

只安裝自己保存、且雜湊值與交付紀錄一致的 APK。Android 若要求允許目前檔案管理器安裝未知 App，可只對該來源暫時授權，安裝完成後再關閉。

最低驗收：

- 主選單與中文文字邊緣清楚。
- 第一次教學必須實際完成左、右各一次。
- 左上／左中／左下皆為 FINISH。
- 右上／右中／右下皆為 RETURN。
- 回捲速度與前進速度一致，全部漢堡保持等距。
- 回捲期間玩家站右側完成品不可造成誤判。
- 旋轉後不 Reload、不交換左右操作。
- BGM、六種 SFX、靜音與背景暫停正常。
- 關閉網路後仍可完整遊玩、Retry 與保存最高分。

## 9. 自動驗證

`tests/android-hd.test.mjs` 驗證：

- HTML 使用 SVG Stage。
- Source 與 Build Asset 不含 Canvas 建立行為。
- Runtime 不依賴 Phaser。
- 左右 Split、全線同距回捲、最多漏補兩次與 Deadline 邏輯仍存在。
- Native Shell 僅載入本地 Asset，Manifest 無網路權限。
- HD 背景、BGM 與關鍵 SFX 均已封裝。

產出 APK 後還要通過：

- `apksigner verify --verbose`
- `aapt dump badging`
- ZIP 完整性檢查
- APK Asset 清單檢查

## 10. Xiaomi Pad Mini 8.8 吋專用適配

V1.1.2 針對 Xiaomi Pad Mini WiFi 修正專用 Display Profile。官方面板規格為 8.8 吋、3008 × 1880、16:10、403 PPI，最高 165Hz。

Runtime 會以型號字串 `Xiaomi Pad Mini`／`25079RPDCG` 或接近 3008 × 1880 的實體像素尺寸辨識裝置，辨識成功後套用：

- 3K Pad Mini 專屬 Profile 標記。
- 同時使用寬、高兩軸計算 UI Scale，與網頁版相同的參考比例，避免只看短邊造成整體過度放大。
- 人物、漢堡、移動速度分開縮放；漢堡約維持 136 CSS px，不再擠滿輸送帶。
- 四個工作站在安全左右邊界間三等分；橫式使用 8%、36%、64%、92%，直式使用 9%、36.33%、63.67%、91%，三段距離完全一致。
- 輸送帶高度使用 `72 × UI Scale`，橫式位於 61%、直式位於 56% 高度。
- 漢堡間距至少大於完整 Action Window，避免大畫面同時出現兩顆可誤判目標。
- 62px 等級 HUD 按鈕、放大分數、教學 Cue 與左右操作標籤。
- 直式與橫式 Resize 仍維持左 FINISH、右 RETURN，不重新載入遊戲。

## 11. V1.1.2 顯示修復

- 選單模式會完全隱藏 SVG Gameplay Stage，人物與輸送帶不再穿透選單造成重疊。
- 漢堡不再使用 `SVGElement.innerHTML`，改用 `createElementNS` 建立每個向量節點，避免部分 Android WebView 無法生成漢堡。
- 食品位置層與縮放動畫層分離，動畫不會覆蓋漢堡的 X／Y Transform。
- 原生 WebView 在進入沉浸式全螢幕後主動派發 Resize，避免系統列收合後仍沿用舊比例。
- 新增 `android-svg/qa.html`，可同時檢查 Pad Mini 的 1203 × 752 橫式與 752 × 1203 直式 CSS Viewport。

一般 Android 手機仍使用原本的手機 Scale；其他大於 600 CSS px 短邊的平板會使用通用 Tablet Profile。

## 12. V1.1.3 啟動穩定性修復

- 移除 Xiaomi／HyperOS 上可能在 Activity 建立階段觸發 OEM 相容性問題的直接 `WindowInsetsController` 與 `setDecorFitsSystemWindows` 路徑。
- 不再強制 WebView 使用硬體 Layer；第一輪使用系統預設合成策略，只有 Renderer 異常時才以軟體 Layer 重試一次。
- WebView 建立與設定由 `try/catch` 保護；初始化失敗會留在 App 內顯示可重試訊息，不再直接結束 Activity。
- Android 8 以上處理 `onRenderProcessGone`，Renderer 異常時最多自動重建一次，並回傳已處理以阻止系統終止 App。
- Pause、Resume、Resize 與 WebView 銷毀流程全部改成非致命處理，避免 Renderer 已退出時再次觸發 Lifecycle 崩潰。
- 仍保留舊版已驗證可啟動的 Legacy Immersive Flags，並在 Page Finished 與 Window Focus 後重新派發 Resize。

啟動驗收除了原有畫面與玩法項目，還必須確認：冷啟動、返回桌面再進入、旋轉後恢復及 WebView Renderer 復原都不會讓 Activity 閃退。

## 13. V1.1.4 漢堡狀態與視覺契約修復

Android 食品視覺現在逐狀態對齊 Web V1：

| Gameplay 狀態 | 可見圖層 | 玩家意義 |
|---|---|---|
| `spawned` | 底座 | 尚未進入配料流程 |
| `base-only` | 只有底座 | 經配料站後仍缺料時按右退回 |
| `filled` | 底座＋內餡，沒有上層麵包 | 內餡完整，按左封蓋 |
| `capped` | 底座＋內餡＋上層麵包 | 已完成，等待品管計分 |
| `returning` | 缺料底座 | 整線等速退回 |
| `rework` | 底座＋內餡補入動畫，沒有上層麵包 | 配料員正在補料 |

圖層由 `BURGER_VISUAL_CONTRACT` 單一決定，CSS 不再直接用 `base-only` 等 Gameplay 類名猜測素材顯示。`FOOD_STATE_TRANSITIONS` 同時限制合法路徑，工作站的 `baseProcessed`／`ingredientProcessed` 旗標只會由 `false` 變 `true`；RETURN 期間只執行回捲狀態機，不會再次觸發正向工作站或重新抽初次缺料。

自動測試會執行 APK 實際使用的編譯後 JavaScript，驗證六個狀態的組裝層級、合法轉換表與 CSS 圖層選擇器。正式教學也明確說明「有完整內餡、沒有上層麵包」才需要點左封蓋。

## 14. V1.1.5 固定間距、教學提示與補料流暢度修復

Android 的生成器改為與 Web V1 `SpawnManager` 相同的距離格點：正式開局的第一顆漢堡會把生成進度歸零；每幀跨過生成距離時保留 Overflow，並把新漢堡放在 `spawnX + overflow`。整線退回會從生成進度扣除完整回捲距離，允許進度暫時為負數，不再截斷為零；恢復正轉後必須補回同樣距離才會生成下一顆。旋轉或 Resize 時，既有漢堡和生成進度一起依新舊 Gap 比例換算。

紅色虛線圈現在只由 `food.tutorial` 與缺料教學狀態共同控制。正式遊戲的 `base-only`、`returning` 和 `rework` 不會顯示紅圈，玩家仍以漢堡實際缺少內餡的輪廓判斷。

補料階段移除跟著漢堡移動的 SVG Glow Filter，隱藏的下游成品不再執行每幀 DOM Transform。配料出現使用只改變 `transform` 與 `opacity` 的 210 ms 動畫；進入補料站時輸送帶視覺會停住，完成後才恢復正轉。單幀移動上限改為 1／30 秒，降低 Android WebView 偶發長幀造成的明顯跳動。

自動回歸測試會使用多組不同幀距離、整線退回與再次正轉，逐次驗證所有相鄰漢堡仍落在同一固定 Gap 格點；並檢查正式遊戲沒有紅圈、補料食品不使用移動式 SVG Filter。

## 15. V1.1.6 失誤反應、等距站位與偷懶補料修復

四位員工不再各自使用手寫比例，而是由方向安全邊界計算共同間距。橫式從 8% 到 92%、直式從 9% 到 91%，中間兩站以三等分取得，因此麵包站、配料站、玩家站與品管站的三段距離一致。Deadline 仍位於品管員右側，食品 Gap 會依新的完整 Action Window 自動放大，避免兩顆漢堡同時落入可操作範圍。

正式遊戲失誤後先進入 `failing` 狀態並停止產線。左側麵包員與配料員的頭部轉向右方，右側品管員轉向左方；玩家角色先縮身、再膨脹，臉部漲紅並出現尷尬表情。反應動畫約 1.2 秒後才進入 `gameover` 並顯示結算 Overlay。偏好減少動態效果的裝置會縮短等待時間，Retry、主選單與重新教學都會清除未完成的動畫計時器。

補料結果改為在缺料漢堡抵達配料站的同一幀決定。只有確定成功補料的食品會取得 `rework-success` 類別並顯示內餡進場動畫；配料員偷懶時，整個停留階段都維持底座外觀，完成等待後仍回到 `base-only`，不會短暫閃出第二層配料。抽選結果只決定一次，`completeReturn()` 不會重新抽取。

自動測試另驗證四站在直式／橫式皆等距、失誤動畫完成前 Game Over 不可見、三位同事朝玩家轉頭、玩家尷尬反應存在，以及偷懶補料全程不得取得配料顯示類別。
