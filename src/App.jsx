import { useState, useEffect } from 'react'
import { ShoppingCart, Loader2, Package, User, Phone, MapPin, CreditCard } from 'lucide-react'
import { API_URL } from './config'

function App() {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState('All')
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [successOrderId, setSuccessOrderId] = useState('')
  
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

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const xhr = new XMLHttpRequest()
      
      xhr.open('GET', `${API_URL}?action=get_products`, true)
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.status === 'success' && response.products) {
              setProducts(response.products)
              // Extract unique brands
              const uniqueBrands = ['All', ...new Set(response.products.map(p => p.brand || p.Brand || '未分類'))]
              setBrands(uniqueBrands)
            } else {
              // Fallback: Try to parse as CSV or handle differently
              console.error('Unexpected response format:', response)
            }
          } catch (e) {
            console.error('Parse error:', e)
            // Try fetching from CSV URL as fallback
            fetchFromCSV()
          }
        } else {
          fetchFromCSV()
        }
        setIsLoading(false)
      }
      
      xhr.onerror = () => {
        fetchFromCSV()
      }
      
      xhr.send()
    } catch (error) {
      console.error('Fetch error:', error)
      fetchFromCSV()
    }
  }

  const fetchFromCSV = async () => {
    try {
      // Fallback: Fetch from Google Sheets CSV
      const csvUrl = API_URL.replace('/exec', '').replace('/macros/s/', '/d/e/')
      const response = await fetch(`${csvUrl}/pub?gid=0&single=true&output=csv`)
      const text = await response.text()
      
      // Parse CSV
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      const parsedProducts = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const product = {}
        headers.forEach((header, index) => {
          product[header.toLowerCase()] = values[index] || ''
        })
        return product
      }).filter(p => p.name || p.Name)
      
      // Map to our format
      const formattedProducts = parsedProducts.map(p => ({
        id: `${p.name || p.Name}-${Math.random()}`,
        name: p.name || p.Name || '',
        brand: p.brand || p.Brand || p.category || p.Category || '未分類',
        price: parseFloat(p.price || p.Price || 0),
        description: p.description || p.Description || '',
        image: p.image || p.Image || 'https://via.placeholder.com/300x200?text=農產品'
      }))
      
      setProducts(formattedProducts)
      const uniqueBrands = ['All', ...new Set(formattedProducts.map(p => p.brand))]
      setBrands(uniqueBrands)
      setIsLoading(false)
    } catch (error) {
      console.error('CSV fetch error:', error)
      setIsLoading(false)
    }
  }

  const filteredProducts = selectedBrand === 'All' 
    ? products 
    : products.filter(p => p.brand === selectedBrand)

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
    // 關閉成功訂單視窗並清空購物車與表單
    setIsSuccessModalOpen(false)
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setAddress('')
    setPaymentMethod('transfer')
    setLast5Digits('')
    setIsCartOpen(false)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('購物車是空的')
      return
    }

    if (!customerName.trim()) {
      alert('請輸入您的姓名')
      return
    }

    if (!customerPhone.trim()) {
      alert('請輸入您的電話')
      return
    }

    if (!address.trim()) {
      alert('請輸入送貨地址')
      return
    }

    // Validate payment method
    if (paymentMethod === 'transfer' && !last5Digits.trim()) {
      alert('請輸入匯款帳號後五碼')
      return
    }

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
    xhr.setRequestHeader('Content-Type', 'text/plain')
    
    xhr.onload = function() {
      setIsSubmitting(false)
      try {
        const response = JSON.parse(xhr.responseText)
        if (response.status === 'success') {
          // 顯示訂單成功視窗並記錄訂單編號
          if (response.orderId) {
            setSuccessOrderId(response.orderId)
          } else {
            setSuccessOrderId('（無法取得訂單編號）')
          }
          setIsSuccessModalOpen(true)
          // 成功後關閉購物車側邊欄，實際清空動作放在關閉成功視窗時
          setIsCartOpen(false)
        } else {
          alert(`訂單提交失敗: ${response.message || '未知錯誤'}`)
        }
      } catch (e) {
        // Even if we can't parse, assume success (Google Apps Script may have processed it)
        alert('訂單已提交，請稍候確認')
        setCart([])
        setCustomerName('')
        setCustomerPhone('')
        setAddress('')
        setPaymentMethod('transfer')
        setLast5Digits('')
        setIsCartOpen(false)
      }
    }

    xhr.onerror = () => {
      setIsSubmitting(false)
      alert('訂單已提交，請稍候確認')
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setAddress('')
      setPaymentMethod('transfer')
      setLast5Digits('')
      setIsCartOpen(false)
    }

    xhr.send(JSON.stringify(orderData))
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              <h1 className="text-xl font-bold">米國學校</h1>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-green-700 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-earth-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Brand Tabs */}
      <div className="bg-white border-b border-earth-200 sticky top-[73px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedBrand === brand
                    ? 'bg-green-600 text-white'
                    : 'bg-beige-100 text-earth-700 hover:bg-beige-200'
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
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
            <p className="text-earth-600">載入中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-earth-300 mx-auto mb-4" />
            <p className="text-earth-600">此分類暫無商品</p>
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
      {isCartOpen && (
        <CartSidebar
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
      )}

      {/* Order Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          {/* 讓內容在小螢幕時可以捲動、避免被螢幕吃掉底部按鈕 */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            {/* 標題 */}
            <h2 className="text-2xl font-bold text-green-700 mb-3 text-center">
              訂單已送出！(Order Placed)
            </h2>

            {/* 說明文字 */}
            <p className="text-sm text-earth-700 mb-4 text-center">
              您的訂單已成功送出，請記下以下訂單編號：
            </p>

            {/* 訂單編號 + 複製按鈕 */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-xl md:text-2xl font-extrabold text-earth-900 tracking-wide break-all">
                {successOrderId}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!successOrderId) return
                  try {
                    await navigator.clipboard.writeText(successOrderId)
                    alert('已複製訂單編號')
                  } catch (err) {
                    console.error('Copy failed', err)
                    alert('複製失敗，請手動複製訂單編號')
                  }
                }}
                className="px-3 py-1.5 text-xs md:text-sm rounded-full bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                複製單號 (Copy ID)
              </button>
            </div>

            {/* CTA 說明文字 */}
            <p className="text-sm text-earth-700 mb-3 text-center">
              請加入官方帳號，輸入「查單 + 單號」查詢進度
            </p>

            {/* 前往 LINE 官方帳號按鈕 */}
            <a
              href="https://lin.ee/KOFaonp"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full mb-3"
            >
              <button
                type="button"
                className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
              >
                前往 LINE 官方帳號 (Go to LINE)
              </button>
            </a>

            {/* 關閉並清空購物車 */}
            <button
              type="button"
              onClick={handleSuccessModalClose}
              className="w-full py-2.5 mt-1 rounded-lg bg-earth-800 text-white text-sm font-medium hover:bg-earth-900 transition-colors"
            >
              關閉並清空購物車
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-square bg-beige-100 relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=農產品'
          }}
        />
        <div className="absolute top-2 left-2">
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {product.brand}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-earth-900 mb-1 line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-earth-600 mb-2 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-green-600 font-bold">${product.price}</span>
          <button
            onClick={onAddToCart}
            className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
          >
            加入
          </button>
        </div>
      </div>
    </div>
  )
}

