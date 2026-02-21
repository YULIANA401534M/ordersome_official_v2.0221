# 綠界 ECPay 金流串接資訊

## API 端點
- 測試環境：https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
- 正式環境：https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5

## 必要參數
1. **MerchantID** - 商店代號（由綠界提供）
2. **MerchantTradeNo** - 訂單編號（商家自訂，不可重複）
3. **MerchantTradeDate** - 交易時間（格式：yyyy/MM/dd HH:mm:ss）
4. **PaymentType** - 固定填 "aio"
5. **TotalAmount** - 交易金額（整數，新台幣）
6. **TradeDesc** - 交易描述
7. **ItemName** - 商品名稱（多商品用 # 分隔）
8. **ReturnURL** - 付款結果通知網址（Server POST）
9. **ChoosePayment** - 付款方式（ALL/Credit/ATM/CVS/BARCODE）
10. **CheckMacValue** - 檢查碼（SHA256 加密）
11. **EncryptType** - 加密類型（固定填 1）

## 選用參數
- **ClientBackURL** - 返回商店按鈕網址
- **OrderResultURL** - 付款完成後導向網址
- **NeedExtraPaidInfo** - 是否需要額外付款資訊（Y/N）

## 支援付款方式
- Credit - 信用卡一次付清
- ATM - 虛擬帳號轉帳
- CVS - 超商代碼繳費
- BARCODE - 超商條碼繳費
- Apple Pay - 蘋果支付
- TWQR - 台灣 Pay QR Code

## CheckMacValue 計算方式
1. 將參數依照 Key 排序
2. 組成 HashKey=xxx&param1=value1&...&HashIV=xxx
3. URL Encode
4. 轉小寫
5. SHA256 加密
6. 轉大寫

## 測試環境資訊
- MerchantID: 3002607
- HashKey: pwFHCqoQZGmho4w6
- HashIV: EkRm7iFT261dpevs

## 需要用戶提供
- 正式環境商店代號 (MerchantID)
- 正式環境 HashKey
- 正式環境 HashIV
