# Atom Payment Gateway API仕様書

## **エンドポイント一覧**

### **1. Get Atomtoken ID API**
```yaml
目的: 決済トークンID取得
Method: POST
UAT: https://paynetzuat.atomtech.in/ots/aipay/auth
PROD: https://payment1.atomtech.in/ots/aipay/auth
```

### **2. Get Transaction Status API**
```yaml
目的: 取引状況確認
Method: POST
UAT: https://paynetzuat.atomtech.in/ots/v2/payment/status
PROD: https://payment1.atomtech.in/ots/v2/payment/status
```

### **3. Callback API**
```yaml
目的: 決済完了通知受信
Method: POST
UAT: https://paynetzuat.atomtech.in/
PROD: https://payment1.atomtech.in/
```

### **4. Product Sample Refund Request API**
```yaml
目的: リファンド実行
Method: POST
UAT: https://caller.atomtech.in/ots/payment/refund
PROD: https://payment.atomtech.in/ots/payment/refund
```

### **5. Get Refund Status API**
```yaml
目的: リファンド状況確認
Method: POST
UAT: https://caller.atomtech.in/ots/payment/status
PROD: https://payment1.atomtech.in/ots/payment/status
```

---

## **完全なペイロード・レスポンス仕様**

### **1. Get Atomtoken ID API**

#### **リクエストペイロード**
```json
{
  "payInstrument": {
    "headDetails": {
      "api": "AUTH",
      "version": "OTSv1.1",
      "platform": "FLASH"
    },
    "merchDetails": {
      "merchId": "317157",
      "userId": "123",
      "password": "Test@123",
      "merchTxnId": "Test123450",
      "merchTxnDate": "2023-07-13 20:46:00"
    },
    "payDetails": {
      "amount": 1,
      "product": "NSE",
      "custAccNo": "213232323",
      "txnCurrency": "INR"
    },
    "custDetails": {
      "custEmail": "testuser@nttdata.com",
      "custMobile": "9797979797"
    },
    "extras": {
      "udf1": "-",
      "udf2": "-",
      "udf3": "-",
      "udf4": "-",
      "udf5": "-"
    },
    "payModeSpecificData": {
      "subChannel": "NB"
    }
  }
}
```

#### **TypeScript型定義**
```typescript
interface AuthPayload {
  payInstrument: {
    headDetails: {
      api: string;                    // API Name
      platform: string;              // Platform Name
      version: string;                // Version of the API
    };
    merchDetails: {
      merchId: string;                // NDPS Merchant MID (max 10 chars)
      password: string;               // Transaction Password (max 80 chars)
      merchTxnId: string;             // Unique Transaction Reference (max 50 chars)
      merchTxnDate: string;           // YYYY-MM-DD hh:mm:ss (max 19 chars)
      userId?: string;                // Customer User ID (max 45 chars)
    };
    payDetails: {
      amount: number;                 // Total Amount (max 10 digits prior to decimal)
      product: string;                // Settlement account number (max 50 chars)
      txnCurrency: string;            // Currency Type (max 5 chars)
      custAccNo?: string;             // Customer account (max 45 chars, TPV only)
    };
    custDetails: {
      custEmail: string;              // Email (max 100 chars, email format)
      custMobile: string;             // Mobile (max 20 chars)
    };
    extras?: {
      udf1?: string;                  // User Defined Parameter 1 (max 45 chars)
      udf2?: string;                  // User Defined Parameter 2 (max 45 chars)
      udf3?: string;                  // User Defined Parameter 3 (max 45 chars)
      udf4?: string;                  // User Defined Parameter 4 (max 45 chars)
      udf5?: string;                  // User Defined Parameter 5 (max 45 chars)
    };
    payModeSpecificData?: {
      subChannel?: string;            // Payment mode (max 40 chars)
    };
  };
}
```

#### **成功レスポンス (200)**
```typescript
interface AuthSuccessResponse {
  atomTokenId: number;              // 例: 15000000033303
  responseDetails: {
    txnMessage: string;             // "SUCCESS"
    txnStatusCode: string;          // "OTS0000"
    txnDescription: string;         // "ATOM TOKEN ID HAS BEEN GENERATED SUCCESSFULLY"
  };
}
```

#### **エラーレスポンス (400, 401, 402, 403)**
```typescript
interface AuthErrorResponse {
  encData: string | null;
  txnMessage: string;
  txnStatusCode: string;
  txnDescription: string;
}
```

---

### **2. Get Transaction Status API**

#### **リクエストペイロード**
```json
{
  "payInstrument": {
    "payDetails": {
      "amount": 1,
      "signature": "ccfe5e82ecd513a866ef95bb4f462f7912cb8f4ca785a9fd9fb02e64f2a9e4cbe67788512f5a0bbadd81206b84d80a54a62c300eb8f8164182abe54fab71e1cd",
      "txnCurrency": "INR"
    },
    "merchDetails": {
      "merchId": 317157,
      "merchTxnId": "63d12a8782587dda",
      "merchTxnDate": "2024-01-16"
    }
  }
}
```