function CartSidebar({
  cart,
  onClose,
  onRemove,
  onUpdateQuantity,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  address,
  setAddress,
  paymentMethod,
  setPaymentMethod,
  last5Digits,
  setLast5Digits,
  total,
  onCheckout,
  isSubmitting
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">購物車</h2>
          <button onClick={onClose} className="p-1 hover:bg-green-700 rounded">
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-earth-300 mx-auto mb-4" />
              <p className="text-earth-600">購物車是空的</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 bg-beige-50 rounded-lg p-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/64x64?text=農產品'
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-earth-900">{item.name}</p>
                        <p className="text-xs text-earth-600">{item.brand}</p>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-earth-400 hover:text-earth-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-white border border-earth-300 flex items-center justify-center text-earth-600"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-white border border-earth-300 flex items-center justify-center text-earth-600"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-green-600 font-bold">${item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Form */}
        {cart.length > 0 && (
          <div className="border-t border-earth-200 p-4 space-y-4 bg-beige-50">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-earth-700 mb-1">
                <User className="w-4 h-4" />
                姓名 *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="請輸入您的姓名"
                className="w-full px-3 py-2 border border-earth-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-earth-700 mb-1">
                <Phone className="w-4 h-4" />
                電話 *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="請輸入您的電話"
                className="w-full px-3 py-2 border border-earth-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-earth-700 mb-1">
                <MapPin className="w-4 h-4" />
                送貨地址 *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="請輸入完整的送貨地址（例如：台北市信義區信義路五段7號）"
                rows={3}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Payment Method Section */}
            <div className="pt-2 border-t border-earth-200">
              <label className="flex items-center gap-2 text-sm font-medium text-earth-700 mb-3">
                <CreditCard className="w-4 h-4" />
                付款方式
              </label>
              
              <div className="space-y-2">
                {/* Transfer Option */}
                <label className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-beige-100"
                  style={{
                    borderColor: paymentMethod === 'transfer' ? '#16a34a' : '#d4d4b8',
                    backgroundColor: paymentMethod === 'transfer' ? '#f5f3ed' : 'transparent'
                  }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="flex-1 text-sm font-medium">🏧 銀行轉帳 / ATM Transfer</span>
                </label>

                {/* Pickup Option */}
                <label className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-beige-100"
                  style={{
                    borderColor: paymentMethod === 'pickup' ? '#16a34a' : '#d4d4b8',
                    backgroundColor: paymentMethod === 'pickup' ? '#f5f3ed' : 'transparent'
                  }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pickup"
                    checked={paymentMethod === 'pickup'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="flex-1 text-sm font-medium">💵 現場付款 / Pay on Pickup</span>
                </label>
              </div>

              {/* Bank Info (only show if transfer is selected) */}
              {paymentMethod === 'transfer' && (
                <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-800 mb-1">銀行資訊</p>
                  <p className="text-sm text-green-700">銀行代碼: 700 (郵局)</p>
                  <p className="text-sm text-green-700">帳號: 0001234-567890</p>
                </div>
              )}

              {/* Last 5 Digits Input (only show if transfer is selected) */}
              {paymentMethod === 'transfer' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    匯款帳號後五碼 (Last 5 Digits) *
                  </label>
                  <input
                    type="text"
                    value={last5Digits}
                    onChange={(e) => {
                      // Only allow numbers and limit to 5 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                      setLast5Digits(value)
                    }}
                    placeholder="請輸入後五碼"
                    maxLength={5}
                    className="w-full px-3 py-2 border border-earth-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-earth-200">
              <span className="text-lg font-bold text-earth-900">總計</span>
              <span className="text-2xl font-bold text-green-600">${total}</span>
            </div>

            <button
              onClick={onCheckout}
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                '確認訂單'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App


