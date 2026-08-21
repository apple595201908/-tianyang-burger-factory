# 《天陽的漢堡工廠》V1 開發文檔

> 正式版本：1.0.0  
> 文件基線：2026-08-21  
> 適用平台：iPhone Safari、Android Chrome、iPad Safari、Desktop Chrome／Edge

## 目錄

- [1. 專案定位](#1-專案定位)
- [2. V1 完成範圍](#2-v1-完成範圍)
- [3. 不可破壞的遊戲契約](#3-不可破壞的遊戲契約)
- [4. 開發環境](#4-開發環境)
- [5. 啟動、測試與建置](#5-啟動測試與建置)
- [6. 專案結構](#6-專案結構)
- [7. 建議開發流程](#7-建議開發流程)
- [8. 修改 Gameplay 的規則](#8-修改-gameplay-的規則)
- [9. UI、輸入與行動裝置規則](#9-ui輸入與行動裝置規則)
- [10. 美術與音訊工作流程](#10-美術與音訊工作流程)
- [11. Debug 與可重現測試](#11-debug-與可重現測試)
- [12. 測試策略](#12-測試策略)
- [13. 正式版發布檢查](#13-正式版發布檢查)
- [14. 常見問題](#14-常見問題)
- [15. 後續擴充邊界](#15-後續擴充邊界)

## 1. 專案定位

《天陽的漢堡工廠》是一款 Mobile-First 2D Arcade 視覺分類反應遊戲。漢堡是主題，真正的核心是：

```text
觀察食品 → 判斷完整／缺料 → 點左／點右 → 立即回饋 → 加速 → 重複
```

唯一長期目標是突破裝置上的最高分。遊戲不採用血量、複雜連段、第三種操作或料理模擬系統。

核心口訣：

- 完整漢堡 → 點畫面左半邊 → `FINISH`
- 缺料底座 → 點畫面右半邊 → `RETURN`
- 判斷錯誤或未及時處理 → 立即 `GAME OVER`

## 2. V1 完成範圍

V1 已完成以下正式遊戲循環：

```text
載入 → 主選單 → 首次互動教學 → 倒數 → Gameplay
     → 計分／加速 → Game Over → Retry／Menu
```

功能清單：

- 全畫面左右半區 `pointerdown` 操作。
- 自動選取 Player Station 可操作食品，不需要點漢堡。
- 完整、缺料、完成品皆有明顯高度與輪廓差異。
- 一次錯誤與超時直接結束。
- Score、Best Score、New Best 與快速 Retry。
- 速度隨分數平滑提高，固定 18% 初次漏料率。
- 退回時整條產線以相同距離、相同輸送帶速度回捲。
- 退回補料可能再次漏料；機率隨分數提高，最多連續兩次。
- 已越過玩家的完成品在回捲時隱藏或移除，避免誤判。
- 兩段實際操作教學與錯邊提示。
- Portrait／Landscape 響應式排版與旋轉重排。
- Safe Area、Dynamic Island、瀏海與 Home Indicator 避讓。
- 背景切換時自動暫停，回來後必須主動點擊繼續。
- 原創 BGM、六組音效與瀏覽器音訊解鎖流程。
- 高解析度 Canvas、文字超採樣與手機像素預算限制。
- 物件池、delta time 移動、Tween／事件清理。
- PWA Manifest、Service Worker 與首次載入後的基礎離線能力。
- `localStorage` 儲存最高分、靜音與教學狀態。
- `?debug=1` 與 `?seed=12345` 除錯模式。

## 3. 不可破壞的遊戲契約

任何新功能、重構或美術更新都必須保留以下行為。

### 3.1 輸入契約

1. Gameplay Viewport 左半邊永遠是 `FINISH`。
2. Gameplay Viewport 右半邊永遠是 `RETURN`。
3. Portrait 與 Landscape 不得交換左右。
4. 使用 `pointerdown`，不可改成等待 `click` 或 `pointerup`。
5. Pointer X 只決定動作，不決定食品。
6. 沒有 active item 時，左右點擊都必須忽略。
7. 多指同時觸控只接受第一個有效 pointer。
8. Gameplay input lock 維持 30–50 ms；V1 為 42 ms。
9. Pause、Mute、Menu、Retry 等 UI 必須 Consume 同一個 Pointer Event。

### 3.2 判定契約

| 食品狀態 | 玩家操作 | 結果 |
|---|---|---|
| `FILLED` | `FINISH` | 成功 |
| `FILLED` | `RETURN` | Game Over |
| `BASE_ONLY` | `RETURN` | 成功並回捲產線 |
| `BASE_ONLY` | `FINISH` | Game Over |
| 沒有 active item | 任一操作 | 忽略 |
| 可操作食品越過 Inspector 右側容許位置 | 無 | Game Over |

正式畫面不顯示判定線。實際可操作區由 Player Station 前方一路延伸到 Inspector 之後的容許位置，讓觸發範圍寬而自然。

### 3.3 退回契約

- 不得只把單顆漢堡 Tween 到左邊。
- 所有 active 食品每次必須位移相同距離，維持原始間距。
- 退回速度必須等於當前輸送帶速度。
- Spawn progress 必須同步回捲，避免下一顆食品破壞間距。
- 已完成且位於玩家右側的食品，不得在回捲時重新形成假提示。
- Tutorial 退回一定成功補料；正式遊戲才套用再次漏料機率。

## 4. 開發環境

### 4.1 必要工具

- Node.js `22.13.0` 或更新版本。
- npm（隨 Node.js 安裝）。
- 支援 WebGL／Canvas 與 Web Audio 的現代瀏覽器。

### 4.2 主要技術

| 層級 | 技術 |
|---|---|
| 遊戲引擎 | Phaser 3.90 |
| 語言 | TypeScript 5.9，Strict Mode |
| Web Shell | React 19、Next 16、Vinext |
| 開發／建置 | Vite 8 |
| Hosted Runtime | Cloudflare Worker 相容輸出 |
| 本機資料 | Web Storage API |
| 音訊 | Web Audio API、MP3、WAV |
| PWA | Web App Manifest、Service Worker、Cache API |
| 測試 | Node Test Runner、tsx |

遊戲本體不依賴 React state 執行每幀邏輯；React 只負責掛載 Phaser Canvas、瀏覽器手勢防護與 Service Worker 註冊。

## 5. 啟動、測試與建置

在專案根目錄執行：

```bash
npm install
npm run dev
```

常用指令：

| 指令 | 用途 |
|---|---|
| `npm run dev` | 啟動開發環境 |
| `npm run typecheck` | TypeScript 靜態檢查 |
| `npm run test:unit` | Gameplay 純規則測試 |
| `npm run lint` | ESLint 檢查 |
| `npm run build` | 正式 Worker／靜態資產建置 |
| `npm test` | Type Check、Unit Test、Build、Rendered HTML 全套檢查 |
| `npm run generate:audio` | 重新產生專案原創 BGM 與音效 |

合併或發布前的最低品質門檻：

```bash
npm run typecheck
npm run test:unit
npm run lint
npm run build
node --test tests/rendered-html.test.mjs
```

## 6. 專案結構

```text
app/                          Web Shell、Metadata、Viewport、全域 CSS
public/
  assets/                     Portrait／Landscape 工廠背景
  audio/                      BGM 與預載音效
  icons/                      PWA 圖示
  manifest.webmanifest        PWA 設定
  sw.js                       Offline Cache
src/
  main.ts                     Phaser 建立與 Service Worker 註冊
  game/
    Branding.ts               名稱與標語
    GameTuning.ts             Gameplay 唯一調校入口
    config.ts                 Phaser 設定
    art/                      色彩、字型與角色配色
    core/                     跨 Scene Event Bus
    entities/                 Conveyor、FoodItem、Worker、Inspector
    rules/                    可獨立測試的純規則
    scenes/                   Boot、Preload、Menu、Game、UI
    systems/                  Input、Layout、Audio、Spawn、Difficulty 等
    types/                    狀態、資料結構與共用型別
    ui/                       HUD、Feedback、Pause、Game Over、UI Button
scripts/                      建置、安裝與音訊產生工具
tests/                        規則測試與正式 HTML 測試
docs/                         開發與技術文件
skills/                       可攜式專案維護 Skill
```

## 7. 建議開發流程

每次修改採用以下順序：

1. 先確認需求是否違反第 3 節的核心契約。
2. 檢查工作區現況，保留與需求無關的既有修改。
3. 若修改遊戲數值，先調整 `src/game/GameTuning.ts`。
4. 若修改規則，優先在 `src/game/rules/` 建立或更新純函式。
5. 先加入失敗測試，再修改 Runtime 呼叫端。
6. Portrait 與 Landscape 共用 `LayoutManager`，不要在 Scene 散落固定座標。
7. 新 UI 互動一律使用 `InputManager.consumeUIEvent()`。
8. 新事件、Timer 或 Tween 必須在 Scene shutdown／restart 時可清除。
9. 跑完整品質門檻。
10. 若改變玩家可見行為，同步更新本文件與 `TECHNICAL.md`。

## 8. 修改 Gameplay 的規則

### 8.1 數值調校

所有可調 Gameplay 常數集中於：

```text
src/game/GameTuning.ts
```

不要在 Scene、Entity 或 UI 中新增散落的速度、間距、機率與 Gameplay timing magic number。

修改難度時，先確認：

- 主要難度仍來自速度。
- 初次漏料率不因分數變化而失控。
- 再次漏料最多連續兩次。
- 食品間距不小於有效操作區寬度加安全間隔。
- 高速時仍保有一眼可辨識的輪廓。

### 8.2 新食品造型

可替換季節外觀，但只能映射到兩類：

- `FILLED`：完整，高輪廓，多層大色塊。
- `BASE_ONLY`：缺料，低輪廓，明顯留白。

不得新增第三種 Gameplay Action。外觀不能只靠細字、小圖示或紅綠色差區分。

### 8.3 新難度事件

允許事件：改變產生節奏、視覺外觀、再次漏料機率或非阻塞式回饋。

禁止事件：第三按鍵、Swipe、拖曳、虛擬搖桿、血量制、複雜配方、Combo 操作或會遮住食品的全畫面特效。

## 9. UI、輸入與行動裝置規則

### 9.1 UI Event Priority

所有 Phaser UI Button 都應透過 `createUiButton()` 建立。這個工廠函式會：

- 在 `pointerdown` 立刻 Consume Event。
- 解鎖或喚醒 AudioContext。
- 播放按鈕音效。
- 提供 45 ms 壓下回饋。
- 避免同一事件落到 Gameplay Split Touch。

自訂全畫面 Overlay blocker 也必須手動呼叫 `InputManager.consumeUIEvent()`。

### 9.2 Responsive 規則

- 所有 Scene 位置從 `LayoutManager.current` 取得。
- Canvas 尺寸由 `DisplayManager` 依 CSS viewport 與 render scale 計算。
- 監聽 `resize`、`orientationchange` 與 `visualViewport.resize`。
- 不可寫死 390×844、1080×1920 或中央 X 座標。
- UI 必須加入 `safeArea` inset。

### 9.3 iOS Safari 防護

`app/globals.css` 與 `GameClient.tsx` 已處理：

- `viewport-fit=cover` 與不可縮放 viewport。
- `100vh`、`100svh`、`100dvh` 逐層 fallback。
- `touch-action: none`、禁止選取與長按 Callout。
- 禁止 Scroll、Overscroll 與手勢縮放。
- `visualViewport` 尺寸變動重算 Canvas。
- 使用者操作後才解鎖 Web Audio。
- 背景／鎖屏後必須點擊 Resume。

不要移除這些設定，除非完成真機回歸測試。

## 10. 美術與音訊工作流程

### 10.1 美術

- UI、漢堡、輸送帶與角色主要由 Phaser Graphics 繪製。
- 工廠背景使用 Portrait／Landscape 高解析度 WebP。
- 主色與字型堆疊集中在 `src/game/art/ArtTheme.ts`。
- 遊戲名稱集中在 `src/game/Branding.ts`。
- Canvas 不套用 pixelated image rendering。
- 文字由 `DisplayManager.sharpenActiveText()` 依 render scale 提高解析度。

更新背景時需保留：

- Portrait 與 Landscape 兩種素材。
- 輸送帶與食品的高對比前景空間。
- 不干擾 Safe Area HUD 的低資訊區。
- 合理壓縮，避免行動網路首次下載過大。

### 10.2 音訊

音訊來源定義於 `AudioManager.ts`，PreloadScene 會全部以 binary 預載並在首次操作後 decode。

重新產生內建音訊：

```bash
npm run generate:audio
```

輸出檔案：

- `factory-rush-bgm.mp3`
- `finish.wav`
- `return.wav`
- `approved.wav`
- `speedup.wav`
- `fail.wav`
- `button.wav`

若解碼失敗，Gameplay 音效會回退至 Web Audio Procedural Tone；BGM 不應阻擋遊戲開始。

## 11. Debug 與可重現測試

Debug Overlay：

```text
?debug=1
```

固定亂數序列：

```text
?debug=1&seed=12345
```

Overlay 顯示：

- FPS、內部解析度與 render scale。
- 方向、速度、分數與 Spawn Interval。
- 漏料率與再次漏料率。
- active item、Entity 數量與 Touch Gate 狀態。
- 左右半區、中線、Action Zone 與 Safe Area。

Debug 顯示可以畫出判定範圍；正式模式不可出現判定線。

## 12. 測試策略

### 12.1 自動測試

`tests/game-rules.test.ts` 覆蓋：

- 四種核心判定組合。
- 完整與缺料超時。
- 沒有 active item 時忽略輸入。
- 左右半區映射與指定手機尺寸。
- Portrait／Landscape 方向判斷。
- Render scale 與像素預算。
- Tutorial 可輸入階段。
- active item 最近距離選擇與寬 Action Zone。
- UI Event Consumption。
- Multi-touch first-pointer gate。
- 整線回捲的等距不變性。
- Spawn progress 回捲與 frame-rate overflow。
- 再次漏料機率與最大連續次數。
- 回捲時完成品隱藏／移除規則。

`tests/rendered-html.test.mjs` 驗證正式 Worker 回傳：

- 正確遊戲標題。
- PWA Manifest。
- Open Graph 圖片與正式 URL。
- Game Shell 掛載點。
- 不殘留開發預覽標記。

### 12.2 手機驗收尺寸

至少測試以下 CSS viewport，並旋轉成 Landscape：

- 390×844
- 393×852
- 430×932
- 360×800
- 412×915

### 12.3 真機驗收重點

- 左上、左中、左下皆為 FINISH。
- 右上、右中、右下皆為 RETURN。
- 點 Mute／Pause 不觸發 Gameplay。
- 沒有食品時亂點不會死亡。
- 左右近乎同時觸控只執行一次。
- 旋轉後左右不交換、食品與工作站重排正常。
- Safari Browser Bar 伸縮不造成畫布模糊或裁切。
- 切 App、鎖屏、接聽後回來不會立即死亡。
- 連續 Retry 不增加 Event Listener、Timer、Tween 或 Entity 數量。
- BGM 必須在第一次使用者操作後正常開始。

## 13. 正式版發布檢查

V1 使用語意化版本 `1.0.0`。後續版本建議：

- Patch：錯誤修正、效能與不改規則的美術調整。
- Minor：不破壞核心契約的新內容或新外觀。
- Major：只有在刻意改變遊戲契約時使用。

發布前：

1. 更新 `package.json` 與 `package-lock.json` 版本。
2. 若靜態資產改變，更新 `public/sw.js` 的 `CACHE_NAME`。
3. 跑完整品質門檻。
4. 確認主選單、教學、Gameplay、Game Over、Retry 全循環。
5. 確認正式 Metadata、Manifest、圖示與社群預覽。
6. 確認最高分與既有設定可向前相容。
7. 若 Tutorial 行為有重大變更，再提升 Tutorial Version。

## 14. 常見問題

### 畫面或文字變模糊

檢查：

- `DisplayManager.refreshRenderScale()` 是否在建立遊戲前執行。
- Canvas 內部尺寸是否等於 CSS 尺寸乘以 render scale。
- 是否誤設 `image-rendering: pixelated`。
- Phaser Text 是否經 `sharpenActiveText()` 更新 resolution。

### 點 UI 同時觸發 RETURN

檢查 UI 的 `pointerdown` 是否呼叫 `InputManager.consumeUIEvent(pointer, event)`，以及是否在同一個 Phaser input system 內處理。

### 回捲後食品重疊

不得單獨改變 returning item 的 X。所有 active item 必須由 `LineReturnController.update()` 套用同一個 `shiftedDistance`，SpawnManager 也要 `rewind()` 同距離。

### Retry 後事件觸發兩次

檢查 Scene shutdown 是否：

- `off()` 所有 Event Bus listener。
- Destroy SplitTouchController 與 LifecycleManager。
- `removeAllEvents()`。
- `killAll()` Tweens。
- Stop BGM。

### iOS 沒有聲音

AudioContext 必須由真實使用者手勢呼叫 `AudioManager.unlock()`；不可在頁面載入時自動播放。

## 15. 後續擴充邊界

適合 V1 之後考慮：

- 季節食品 Skin 與工廠背景。
- Golden Order 等不增加第三操作的特殊外觀。
- 更多原創角色待機動畫。
- 更完整的 PWA 更新提示。
- 可選的雲端排行榜與帳號系統。
- 裝置效能分級與更多低耗電選項。
- 自動化 Browser E2E 與真機測試。

不應加入：RPG、戰鬥、技能樹、第三按鍵、Swipe、拖曳料理、虛擬搖桿、複雜配方或大量任務 UI。

若一項功能會讓玩家把視線從漢堡移到控制介面，就不適合這個專案。

