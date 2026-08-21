# 《天陽的漢堡工廠》Android SVG/DOM HD

版本：`1.1.1-pad-mini`  
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
outputs/Tianyang-Burger-Factory-HD-Xiaomi-Pad-Mini-v1.1.1.apk
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

V1.1.1 針對 Xiaomi Pad Mini WiFi 加入專用 Display Profile。官方面板規格為 8.8 吋、3008 × 1880、16:10、403 PPI，最高 165Hz。

Runtime 會以型號字串 `Xiaomi Pad Mini`／`25079RPDCG` 或接近 3008 × 1880 的實體像素尺寸辨識裝置，辨識成功後套用：

- 3K Pad Mini 專屬 Profile 標記。
- 以短邊計算、最高 1.72 的向量 Scene Scale。
- 四個工作站使用 12%、35%、65%、88% 的大畫面位置。
- 橫式輸送帶下移至 65% 高度，保留 HUD 與角色頭部空間。
- 漢堡間距至少大於完整 Action Window，避免大畫面同時出現兩顆可誤判目標。
- 62px 等級 HUD 按鈕、放大分數、教學 Cue 與左右操作標籤。
- 直式與橫式 Resize 仍維持左 FINISH、右 RETURN，不重新載入遊戲。

一般 Android 手機仍使用原本的手機 Scale；其他大於 600 CSS px 短邊的平板會使用通用 Tablet Profile。
