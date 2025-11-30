# 米國學校 - Rice School Store

移動優先的 O2O 訂購 Web App，讓在地農夫直接銷售他們的產品。

## 功能特色

- 🌾 **品牌分類**：按農夫名稱（品牌）分類商品
- 📱 **移動優先**：專為手機用戶設計的響應式界面
- 🛒 **購物車系統**：簡單直觀的購物體驗
- 📋 **訂單管理**：客戶資訊收集（姓名、電話、桌號/取貨方式）
- 🔔 **LINE 通知**：訂單自動發送到 LINE（需設置 Token）
- 📊 **Google Sheets 整合**：所有數據存儲在 Google Sheets

## 技術棧

- **React 18** - UI 框架
- **Vite** - 構建工具
- **Tailwind CSS** - 樣式框架
- **Lucide React** - 圖標庫
- **Google Apps Script** - 後端 API

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置 API URL

編輯 `src/config.js`，將 `API_URL` 替換為您的 Google Apps Script Web App URL：

```javascript
export const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
```

### 3. 設置 Google Apps Script

1. 打開 Google Apps Script 編輯器
2. 將 `gas-script.js` 中的代碼貼上
3. 設置 `SPREADSHEET_ID`（您的 Google Sheets ID）
4. （可選）設置 `LINE_NOTIFY_TOKEN` 以啟用 LINE 通知
5. 部署為 Web App，設置「任何人」可訪問

### 4. 準備 Google Sheets

創建一個名為 "Products" 的工作表，包含以下欄位：
- **Category** 或 **Brand** - 品牌/農夫名稱
- **Name** - 產品名稱
- **Price** - 價格
- **Description** - 描述（可選）
- **Image** 或 **Image URL** - 圖片網址（可選）

### 5. 運行開發服務器

```bash
npm run dev
```

應用程式將在 `http://localhost:3000` 運行。

### 6. 構建生產版本

```bash
npm run build
```

構建的文件將在 `dist` 目錄中。

## 項目結構

```
rice-school-store/
├── src/
│   ├── App.jsx          # 主應用組件
│   ├── main.jsx         # 入口文件
│   ├── index.css        # 全局樣式
│   └── config.js        # API 配置
├── index.html           # HTML 模板
├── package.json         # 依賴配置
├── vite.config.js       # Vite 配置
├── tailwind.config.js   # Tailwind 配置
└── gas-script.js       # Google Apps Script 後端
```

## 設計風格

- **顏色主題**：大地色系（綠色、棕色、米色）
- **字體**：微軟正黑體、系統字體
- **布局**：移動優先，響應式設計

## 功能說明

### 產品顯示
- 從 Google Sheets 自動載入產品
- 按品牌（農夫名稱）分類
- 顯示品牌標籤、價格、描述

### 購物車
- 添加/移除商品
- 調整數量
- 實時計算總價

### 結帳
- 收集客戶姓名（必填）
- 收集客戶電話（必填）
- 收集桌號/取貨方式（可選）
- 提交訂單到 Google Apps Script

### LINE 通知
如果設置了 LINE_NOTIFY_TOKEN，新訂單會自動發送到 LINE，包含：
- 客戶姓名和電話
- 桌號/取貨方式
- 購買商品列表
- 總額

## 部署

### Vercel 部署

1. 將代碼推送到 GitHub
2. 在 Vercel 中導入項目
3. 構建命令：`npm run build`
4. 輸出目錄：`dist`

### Netlify 部署

1. 將代碼推送到 GitHub
2. 在 Netlify 中導入項目
3. 構建命令：`npm run build`
4. 發布目錄：`dist`

## 注意事項

- 確保 Google Apps Script 已正確部署並設置為「任何人」可訪問
- CSV 格式的產品數據需要包含正確的欄位名稱
- LINE 通知功能是可選的，不設置 Token 不會影響其他功能

## 授權

此專案為開源專案，可自由使用和修改。
