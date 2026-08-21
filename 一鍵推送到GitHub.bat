@echo off
chcp 65001 >nul
title 《天陽的漢堡工廠》一鍵推送到 GitHub 工具

echo ======================================================================
echo    🍔 《天陽的漢堡工廠》完整專案 - GitHub 一鍵上傳與發布工具
echo ======================================================================
echo.
echo [1/5] 檢查 Git 環境...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] 錯誤：系統找不到 git 指令，請先安裝 Git for Windows (https://git-scm.com/)。
    pause
    exit /b
)

echo [2/5] 初始化 Git 倉庫...
if not exist ".git" (
    git init
    echo [+] 已建立全新 Git 倉庫。
) else (
    echo [*] 已存在 Git 倉庫，繼續更新。
)

echo.
echo [3/5] 加入所有分類整理好的專案檔案...
git add .

echo.
echo [4/5] 建立 Commit 提交...
git commit -m "feat: 🚀 Initial commit - 天陽的漢堡工廠完整專案 (網頁版 + 安卓版 + Grok角色動作增強版)"
git branch -M main

echo.
echo [5/5] 設定遠端 GitHub 倉庫...
set /p REPO_URL="請輸入您的 GitHub 倉庫 URL (例如 https://github.com/您的帳號/Tianyang-Burger-Factory.git): "

if "%REPO_URL%"=="" (
    echo [!] 未輸入 URL，已完成本地 Commit。您可以隨時手動執行 git remote add 與 git push。
) else (
    git remote remove origin >nul 2>nul
    git remote add origin %REPO_URL%
    echo [*] 正在推送至 GitHub main 分支...
    git push -u origin main
    if %errorlevel% equ 0 (
        echo.
        echo ======================================================================
        echo    🎉 恭喜！專案已成功推送到 GitHub！
        echo ======================================================================
    ) else (
        echo.
        echo [!] 推送時遇到問題，請確認您已在 GitHub 上建立空倉庫並具備推送權限。
    )
)

echo.
pause
