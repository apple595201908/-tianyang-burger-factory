# 《天陽的漢堡工廠》Grok 開發手冊

- 版本範圍：安卓 HD v1.1.7 角色動作額外（Grok 開發線）
- 撰寫日期：2026-08-21
- 母資料夾：天陽的漢堡工廠_完整專案（網頁版＋安卓版）/03_安卓版_Gork開發
- 原則：不改原版網頁、不改原版安卓。本次全部新做內容獨立放在 03_安卓版_Gork開發。

## 1. 這次做了什麼

玩法與原版相同：內陷完整按左封蓋（FINISH），缺料按右退回（RETURN）。玩家是產線第三位。

Grok 開發線新增：角色動作（配料站放料／漏料；玩家蓋皮、推回；麵包站與品管連帶動作）、點擊修復（ACTION_FILL_CLEAR=18，INPUT_LOCK_MS=42）、失誤警鈴（燈號黃轉紅、響一次、結算即停）、工廠美術與 HUD 放大、安卓 APK v2/v3 重簽、介紹30秒 9:16 3Blue1Brown 動畫。

## 2. 資料夾分類

母資料夾只改 03_安卓版_Gork開發。原版 01_網頁版、原版 02_安卓版勿動。
03 下有：01_APK_安裝檔、02_開發原始碼、03_動作截圖、04_介紹動畫、05_開發手冊。
額外 APK 簽名與原版不同，必須先卸載再裝。
APK：Tianyang-Burger-Factory-HD-Xiaomi-Pad-Mini-v1.1.7-角色動作額外.apk
影片：天陽的漢堡工廠_30秒介紹_3Blue1Brown版_9x16.mp4

## 3. 系統架構

遊戲是 SVG + DOM，不是 Canvas 或 WebGL。核心類別 VectorBurgerFactory（game.ts）。角色動作由 CharacterActionDirector，音訊 GameAudio，存檔 SaveStore。
雙端同步：網頁 src/components/burger-factory/；安卓 android-svg/ 編進 www/ 打進 APK assets/www/。

## 4. 產線與玩法

四站：麵包站 worker-base、配料站 worker-fill（DEFECT_RATE 0.18 漏料）、封蓋站玩家 worker-player、品管 worker-inspector。
filled 加按左蓋上層；base-only 加按右退回補料；反了或過 deadlineX 失敗。
SPEED_MILESTONES = 10 25 50 75 100 150 200。分數 40 起 RUSH 高峰。

## 5. 角色動作

acting-place 500ms 放料；acting-skip 400ms 漏料；acting-cap 440ms 蓋皮；acting-push 520ms 推回；acting-stamp 360ms 蓋章。接近時 anticipating。
動作 class 加在 worker-角色；transform-box fill-box；重播前先清 class 強制 reflow。
玩家身後 PlayerSignal 燈號塔：正常黃燈，line-alarm 時紅燈閃與 alarm-wash 洗紅。

## 6. 點擊修復

舊窗口 playerX 減 ACTION_LEAD 平板約 1.2 秒死區。activePointerId 偶發沒釋放。
修正：ACTION_FILL_CLEAR=18（起點 fillX+18倍 scale）；INPUT_LOCK_MS=42。setPointerCapture，處理完即釋放。

## 7. 失誤警鈴

fail 後 mode=failing，加 failure-reaction 與 line-alarm，播 fail.wav 與 alarm.wav（不循環），震動 60 45 80，1.2 秒後 completeFailure 拿掉 line-alarm、stopAlarm、顯示結算。
GameAudio loop=false 音量 0.84。startAlarm 時 BGM 降到 0.06；stopAlarm 後 BGM 回 0.32。結算、主選單、靜音都要 stopAlarm。
WRONG_FINISH 缺料被送出；WRONG_RETURN 待封蓋被退回；MISSED_DEADLINE 漢堡通過品管員。

## 8. 工廠美術

layoutFactoryDressing：不鏽鋼牆、磁磚、管線、吊燈、蒸汽、站名牌、belt-sheen、scoreBurst。HUD 手機分數 28px、平板 38px。

## 9. 常數

DEFECT_RATE 0.18；ACTION_LEAD 52；ACTION_FILL_CLEAR 18；INPUT_LOCK_MS 42；FAILURE_REACTION_MS 1200；REWORK_MS 210；COUNTDOWN_STEP_MS 650；PAD_MINI 3008 x 1880。

## 10. 測試

完整點左蓋皮加一；空的點右推回補料；點錯紅燈加警鈴 1.2 秒後結算警鈴停；連點不卡；靜音時警鈴不響；先卸載再裝 APK。