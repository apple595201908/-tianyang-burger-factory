# 📜 版本更新日誌 (Changelog)

所有關於《天陽的漢堡工廠》的重大更新與版本修訂均記錄於此。

---

## [1.1.7-extra] - 2026-08-21 (Grok 角色動作額外增強版)

### ✨ 新增功能 (Added)
- **4 站完整角色動作導演系統 (`CharacterActionDirector`)**：
  - 麵包站 (`worker-base`)：`acting-place` 遞送底皮 (500ms)。
  - 配料站 (`worker-fill`)：`acting-place` 正常放料；`acting-skip` 偷懶漏料 (400ms)。
  - 玩家站 (`worker-player`)：`acting-cap` 扣蓋 (440ms)；`acting-push` 推回瑕疵品 (520ms)。
  - 品管站 (`worker-inspector`)：`acting-stamp` 垂直蓋章放行 (360ms)。
- **即開即玩 Web 發布包 (`www/`)**：整合完整音訊資產 (`alarm.wav`, `bgm`, `sfx`) 與 HD 背景。
- **30 秒 3Blue1Brown 風格介紹動畫**：直式 9:16 幾何科普風格宣傳短片。
- **完整繁體中文技術手冊**：手冊解碼為 Markdown (`01_Grok開發手冊.md`, `02_APK打包與簽名.md`, `03_介紹動畫製作.md`)。

### ⚡ 效能與體驗優化 (Optimized & Fixed)
- **平板判定死區修復**：引入常數 `ACTION_FILL_CLEAR = 18`，修正高解析度下約 1.2 秒的操作死區。
- **防連擊保護**：引入 `INPUT_LOCK_MS = 42`，防範多點觸控連點誤判。
- **聲光警報升級**：背部燈號塔 `PlayerSignal` 失誤紅燈爆閃，`alarm.wav` 單次觸發且在結算時即刻靜音。
- **視覺強化**：新增蒸氣粒子層、輸送帶金屬高光與 HUD 分數放大。

---

## [1.1.7] - 2026-08-21 (Android HD 正式版)
- Xiaomi Pad Mini 螢幕適配優化 (3008×1880, 16:10)。
- 修正漢堡狀態同步與輸送帶速度曲線階梯 (`SPEED_MILESTONES`)。

## [1.1.0 ~ 1.1.6] - 2026-08-21 (Android HD 迭代修復)
- 導入 SVG + DOM 向量渲染引擎取代傳統 Canvas。
- 修正啟動閃退、間距與補料流暢度。

---

## [1.0.0] - 2026-08-21 (Web 原版正式發布)
- 經典工廠裝配線遊戲玩法誕生。
- 純 HTML5 + CSS + Web Audio 晶片音效合成。
- 完整打包 Git 歷史與 AI 維護 Skill。
