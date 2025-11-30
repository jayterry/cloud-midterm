/**
 * Rice School Store - Google Apps Script 後端 (最終融合完美版)
 * 功能：商品管理 + 訂單記錄 + LINE 通知 + 強大錯誤處理
 */

// ▼▼▼ 1. 這裡幫你填好 ID 了 ▼▼▼
const SPREADSHEET_ID = '1RZSYAQ3ciSlQvq-hfSWz38uGqPXXrDTN-CJ-Y7xhha4';

// ▼▼▼ 2. 請在這裡填入你的 LINE Token (如果沒有就留空) ▼▼▼
const LINE_NOTIFY_TOKEN = '你的_LINE_NOTIFY_TOKEN_貼在這裡'; 

const PRODUCTS_SHEET_NAME = 'Products';
const ORDERS_SHEET_NAME = 'Orders';

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'get_products') {
      return getProducts();
    }
    
    return responseJSON({
      status: 'success',
      message: 'Rice School Store API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return responseJSON({
      status: 'error',
      message: error.toString()
    });
  }
}

function getProducts() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);
    
    if (!sheet) {
      return responseJSON({
        status: 'success',
        products: []
      });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON({
        status: 'success',
        products: []
      });
    }
    
    const headers = data[0].map(h => h.toString().toLowerCase());
    const products = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue; // Skip empty rows
      
      const product = {};
      headers.forEach((header, index) => {
        product[header] = row[index] || '';
      });
      
      // Map to standard format
      products.push({
        id: `product-${i}`,
        name: product.name || product['product name'] || '',
        brand: product.brand || product.category || '未分類',
        price: parseFloat(product.price || 0),
        description: product.description || '',
        image: product.image || product['image url'] || 'https://via.placeholder.com/300x200?text=農產品'
      });
    }
    
    return responseJSON({
      status: 'success',
      products: products.filter(p => p.name)
    });
  } catch (error) {
    return responseJSON({
      status: 'error',
      message: 'Failed to get products: ' + error.toString()
    });
  }
}

function doPost(e) {
  try {
    let postData;
    // 解析 JSON 或 Form Data
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseError) {
        // 嘗試從參數讀取
        if (e.parameter && e.parameter.data) postData = JSON.parse(e.parameter.data);
        else postData = e.parameter;
      }
    } else if (e.parameter) {
      postData = e.parameter;
    } else {
      throw new Error('無請求數據');
    }
    
    const action = postData.action;

    if (action === 'add_product') {
      return handleAddProduct(postData);
    } else if (action === 'new_order') {
      return handleNewOrder(postData);
    } else {
      return responseJSON({status: 'error', message: 'Unknown action: ' + action});
    }
  } catch (error) {
    return responseJSON({status: 'error', message: error.toString()});
  }
}

// 處理添加產品
function handleAddProduct(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(PRODUCTS_SHEET_NAME);
      sheet.appendRow(['Category', 'Name', 'Price', 'Description', 'Image']);
    }

    sheet.appendRow([
      data.category || '',
      data.name || '',
      data.price || 0,
      data.description || '',
      data.image || ''
    ]);

    return responseJSON({status: 'success', message: 'Product added successfully'});
  } catch (error) {
    return responseJSON({status: 'error', message: 'Add Product Failed: ' + error.toString()});
  }
}

// 處理新訂單 (包含 LINE 通知與客戶資料)
function handleNewOrder(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(ORDERS_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(ORDERS_SHEET_NAME);
      sheet.appendRow(['Date', 'Name', 'Phone', 'Address', 'Payment Method', 'Last 5 Digits', 'Items', 'Total']);
    }

    // 格式化商品字串
    let itemsText = "";
    if (Array.isArray(data.items)) {
      itemsText = data.items.map(item => `${item.name} (${item.brand || ''}) x${item.quantity}`).join(', ');
    } else {
      itemsText = data.items || "無商品資訊";
    }

    // 寫入資料
    const customerName = data.customer || data.name || '未填寫';
    const customerPhone = data.phone || '未填寫';
    const customerAddress = data.address || '未填寫';
    const paymentMethod = data.paymentMethod || '未填寫';
    const last5Digits = data.last5Digits || '';

    sheet.appendRow([
      new Date(),
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod === 'transfer' ? '銀行轉帳' : paymentMethod === 'pickup' ? '現場付款' : paymentMethod,
      last5Digits,
      itemsText,
      data.total || 0
    ]);

    // 發送 LINE 通知
    const paymentInfo = paymentMethod === 'transfer' 
      ? `💳 付款方式: 銀行轉帳\n🔢 後五碼: ${last5Digits || '未填寫'}`
      : `💵 付款方式: 現場付款`;
    
    const lineMessage = `🌾 新訂單入帳！\n👤 客戶: ${customerName}\n📱 電話: ${customerPhone}\n📍 地址: ${customerAddress}\n${paymentInfo}\n📦 購買: ${itemsText}\n💰 總額: $${data.total || 0}`;
    sendLineNotify(lineMessage);

    return responseJSON({status: 'success', message: 'Order created successfully'});
  } catch (error) {
    return responseJSON({status: 'error', message: 'Order Failed: ' + error.toString()});
  }
}

// LINE 通知小幫手
function sendLineNotify(message) {
  if (!LINE_NOTIFY_TOKEN || LINE_NOTIFY_TOKEN.includes('貼在這裡')) return;
  
  try {
    UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
      "method": "post",
      "payload": {"message": message},
      "headers": {"Authorization": "Bearer " + LINE_NOTIFY_TOKEN}
    });
  } catch (e) {
    Logger.log("LINE Error: " + e);
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 測試用
function testAddProduct() {
  const testData = {
    action: 'add_product',
    category: 'Rice',
    name: '測試米',
    price: 100,
    description: '好吃的米',
    image: 'https://via.placeholder.com/150'
  };
  Logger.log(doPost({postData: {contents: JSON.stringify(testData)}}).getContent());
}