#### **TypeScript型定義**
```typescript
interface TransactionStatusPayload {
  payInstrument: {
    payDetails: {
      amount: number;                 // Total Amount (max 12,2 characters)
      signature: string;              // NDPS signature (max 256 chars)
      txnCurrency: string;            // Currency Type (max 5 chars)
    };
    merchDetails: {
      merchId: number;                // NDPS Merchant ID (max 10 chars)
      merchTxnId: string;             // Merchant Transaction ID (max 50 chars)
      merchTxnDate: string;           // Date in yyyy-MM-dd format (max 10 chars)
    };
  };
}
```

#### **成功レスポンス**
```typescript
interface TransactionStatusResponse {
  payInstrument: {
    payDetails: {
      amount: number;
      product: string;
      atomTxnId: number;              // 重要: リファンドで使用
      prodDetails: Array<{
        prodName: string;
        prodAmount: number;
      }>;
      totalAmount: number;
      surchargeAmount: number;
    };
    merchDetails: {
      merchId: number;
      clientCode: string;
      merchTxnId: string;
      merchTxnDate: string;
    };
    responseDetails: {
      message: string;
      statusCode: string;             // OTS0000 = 成功
      description: string;
    };
    settlementDetails: {
      reconStatus: string;            // RS, RNS, NRNS, PNRNS, PNRS
    };
    payModeSpecificData: {
      subChannel: string;
      bankDetails: {
        bankTxnId: string;
        otsBankName: string;
      };
    };
  };
}
```

---

### **3. Callback API**

#### **レスポンス構造**
```typescript
interface CallbackResponse {
  payInstrument: {
    payDetails: {
      amount: number;
      atomTxnId: number;              // 重要: リファンドで使用
      custAccNo: string;
      clientCode: string;
      prodDetails: Array<{
        prodName: string;
        prodAmount: number;
      }>;
      totalAmount: number;
      txnInitDate: string;
      surchargeAmount: number;
      txnCompleteDate: string;
      signature: string;              // 重要: 検証必須
    };
    merchDetails: {
      merchId: number;
      merchTxnId: string;
      merchTxnDate: string;
    };
    responseDetails: {
      message: string;
      statusCode: string;             // OTS0000 = 成功
      description: string;
    };
    payModeSpecificData: {
      subChannel: string;
      bankDetails: {
        bankTxnId: string;
        otsBankId: string;
        otsBankName: string;
      };
      cardDetails: {
        cardScheme: string;
        cardMaskNumber: string;
      };
    };
  };
}
```

#### **ステータス遷移表**
| Initial Status | Final Status | Timeframe | Description |
|----------------|--------------|-----------|-------------|
| Initiated | Success | Real time | 取引成功時 |
| Pending | Success | T day | NDPS側保留、銀行側成功 |
| Success | Success | T+1 | T+1日後調整後の保留 |
| Failed | Failed | T+1 | T+1日後調整後の失敗 |
| Initiated | Failed | T day | T日に取引失敗 |
| Success | Auto reversal | T+2 | T+2後の自動取消 |
| Challan Generated | Pending | T day | チャラン生成、未払い |
| Challan Paid | Success | T day | チャラン生成、支払済み |

---

### **4. Product Sample Refund Request API**

#### **リクエストペイロード**
```json
{
  "payInstrument": {
    "headDetails": {
      "api": "REFUNDINIT",
      "source": "OTS"
    },
    "merchDetails": {
      "merchId": 317157,
      "password": "Test@123",
      "merchTxnId": "6545e02c9d835"
    },
    "payDetails": {
      "atomTxnId": 11000000460337,
      "signature": "a4df464724d1154cf2d33baf9b08cb6740637040e46d29034de472445b0df68af31de3c7089c0355bf0b5c887d568cd87b43a7b875ded9de8c9c946d4e57d40d",
      "prodDetails": [
        {
          "prodName": "NSE",
          "prodRefundId": "refund1",
          "prodRefundAmount": 5
        }
      ],
      "txnCurrency": "INR",
      "totalRefundAmount": 5
    }
  }
}
```

