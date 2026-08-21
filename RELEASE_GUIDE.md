# 🚀 GitHub 上傳與發布完整教學手冊 (GitHub Upload & Release Guide)

本手冊提供將《天陽的漢堡工廠_完整專案（網頁版＋安卓版）》發布至 GitHub 的標準步驟。

---

## 📋 步驟 1：建立 GitHub 新倉庫

1. 登入 [GitHub](https://github.com/)。
2. 點擊右上角的 **`+`** ➜ **`New repository`**。
3. 填寫倉庫資訊：
   * **Repository name**：`Tianyang-Burger-Factory`（或自訂名稱）
   * **Description**：`《天陽的漢堡工廠》完整專案（網頁版＋安卓版＋Grok角色動作增強版）`
   * **Public / Private**：依個人需求選擇公開或私有
   * ⚠️ **不要勾選** "Add a README file"、"Add .gitignore" 或 "Choose a license"（因為本專案資料夾內已完整為您配置好最完善的設定檔）。
4. 點擊 **`Create repository`**。

---

## 💻 步驟 2：使用 Git 初始化並推送 (命令列操作)

開啟 PowerShell 或 Terminal，依序執行以下指令：

```powershell
# 1. 進入專案根目錄
cd "C:\Users\user\Desktop\天陽的漢堡工廠_完整專案（網頁版＋安卓版）"

# 2. 初始化 Git 倉庫
git init

# 3. 將所有已分類整理好的檔案加入暫存區
git add .

# 4. 建立第一次提交 Commit
git commit -m "feat: 🚀 Initial commit - 天陽的漢堡工廠完整專案 (網頁版 + 安卓版 + Grok角色動作增強版)"

# 5. 將主分支命名為 main
git branch -M main

# 6. 綁定您的 GitHub 倉庫遠端網址 (請替換為您的實際倉庫 URL)
git remote add origin https://github.com/<您的GitHub帳號>/Tianyang-Burger-Factory.git

# 7. 推送至 GitHub
git push -u origin main
```

---

## 📦 步驟 3：建立 GitHub Release 並發布 APK (推薦)

為了讓使用者更方便直接在 GitHub 頁面下載最新版 APK 與觀看介紹短片，建議建立一個 GitHub Release：

1. 在 GitHub 倉庫頁面右側，點擊 **`Releases`** ➜ **`Create a new release`**。
2. **Choose a tag**：輸入 `v1.1.7-extra`（點擊 Create new tag）。
3. **Release title**：`🍔 天陽的漢堡工廠 v1.1.7-extra (Grok 角色動作額外增強版)`
4. **Description**：可直接複製 `CHANGELOG.md` 中 `[1.1.7-extra]` 的內容。
5. **Attach binaries by dropping them here**：
   * 拖曳上傳 `03_安卓版_Gork開發/01_APK_安裝檔/Tianyang-Burger-Factory-HD-Xiaomi-Pad-Mini-v1.1.7-角色動作額外.apk`
   * 拖曳上傳 `03_安卓版_Gork開發/04_介紹動畫/天陽的漢堡工廠_30秒介紹_3Blue1Brown版_9x16.mp4`
6. 點擊 **`Publish release`** 完成發布！

---

## 🌐 步驟 4：啟用 GitHub Pages (免費網頁線上玩)

若您想讓全世界玩家直接在瀏覽器線上玩 Grok 角色動作版：
1. 進入倉庫 **`Settings`** ➜ 左側 **`Pages`**。
2. **Source** 選擇 **`Deploy from a branch`**。
3. **Branch** 選擇 `main`，資料夾選擇 `/ (root)`。
4. 點擊 **`Save`**。
5. 發布後，即可透過 `https://<您的帳號>.github.io/Tianyang-Burger-Factory/03_安卓版_Gork開發/02_開發原始碼/角色動作額外/www/index.html` 免費直接遊玩！
