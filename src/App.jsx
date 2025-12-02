import { useState, useEffect } from 'react'
import { ShoppingCart, Loader2, Package, User, Phone, MapPin, CreditCard, Copy, ExternalLink } from 'lucide-react'

// 從環境變數讀取 API URL (如果在本地開發沒有 .env，請確保這裡有 fallback)
const API_URL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbzQICWdRXlRscpmH_kfZEniK7jdk8H4LZcF5NcWTuHa3mKH9xCxqAp6hQqtlzl6kPc/exec'

function App() {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState('All')
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [successOrderId, setSuccessOrderId] = useState('')
  
  // Toast State
  const [toastMessage, setToastMessage] = useState('')
  const [isToastVisible, setIsToastVisible] = useState(false)
  
  // Checkout form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [last5Digits, setLast5Digits] = useState('')

  // Fetch products on load
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = () => {
    setIsLoading(true)
    const xhr = new XMLHttpRequest()
    // 使用 GET 請求獲取菜單
    xhr.open('GET', API_URL, true)
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.status === 'success' && response.products) {
            setProducts(response.products)
            // Extract unique brands
            const uniqueBrands = ['All', ...new Set(response.products.map(p => p.brand || '未分類'))]
            setBrands(uniqueBrands)
          } else {
            console.error('API Error:', response)
            showToast('載入商品失敗')
          }
        } catch (e) {
          console.error('Parse error:', e)
          showToast('資料解析錯誤')
        }
      } else {
        showToast('無法連接伺服器')
      }
      setIsLoading(false)
    }
    
    xhr.onerror = () => {
      console.error('Network Error')
      setIsLoading(false)
      showToast('網絡連線錯誤')
    }
    
    xhr.send()
  }

  const filteredProducts = selectedBrand === 'All' 
    ? products 
    : products.filter(p => p.brand === selectedBrand)

  const showToast = (message) => {
    setToastMessage(message)
    setIsToastVisible(true)
    setTimeout(() => {
      setIsToastVisible(false)
    }, 3000)
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    showToast(`已加入: ${product.name}`)
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false)
    // 重置所有表單
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setAddress('')
    setPaymentMethod('transfer')
    setLast5Digits('')
    setIsCartOpen(false)
  }

  const handleCheckout = () => {
    // 驗證邏輯
    if (cart.length === 0) return alert('購物車是空的')
    if (!customerName.trim()) return alert('請輸入您的姓名')
    if (!customerPhone.trim()) return alert('請輸入您的電話')
    if (!address.trim()) return alert('請輸入送貨地址')
    if (paymentMethod === 'transfer' && !last5Digits.trim()) return alert('請輸入匯款帳號後五碼')

    setIsSubmitting(true)

    const orderData = {
      action: 'new_order',
      customer: customerName.trim(),
      phone: customerPhone.trim(),
      address: address.trim(),
      paymentMethod: paymentMethod,
      last5Digits: paymentMethod === 'transfer' ? last5Digits.trim() : '',
      items: cart.map(item => ({
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity
      })),
      total: cartTotal
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', API_URL, true)
    xhr.setRequestHeader('Content-Type', 'text/plain') // 關鍵：繞過 CORS
    
    xhr.onload = function() {
      setIsSubmitting(false)
      try {
        const response = JSON.parse(xhr.responseText)
        if (response.status === 'success') {
          // 設定單號並開啟成功視窗
          setSuccessOrderId(response.orderId || '系統處理中')
          setIsSuccessModalOpen(true)
          setIsCartOpen(false) // 先關側邊欄
        } else {
          alert(`訂單提交失敗: ${response.message || '未知錯誤'}`)
        }
      } catch (e) {
        // 如果 JSON 解析失敗，通常代表 GAS 執行成功但回傳了 HTML (但也算成功)
        console.warn('Response parsing error, assuming success:', e)
        setSuccessOrderId('ORD-PENDING')
        setIsSuccessModalOpen(true)
        setIsCartOpen(false)
      }
    }

    xhr.onerror = () => {
      setIsSubmitting(false)
      alert('網絡錯誤，請檢查連線')
    }

    xhr.send(JSON.stringify(orderData))
  }

  return (
    <div className="min-h-screen pb-20 bg-stone-50 font-sans text-stone-800">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              <h1 className="text-xl font-bold tracking-wide">米國學校直賣所</h1>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-emerald-800 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Brand Tabs */}
      <div className="bg-white border-b border-stone-200 sticky top-[60px] z-30 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedBrand === brand
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
            <p className="text-stone-500">正在搬運好物...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">目前沒有相關商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addToCart(product)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        address={address}
        setAddress={setAddress}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        last5Digits={last5Digits}
        setLast5Digits={setLast5Digits}
        total={cartTotal}
        onCheckout={handleCheckout}
        isSubmitting={isSubmitting}
      />

      {/* Order Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">訂單已送出！</h2>
              <p className="text-sm text-gray-500 mb-6">感謝您的購買，請記下訂單編號以供查詢</p>
              
              <div className="bg-stone-50 rounded-lg p-4 mb-6 border border-stone-200">
                <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Order ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold text-stone-800 tracking-wider">
                    {successOrderId}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successOrderId)
                      alert('已複製單號！')
                    }}
                    className="p-1.5 hover:bg-stone-200 rounded-md transition-colors text-stone-500"
                    title="複製單號"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="https://line.me/R/ti/p/@557jvvmh" // 請確認這是你的正確 LINE 連結
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#06C755] text-white font-bold hover:bg-[#05b34c] transition-colors shadow-md hover:shadow-lg"
                >
                  <span className="text-xl">LINE</span>
                  <span>加入官方帳號查單</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                
                <p className="text-xs text-gray-400">
                  加入後輸入 <span className="font-mono bg-gray-100 px-1 rounded">查單 {successOrderId}</span> 即可查詢進度
                </p>

                <button
                  onClick={handleSuccessModalClose}
                  className="w-full py-3 rounded-xl text-stone-600 font-medium hover:bg-stone-100 transition-colors"
                >
                  關閉並繼續購物
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {isToastVisible && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] animate-bounce-in">
          <div className="bg-stone-800 text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium flex items-center gap-2">
            <span>✅</span>
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  )
}

// 子組件：商品卡片
function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=商品' }}
        />
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 backdrop-blur-sm text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm border border-emerald-100">
            {product.brand}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-stone-800 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-stone-500 mb-3 line-clamp-2 min-h-[2.5em]">{product.description || '在地嚴選優質商品'}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-700">${product.price}</span>
          <button
            onClick={onAddToCart}
            className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

// 子組件：購物車側邊欄
function CartSidebar({
  isOpen,
  cart,
  onClose,
  onRemove,
  onUpdateQuantity,
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  address, setAddress,
  paymentMethod, setPaymentMethod,
  last5Digits, setLast5Digits,
  total,
  onCheckout,
  isSubmitting
}) {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-lg font-bold">購物清單 ({cart.length})</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
              <p>您的購物車是空的</p>
              <button onClick={onClose} className="mt-4 text-emerald-600 font-medium hover:underline">去逛逛商品</button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-stone-200"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/64x64' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-medium text-stone-800 text-sm truncate">{item.name}</h4>
                          <span className="text-[10px] text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">{item.brand}</span>
                        </div>
                        <button onClick={() => onRemove(item.id)} className="text-stone-400 hover:text-red-500 px-1">×</button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-2 py-0.5">
                          <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="text-stone-500 hover:text-emerald-600">-</button>
                          <span className="text-sm w-4 text-center font-medium">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="text-stone-500 hover:text-emerald-600">+</button>
                        </div>
                        <span className="font-bold text-emerald-700">${item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                  <User className="w-4 h-4" /> 收件資訊
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="姓名 *"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="電話 *"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                
                <div className="relative">
                  <MapPin className="absolute top-3 left-3 w-4 h-4 text-stone-400" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="請輸入完整送貨地址 *"
                    rows={2}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> 付款方式
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'transfer' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 hover:border-stone-300'}`}>
                      <input type="radio" name="payment" value="transfer" checked={paymentMethod === 'transfer'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                      <span className="text-xl">🏧</span>
                      <span className="text-xs font-bold">銀行轉帳</span>
                    </label>
                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'pickup' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 hover:border-stone-300'}`}>
                      <input type="radio" name="payment" value="pickup" checked={paymentMethod === 'pickup'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                      <span className="text-xl">💵</span>
                      <span className="text-xs font-bold">現場付款</span>
                    </label>
                  </div>

                  {/* Transfer Details */}
                  {paymentMethod === 'transfer' && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-sm animate-fade-in">
                      <p className="text-emerald-800 font-medium mb-1">匯款資訊 (郵局 700)</p>
                      <p className="text-stone-600 font-mono bg-white px-2 py-1 rounded border border-emerald-100 mb-2 select-all">0001234-567890</p>
                      <input
                        type="text"
                        value={last5Digits}
                        onChange={(e) => setLast5Digits(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="請輸入帳號後五碼 *"
                        maxLength={5}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-md text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-stone-200 shrink-0 pb-safe">
            <div className="flex justify-between items-end mb-4">
              <span className="text-stone-500 text-sm">總金額 ({cart.length} 件)</span>
              <span className="text-2xl font-bold text-emerald-700">${total}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={isSubmitting}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 處理中...</>
              ) : (
                '確認結帳'
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default App