#### **TypeScript型定義**
```typescript
interface RefundPayload {
  payInstrument: {
    headDetails: {
      api: string;                    // "REFUNDINIT" for Refund API (max 20 chars)
      source?: string;                // ソース識別子
    };
    merchDetails: {
      merchId: number;                // NDPS Merchant ID (max 15 chars)
      password: string;               // Merchant password (max 45 chars)
      merchTxnId: string;             // Merchant Transaction ID (max 50 chars)
    };
    payDetails: {
      atomTxnId: number;              // NDPS Transaction ID (max 14 chars)
      signature: string;              // 署名 (max 256 chars)
      prodDetails: Array<{
        prodName: string;
        prodRefundId: string;
        prodRefundAmount: number;
      }>;
      txnCurrency: string;            // 通貨コード (max 5 chars)
      totalRefundAmount: number;      // 総リファンド金額 (max 12,2 chars)
    };
  };
}
```

#### **成功レスポンス**
```typescript
interface RefundResponse {
  payInstrument: {
    payDetails: {
      atomTxnId: number;
      prodDetails: Array<{
        prodName: string;
        refundTxnId: number;          // 重要: リファンド取引ID
        prodRefundId: string;
        prodStatusCode: string;       // OTS0000 = 成功
        prodDescription: string;
        prodRefundAmount: number;
      }>;
      txnCurrency: string;
      totalRefundAmount: number;
    };
    responseDetails: {
      message: string;
      statusCode: string;             // OTS0000 = 成功
      description: string;
    };
  };
}
```

---

### **5. Get Refund Status API**

#### **リクエストペイロード**
```json
{
  "payInstrument": {
    "headDetails": {
      "api": "REFUNDSTATUS",
      "source": "OTS_ARS"
    },
    "merchDetails": {
      "merchId": 317157,
      "password": "VGVzdEAxMjM="
    },
    "payDetails": {
      "atomTxnId": 11000000460337,
      "prodDetails": [
        {
          "prodName": "NSE"
        }
      ]
    }
  }
}
```

#### **TypeScript型定義**
```typescript
interface RefundStatusPayload {
  payInstrument: {
    headDetails: {
      api: string;                    // "REFUNDSTATUS" 固定 (max 20 chars)
      source: string;                 // "OTS_ARS" 固定
    };
    merchDetails: {
      merchId: number;                // NDPS Merchant ID (max 15 chars)
      password: string;               // Base64エンコードされたパスワード (max 50 chars)
    };
    payDetails: {
      atomTxnId: number;              // Merchant Transaction ID (max 50 chars)
      prodDetails: Array<{
        prodName: string;
      }>;
    };
  };
}
```

#### **成功レスポンス**
```typescript
interface RefundStatusResponse {
  payInstrument: {
    payDetails: {
      atomTxnId: number;
    };
    responseDetails: {
      message: string;
      statusCode: string;             // OTS0000 = 成功
      description: string;
    };
    refundStatusDetails: Array<{
      prodName: string;
      refundStatus: Array<{
        remarks: string;
        refundAmt: number;
        refundTxnId: number;
        prodRefundId: string;
        refundInitiatedDate: string;
      }>;
    }>;
  };
}
```

---

## **署名生成ルール**

### **Transaction Status API署名**
```
署名文字列 = merchID + merchTxnID + amount + txnCurrency
```

### **Refund API署名**
```
署名文字列 = merchId + password + merchTxnId + total amount + txnCurrency + api
```

### **Callback署名検証**
```
署名文字列 = merchId + atomTxnId + merchTxnId + totalAmount.toFixed(2) + statusCode + subChannel[0] + bankTxnId
```

---

## **共通情報**

### **ReconStatus値の詳細**
- **RS**: Reconciled Settled (調整済み・決済済み)
- **RNS**: Reconciled Not Settled (調整済み・未決済)
- **NRNS**: Not Reconciled Not Settled (未調整・未決済)
- **PNRNS**: Not Reconciled Not Settled (T0決済で未調整・未決済)
- **PNRS**: Payment Not Reconciled Settled (未調整・決済済み)

### **暗号化キー例**
| MerchId | reqHashKey | respHashKey | encReqKey | encResKey |
|---------|------------|-------------|-----------|-----------|
| 317157 | KEY123657234 | KEYRESP123657234 | A4476C2062FFA58980DC8F79EB6A799E | 75AEF0FA1B94B3C10D4F5B268F757F11 |

### **HTTPステータスコード**
- **200**: Success
- **400**: VALIDATION FAILED
- **401**: AUTH SERVICE FAILED
- **402**: TOKEN GENERATION FAILED
- **403**: INVALID MERCHANT INFORMATION

---

## **送信形式**

### **全APIで共通**
```
Content-Type: application/x-www-form-urlencoded
Body: encData={暗号化されたJSON}&merchId={マーチャントID}
```

### **暗号化処理**
1. JSONペイロードを文字列化
2. AES-256-CBC + PBKDF2で暗号化
3. 16進数大文字で出力
4. URLエンコードして送信

### **復号化処理**
1. encDataパラメータを抽出
2. 16進数から바이너리に変換
3. AES-256-CBC + PBKDF2で復号化
4. JSON解析