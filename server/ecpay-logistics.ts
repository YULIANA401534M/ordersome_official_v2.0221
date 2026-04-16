import crypto from "crypto";

// ═══════════════════════════════════════════════════════
// 綠界國內物流 API — CheckMacValue MD5（非 SHA256）
// 金流和物流共用 MerchantID/HashKey/HashIV，但加密演算法不同
// ═══════════════════════════════════════════════════════

const getLogisticsConfig = () => {
  const mid = process.env.ECPAY_LOGISTICS_MERCHANT_ID || process.env.ECPAY_MERCHANT_ID || "";
  const key = process.env.ECPAY_LOGISTICS_HASH_KEY || process.env.ECPAY_HASH_KEY || "";
  const iv = process.env.ECPAY_LOGISTICS_HASH_IV || process.env.ECPAY_HASH_IV || "";
  if (mid && key && iv) {
    return { merchantId: mid, hashKey: key, hashIV: iv, baseUrl: "https://logistics.ecpay.com.tw" };
  }
  return {
    merchantId: "2000132",
    hashKey: "5294y06JbISpM5x9",
    hashIV: "v77hoKGq4kWxNNIS",
    baseUrl: "https://logistics-stage.ecpay.com.tw",
  };
};

// .NET URL Encode 規範（同金流）
const dotNetUrlEncode = (str: string): string => {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/%21/g, "!")
    .replace(/%2a/gi, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2d/gi, "-")
    .replace(/%5f/gi, "_")
    .replace(/%2e/gi, ".")
    .replace(/%7e/gi, "~");  // 物流需要額外處理 ~
};

// ⚠️ 物流用 MD5，不是 SHA256
export const generateLogisticsCheckMacValue = (params: Record<string, string | number>): string => {
  const config = getLogisticsConfig();
  const sortedKeys = Object.keys(params).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  let rawStr = `HashKey=${config.hashKey}`;
  for (const key of sortedKeys) {
    rawStr += `&${key}=${params[key]}`;
  }
  rawStr += `&HashIV=${config.hashIV}`;
  const encoded = dotNetUrlEncode(rawStr).toLowerCase();
  return crypto.createHash("md5").update(encoded).digest("hex").toUpperCase();
};

// 驗證物流回調的 CheckMacValue（timing-safe）
export const verifyLogisticsCheckMacValue = (params: Record<string, string | number>): boolean => {
  const received = String(params.CheckMacValue || "");
  const paramsClone = { ...params };
  delete paramsClone.CheckMacValue;
  const computed = generateLogisticsCheckMacValue(paramsClone);
  const bufA = Buffer.from(computed);
  const bufB = Buffer.from(received.toUpperCase());
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// ═══════════════════════════════════════════════════════
// 寄件人固定資訊
// ═══════════════════════════════════════════════════════
const SENDER = {
  name: "宇聯國際",      // 4-10 字元
  cellPhone: "0926382665",
};

// ═══════════════════════════════════════════════════════
// 電子地圖 — 產生表單參數（前端用 form POST 跳轉）
// ═══════════════════════════════════════════════════════
export interface MapParams {
  subType: "FAMIC2C" | "UNIMARTC2C" | "HILIFEC2C";
  serverReplyURL: string;  // 選店結果回調 URL
  tradeNo?: string;
}

export const getMapFormParams = (params: MapParams) => {
  const config = getLogisticsConfig();
  console.log("[ECPay Logistics] config:", {
    merchantId: config.merchantId,
    hashKey: config.hashKey ? config.hashKey.substring(0, 4) + "***" : "(empty)",
    hashIV: config.hashIV ? config.hashIV.substring(0, 4) + "***" : "(empty)",
    baseUrl: config.baseUrl,
    env_LOGISTICS_MID: process.env.ECPAY_LOGISTICS_MERCHANT_ID ? "set" : "NOT SET",
    env_MID: process.env.ECPAY_MERCHANT_ID ? "set" : "NOT SET",
  });
  const input: Record<string, string | number> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: params.tradeNo || `MAP${Date.now()}`,
    LogisticsType: "CVS",
    LogisticsSubType: params.subType,
    IsCollection: "N",
    ServerReplyURL: params.serverReplyURL,
  };
  input.CheckMacValue = generateLogisticsCheckMacValue(input);
  return {
    url: `${config.baseUrl}/Express/map`,
    params: input,
  };
};

// ═══════════════════════════════════════════════════════
// 建立超商取貨物流訂單
// ═══════════════════════════════════════════════════════
export interface CreateCvsOrderParams {
  orderNumber: string;
  amount: number;
  goodsName: string;
  receiverName: string;
  receiverPhone: string;
  receiverStoreId: string;
  subType: "FAMIC2C" | "UNIMARTC2C" | "HILIFEC2C";
  serverReplyURL: string;
}

export const createCvsLogisticsOrder = async (params: CreateCvsOrderParams) => {
  const config = getLogisticsConfig();
  const now = new Date();
  const tradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const input: Record<string, string | number> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: params.orderNumber.replace(/[^A-Za-z0-9]/g, "").substring(0, 20),
    MerchantTradeDate: tradeDate,
    LogisticsType: "CVS",
    LogisticsSubType: params.subType,
    GoodsAmount: Math.round(params.amount),
    GoodsName: params.goodsName.substring(0, 50),
    SenderName: SENDER.name,
    SenderCellPhone: SENDER.cellPhone,
    ReceiverName: params.receiverName.substring(0, 10),
    ReceiverCellPhone: params.receiverPhone,
    ReceiverStoreID: params.receiverStoreId,
    ServerReplyURL: params.serverReplyURL,
  };

  // UNIMARTC2C 額外必填 CollectionAmount
  if (params.subType === "UNIMARTC2C") {
    input.CollectionAmount = Math.round(params.amount);
  }

  input.CheckMacValue = generateLogisticsCheckMacValue(input);

  // POST to ECPay
  const formBody = Object.entries(input)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  const res = await fetch(`${config.baseUrl}/Express/Create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody,
  });

  const text = await res.text();
  // 回應格式: 1|OK 或 ErrorCode|ErrorMessage
  // 成功時包含 AllPayLogisticsID 等欄位
  const result: Record<string, string> = {};
  text.split("&").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || "");
  });

  return {
    success: result.RtnCode === "1",
    logisticsId: result.AllPayLogisticsID || "",
    cvsPaymentNo: result.CVSPaymentNo || "",
    message: result.RtnMsg || text,
    raw: result,
  };
};

// ═══════════════════════════════════════════════════════
// 查詢物流訂單狀態
// ═══════════════════════════════════════════════════════
export const queryLogisticsOrder = async (logisticsId: string) => {
  const config = getLogisticsConfig();
  const input: Record<string, string | number> = {
    MerchantID: config.merchantId,
    AllPayLogisticsID: logisticsId,
    TimeStamp: Math.floor(Date.now() / 1000),
  };
  input.CheckMacValue = generateLogisticsCheckMacValue(input);

  const formBody = Object.entries(input)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  const res = await fetch(`${config.baseUrl}/Helper/QueryLogisticsTradeInfo/V5`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody,
  });

  const text = await res.text();
  const result: Record<string, string> = {};
  text.split("&").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || "");
  });

  return result;
};
