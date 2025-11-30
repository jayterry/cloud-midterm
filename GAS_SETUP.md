# Google Apps Script 設置指南

## 步驟 1：創建 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 創建一個新的試算表
3. 將試算表命名為 "Rice School Store"
4. 複製試算表的 ID（從 URL 中取得）
   - URL 格式：`https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - 例如：如果 URL 是 `https://docs.google.com/spreadsheets/d/abc123xyz/edit`
   - 則 SPREADSHEET_ID 是 `abc123xyz`

## 步驟 2：設置 Google Apps Script

1. 在 Google Sheets 中，點擊「擴充功能」→「Apps Script」
2. 刪除預設代碼，貼上 `gas-script.js` 中的代碼
3. **重要**：將第 12 行的 `YOUR_SPREADSHEET_ID_HERE` 替換為您的實際試算表 ID

```javascript
const SPREADSHEET_ID = '您的試算表ID';
```

4. 點擊「儲存」圖示（或按 Ctrl+S）
5. 為專案命名（例如：Rice School Store Backend）

## 步驟 3：部署為 Web App

1. 點擊右上角的「部署」→「新增部署作業」
2. 點擊「選取類型」旁邊的齒輪圖示，選擇「網頁應用程式」
3. 設置以下選項：
   - **說明**：Rice School Store API（可選）
   - **執行身份**：選擇「我」
   - **具有存取權的使用者**：選擇「任何人」
4. 點擊「部署」
5. **重要**：首次部署需要授權
   - 點擊「授權存取權限」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」
   - 點擊「允許」
6. 複製「Web 應用程式 URL」
   - 格式類似：`https://script.google.com/macros/s/AKfycbx.../exec`

## 步驟 4：設置 CSV 公開 URL

1. 在 Google Sheets 中，點擊「檔案」→「共用」→「發佈到網路」
2. 選擇「連結」標籤
3. 選擇要發佈的工作表（例如：Products）
4. 選擇「網頁」格式
5. 點擊「發佈」
6. 複製生成的 CSV URL
   - 格式類似：`https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=...`

## 步驟 5：在應用程式中設置 URL

1. 打開 Rice School Store 應用程式
2. 點擊「Admin Access」按鈕
3. 輸入密碼：`1234`
4. 在表單中輸入：
   - **Google Apps Script URL**：步驟 3 中複製的 URL
   - **產品 CSV URL**：步驟 4 中複製的 CSV URL
5. 點擊「添加產品」或直接關閉（URL 會自動保存）

## 測試

### 測試 Google Apps Script

1. 在 Apps Script 編輯器中，選擇 `testAddProduct` 函數
2. 點擊「執行」
3. 授權後，查看執行記錄
4. 檢查 Google Sheets 中是否新增了測試產品

### 測試應用程式

1. 在應用程式中添加一個產品
2. 檢查 Google Sheets 的 Products 工作表是否出現新產品
3. 添加產品到購物車並結帳
4. 檢查 Google Sheets 的 Orders 工作表是否出現新訂單

## 疑難排解

### 錯誤：Script function not found: doGet

- **原因**：代碼未正確部署或未包含 `doGet` 函數
- **解決**：確保已貼上完整的 `gas-script.js` 代碼並重新部署

### 錯誤：Permission denied

- **原因**：未正確授權或部署設置錯誤
- **解決**：
  1. 確保「具有存取權的使用者」設為「任何人」
  2. 重新授權並重新部署

### 產品未顯示在應用程式中

- **原因**：CSV URL 不正確或工作表格式錯誤
- **解決**：
  1. 檢查 CSV URL 是否可公開訪問
  2. 確保 Products 工作表的第一行包含標題：Category, Name, Price, Description, Image
  3. 檢查欄位名稱是否正確（區分大小寫）

### 訂單未保存

- **原因**：Google Apps Script URL 不正確或權限問題
- **解決**：
  1. 檢查 URL 是否正確
  2. 在瀏覽器中直接訪問 URL 測試（應該返回 JSON 響應）
  3. 檢查 Apps Script 執行記錄中的錯誤訊息

## 安全建議

⚠️ **注意**：此設置使用簡單密碼保護，僅適用於測試或內部使用。

對於生產環境，建議：
- 使用更強的認證機制
- 限制 Google Apps Script 的存取權限
- 使用 Google Cloud Platform 的 API 金鑰
- 實施 HTTPS 和 CORS 保護

## 支援的欄位格式

### Products 工作表
| Category | Name | Price | Description | Image |
|----------|------|-------|-------------|-------|
| Rice | 有機白米 | 150 | 新鮮有機白米 | https://... |

### Orders 工作表（自動創建）
| Timestamp | Items | Total | Status | Customer Info | Notes |
|-----------|-------|-------|---------|---------------|-------|
| 2024-01-01T... | 產品名稱 (2x) - $150 | 300 | Pending | | |

## 進階功能（可選）

您可以擴展 Google Apps Script 以添加：
- 電子郵件通知（當有新訂單時）
- 庫存管理
- 訂單狀態更新
- 客戶資訊收集
- 數據分析報表



