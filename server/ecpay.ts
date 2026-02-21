import crypto from "crypto";

// ECPay 設定
const ECPAY_CONFIG = {
  // 測試環境
  stage: {
    merchantId: "3002607",
    hashKey: "pwFHCqoQZGmho4w6",
    hashIV: "EkRm7iFT261dpevs",
    apiUrl: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  },
  // 正式環境（需要用戶提供）
  production: {
    merchantId: process.env.ECPAY_MERCHANT_ID || "",
    hashKey: process.env.ECPAY_HASH_KEY || "",
    hashIV: process.env.ECPAY_HASH_IV || "",
    apiUrl: "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
  },
};

// 取得當前環境設定
const getConfig = () => {
  const isProduction = process.env.NODE_ENV === "production" && 
    process.env.ECPAY_MERCHANT_ID && 
    process.env.ECPAY_HASH_KEY && 
    process.env.ECPAY_HASH_IV;
  return isProduction ? ECPAY_CONFIG.production : ECPAY_CONFIG.stage;
};

// URL Encode（符合綠界規範）
const urlEncode = (str: string): string => {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/'/g, "%27");
};

// 產生 CheckMacValue
export const generateCheckMacValue = (params: Record<string, string | number>): string => {
  const config = getConfig();
  
  // 1. 排序參數
  const sortedKeys = Object.keys(params).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  
  // 2. 組合字串
  let checkStr = `HashKey=${config.hashKey}`;
  for (const key of sortedKeys) {
    checkStr += `&${key}=${params[key]}`;
  }
  checkStr += `&HashIV=${config.hashIV}`;
  
  // 3. URL Encode
  checkStr = urlEncode(checkStr);
  
  // 4. 轉小寫
  checkStr = checkStr.toLowerCase();
  
  // 5. SHA256 加密並轉大寫
  const hash = crypto.createHash("sha256").update(checkStr).digest("hex");
  return hash.toUpperCase();
};

// 驗證 CheckMacValue
export const verifyCheckMacValue = (params: Record<string, string | number>, checkMacValue: string): boolean => {
  const paramsWithoutCheck = { ...params };
  delete paramsWithoutCheck.CheckMacValue;
  
  const calculatedCheckMacValue = generateCheckMacValue(paramsWithoutCheck);
  return calculatedCheckMacValue === checkMacValue;
};

// 建立付款訂單參數
export interface CreatePaymentParams {
  orderNumber: string;
  totalAmount: number;
  itemName: string;
  tradeDesc?: string;
  returnUrl: string;
  clientBackUrl?: string;
  orderResultUrl?: string;
  paymentMethod?: "ALL" | "Credit" | "ATM" | "CVS" | "BARCODE";
}

export const createPaymentOrder = (params: CreatePaymentParams) => {
  const config = getConfig();
  const now = new Date();
  const tradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  
  const orderParams: Record<string, string | number> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: params.orderNumber.substring(0, 20), // 最多 20 字元
    MerchantTradeDate: tradeDate,
    PaymentType: "aio",
    TotalAmount: params.totalAmount,
    TradeDesc: params.tradeDesc || "宇聯國際線上商城訂單",
    ItemName: params.itemName.substring(0, 400), // 最多 400 字元
    ReturnURL: params.returnUrl,
    ChoosePayment: params.paymentMethod || "ALL",
    EncryptType: 1,
    NeedExtraPaidInfo: "Y",
  };
  
  if (params.clientBackUrl) {
    orderParams.ClientBackURL = params.clientBackUrl;
  }
  
  if (params.orderResultUrl) {
    orderParams.OrderResultURL = params.orderResultUrl;
  }
  
  // 產生 CheckMacValue
  orderParams.CheckMacValue = generateCheckMacValue(orderParams);
  
  return {
    apiUrl: config.apiUrl,
    params: orderParams,
  };
};

// 產生付款表單 HTML
export const generatePaymentFormHtml = (params: CreatePaymentParams): string => {
  const { apiUrl, params: orderParams } = createPaymentOrder(params);
  
  let formHtml = `<form id="ecpay-form" method="POST" action="${apiUrl}">`;
  for (const [key, value] of Object.entries(orderParams)) {
    formHtml += `<input type="hidden" name="${key}" value="${value}" />`;
  }
  formHtml += `</form>`;
  formHtml += `<script>document.getElementById('ecpay-form').submit();</script>`;
  
  return formHtml;
};

// 解析付款結果
export interface PaymentResult {
  success: boolean;
  orderNumber: string;
  tradeNo: string;
  paymentDate: string;
  paymentType: string;
  amount: number;
  message: string;
}

export const parsePaymentResult = (data: Record<string, string>): PaymentResult => {
  const rtnCode = data.RtnCode;
  const success = rtnCode === "1";
  
  return {
    success,
    orderNumber: data.MerchantTradeNo || "",
    tradeNo: data.TradeNo || "",
    paymentDate: data.PaymentDate || "",
    paymentType: data.PaymentType || "",
    amount: parseInt(data.TradeAmt || "0", 10),
    message: data.RtnMsg || "",
  };
};
