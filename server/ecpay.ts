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
// 只要正式環境金鑰已設定，就使用正式環境（不依賴 NODE_ENV）
const getConfig = () => {
  const hasProductionKeys = 
    process.env.ECPAY_MERCHANT_ID && 
    process.env.ECPAY_HASH_KEY && 
    process.env.ECPAY_HASH_IV;
  return hasProductionKeys ? ECPAY_CONFIG.production : ECPAY_CONFIG.stage;
};

// 綠界官方規範：對整個字串做 URL Encode，再還原 .NET 規範不應被 encode 的字元
const ecpayUrlEncode = (str: string): string => {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")      // 空格轉 +
    .replace(/%21/g, "!")      // ! 不 encode
    .replace(/%2A/gi, "*")     // * 不 encode
    .replace(/%28/g, "(")      // ( 不 encode
    .replace(/%29/g, ")")      // ) 不 encode
    .replace(/%2D/gi, "-")     // - 不 encode
    .replace(/%5F/gi, "_")     // _ 不 encode
    .replace(/%2E/gi, ".");    // . 不 encode
};

// 產生 CheckMacValue
export const generateCheckMacValue = (params: Record<string, string | number>): string => {
  const config = getConfig();
  
  // 1. 排序參數（字母排序，不區分大小寫）
  const sortedKeys = Object.keys(params).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  
  // 2. 組合字串（綠界官方規範：先組合原始字串，再對整個字串做 URL Encode）
  let rawStr = `HashKey=${config.hashKey}`;
  for (const key of sortedKeys) {
    rawStr += `&${key}=${params[key]}`;
  }
  rawStr += `&HashIV=${config.hashIV}`;
  
  // 3. 對整個字串做 URL Encode（符合 .NET 編碼規範）
  let checkStr = ecpayUrlEncode(rawStr);
  
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
    // 綠界規範：MerchantTradeNo 只允許英數字，最多 20 字元
    MerchantTradeNo: params.orderNumber.replace(/[^A-Za-z0-9]/g, "").substring(0, 20),
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
