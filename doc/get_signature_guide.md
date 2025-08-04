# Atom Payment Gateway 署名生成ガイド

## 🔐 **署名の基本仕様**

### **アルゴリズム**
```yaml
署名方式: HMAC-SHA512
出力形式: 16進数文字列（小文字）
文字エンコード: UTF-8
```

### **ハッシュキー（環境別）**
```yaml
リクエスト署名: "KEY123657234"
レスポンス検証: "KEYRESP123657234"
```

---

## 📤 **API別署名生成ルール**

### **1. Transaction Status API署名生成**
```
署名文字列 = merchID + merchTxnID + amount + txnCurrency
```

#### **具体例**
```javascript
// 入力データ
const data = {
  merchId: 317157,
  merchTxnId: "63d12a8782587dda",
  amount: 1,
  txnCurrency: "INR"
};

// 署名文字列を構築
const signatureString = 
  "317157" +                    // merchId
  "63d12a8782587dda" +         // merchTxnId
  "1" +                        // amount（整数）
  "INR";                       // txnCurrency

// 結果: "31715763d12a8782587dda1INR"

// HMAC-SHA512で署名
const signature = crypto.createHmac('sha512', 'KEY123657234')
  .update(signatureString)
  .digest('hex');
```

#### **実装関数**
```javascript
function generateTransactionStatusSignature(data) {
  const REQ_HASH_KEY = "KEY123657234";
  
  const signatureString = [
    data.merchId.toString(),
    data.merchTxnId.toString(),
    data.amount.toString(),        // 整数として処理
    data.txnCurrency.toString()
  ].join('');
  
  return crypto.createHmac('sha512', REQ_HASH_KEY)
    .update(signatureString)
    .digest('hex');
}
```

---

### **2. Refund API署名生成**
```
署名文字列 = merchId + password + merchTxnId + totalAmount + txnCurrency + api
```

#### **具体例**
```javascript
// 入力データ
const data = {
  merchId: 317157,
  password: "Test@123",
  merchTxnId: "6545e02c9d835",
  totalRefundAmount: 5,
  txnCurrency: "INR",
  api: "REFUNDINIT"
};

// 署名文字列を構築
const signatureString = 
  "317157" +              // merchId
  "Test@123" +           // password
  "6545e02c9d835" +      // merchTxnId
  "5" +                  // totalRefundAmount（整数）
  "INR" +                // txnCurrency
  "REFUNDINIT";          // api固定値

// 結果: "317157Test@1236545e02c9d8355INRREFUNDINIT"

// HMAC-SHA512で署名
const signature = crypto.createHmac('sha512', 'KEY123657234')
  .update(signatureString)
  .digest('hex');

// 期待される署名: "a4df464724d1154cf2d33baf9b08cb6740637040e46d29034de472445b0df68af31de3c7089c0355bf0b5c887d568cd87b43a7b875ded9de8c9c946d4e57d40d"
```

#### **実装関数**
```javascript
function generateRefundSignature(data) {
  const REQ_HASH_KEY = "KEY123657234";
  
  const signatureString = [
    data.merchId.toString(),
    data.password.toString(),
    data.merchTxnId.toString(),
    Math.floor(data.totalRefundAmount).toString(), // 整数に変換
    data.txnCurrency.toString(),
    "REFUNDINIT"                                   // API固定値
  ].join('');
  
  return crypto.createHmac('sha512', REQ_HASH_KEY)
    .update(signatureString)
    .digest('hex');
}
```

---

## 📥 **レスポンス署名検証**

### **Callback署名検証ルール**
```
署名文字列 = merchId + atomTxnId + merchTxnId + totalAmount + statusCode + subChannel + bankTxnId
```

#### **具体例**
```javascript
// Callbackレスポンスデータ
const callbackData = {
  payInstrument: {
    merchDetails: { 
      merchId: 317157, 
      merchTxnId: "Test123450" 
    },
    payDetails: { 
      atomTxnId: 11000000679315, 
      totalAmount: 1.00,
      signature: "67ff1444bee7255a..." 
    },
    payModeSpecificData: {
      subChannel: ["CC"],
      bankDetails: { 
        bankTxnId: "0011000000679315624" 
      }
    },
    responseDetails: { 
      statusCode: "OTS0000" 
    }
  }
};

// 署名文字列を構築
const r = callbackData.payInstrument;
const signatureString = 
  "317157" +                     // merchId
  "11000000679315" +             // atomTxnId
  "Test123450" +                 // merchTxnId
  "1.00" +                       // totalAmount（小数点2桁）
  "OTS0000" +                    // statusCode
  "CC" +                         // subChannel（配列の最初の要素）
  "0011000000679315624";         // bankTxnId

// サーバー側で署名を計算
const calculatedSignature = crypto.createHmac('sha512', 'KEYRESP123657234')
  .update(signatureString)
  .digest('hex');
```

#### **検証関数**
```javascript
function verifyCallbackSignature(callbackData) {
  const RES_HASH_KEY = "KEYRESP123657234";
  
  // レスポンスデータから値を抽出
  const r = callbackData.payInstrument;
  
  const signatureString = [
    r.merchDetails.merchId.toString(),
    r.payDetails.atomTxnId.toString(),
    r.merchDetails.merchTxnId.toString(),
    Number(r.payDetails.totalAmount).toFixed(2),  // 小数点2桁
    r.responseDetails.statusCode.toString(),
    r.payModeSpecificData.subChannel[0].toString(), // 配列の最初の要素
    r.payModeSpecificData.bankDetails.bankTxnId.toString()
  ].join('');
  
  // サーバー側署名を計算
  const calculatedSignature = crypto.createHmac('sha512', RES_HASH_KEY)
    .update(signatureString)
    .digest('hex');
  
  // 受信した署名と比較
  const receivedSignature = r.payDetails.signature;
  
  return {
    isValid: calculatedSignature === receivedSignature,
    calculated: calculatedSignature,
    received: receivedSignature,
    signatureString: signatureString
  };
}
```

---

## 🔍 **署名デバッグ用ツール**

### **統合デバッグ関数**
```javascript
function debugSignature(data, apiType) {
  console.log(`🔍 ${apiType} 署名デバッグ開始`);
  
  let parts = [];
  let hashKey = '';
  
  switch(apiType) {
    case 'transaction_status':
      parts = [
        { name: 'merchId', value: data.merchId.toString() },
        { name: 'merchTxnId', value: data.merchTxnId.toString() },
        { name: 'amount', value: data.amount.toString() },
        { name: 'txnCurrency', value: data.txnCurrency.toString() }
      ];
      hashKey = 'KEY123657234';
      break;
      
    case 'refund':
      parts = [
        { name: 'merchId', value: data.merchId.toString() },
        { name: 'password', value: data.password.toString() },
        { name: 'merchTxnId', value: data.merchTxnId.toString() },
        { name: 'totalRefundAmount', value: Math.floor(data.totalRefundAmount).toString() },
        { name: 'txnCurrency', value: data.txnCurrency.toString() },
        { name: 'api', value: 'REFUNDINIT' }
      ];
      hashKey = 'KEY123657234';
      break;
      
    case 'callback_verify':
      const r = data.payInstrument;
      parts = [
        { name: 'merchId', value: r.merchDetails.merchId.toString() },
        { name: 'atomTxnId', value: r.payDetails.atomTxnId.toString() },
        { name: 'merchTxnId', value: r.merchDetails.merchTxnId.toString() },
        { name: 'totalAmount', value: Number(r.payDetails.totalAmount).toFixed(2) },
        { name: 'statusCode', value: r.responseDetails.statusCode.toString() },
        { name: 'subChannel', value: r.payModeSpecificData.subChannel[0].toString() },
        { name: 'bankTxnId', value: r.payModeSpecificData.bankDetails.bankTxnId.toString() }
      ];
      hashKey = 'KEYRESP123657234';
      break;
  }
  
  console.log('署名構成要素:');
  parts.forEach((part, index) => {
    console.log(`${index + 1}. ${part.name}: "${part.value}" (長さ: ${part.value.length})`);
  });
  
  const signatureString = parts.map(p => p.value).join('');
  console.log(`\n署名文字列: "${signatureString}"`);
  console.log(`文字列長: ${signatureString.length}`);
  console.log(`ハッシュキー: ${hashKey}`);
  
  const signature = crypto.createHmac('sha512', hashKey)
    .update(signatureString)
    .digest('hex');
  
  console.log(`生成された署名: ${signature}`);
  
  return {
    signatureString,
    signature,
    parts
  };
}
```

---

## 📋 **API別署名チェックリスト**

### **Transaction Status API署名**
- [ ] `merchId`は数値を文字列化
- [ ] `merchTxnId`は元のマーチャント取引ID
- [ ] `amount`は整数（小数点なし）
- [ ] `txnCurrency`は通貨コード（通常INR）
- [ ] ハッシュキー`"KEY123657234"`を使用
- [ ] 署名文字列の順序: merchId → merchTxnId → amount → txnCurrency

### **Refund API署名**
- [ ] `merchId`は数値を文字列化
- [ ] `password`は正確なマーチャントパスワード
- [ ] `merchTxnId`は元の決済時と同じID
- [ ] `totalRefundAmount`は整数（小数点なし）
- [ ] `txnCurrency`は通貨コード（通常INR）
- [ ] API固定値`"REFUNDINIT"`を末尾に追加
- [ ] ハッシュキー`"KEY123657234"`を使用

### **Callback署名検証**
- [ ] `merchId`は数値を文字列化
- [ ] `atomTxnId`はAtomから返された値
- [ ] `merchTxnId`は自分で生成したID
- [ ] `totalAmount`は小数点2桁でフォーマット
- [ ] `statusCode`は`"OTS0000"`など
- [ ] `subChannel`は配列の最初の要素を取得
- [ ] `bankTxnId`は銀行取引ID
- [ ] ハッシュキー`"KEYRESP123657234"`を使用

---

## ⚠️ **よくある署名エラーと対処法**

### **1. OTS0506 (署名不一致) - Transaction Status**
```javascript
// ❌ 間違い: 小数点を含める
const amount = 1.00;
const signatureString = `${merchId}${merchTxnId}${amount}${currency}`;

// ✅ 正しい: 整数として処理
const amount = Math.floor(1.00); // 1
const signatureString = `${merchId}${merchTxnId}${amount}${currency}`;
```

### **2. OTS0506 (署名不一致) - Refund**
```javascript
// ❌ 間違い: 小数点を含める
const refundAmount = 5.00;
const signatureString = `${merchId}${password}${merchTxnId}${refundAmount}${currency}REFUNDINIT`;

// ✅ 正しい: 整数として処理  
const refundAmount = Math.floor(5.00); // 5
const signatureString = `${merchId}${password}${merchTxnId}${refundAmount}${currency}REFUNDINIT`;
```

### **3. Callback署名検証失敗**
```javascript
// ❌ 間違い: subChannelを文字列として取得
const subChannel = "CC";

// ✅ 正しい: 配列の最初の要素を取得
const subChannel = responseData.payModeSpecificData.subChannel[0]; // "CC"
```

---

## 🧪 **テストケース**

### **Transaction Status署名テスト**
```javascript
const testData = {
  merchId: 317157,
  merchTxnId: "63d12a8782587dda",
  amount: 1,
  txnCurrency: "INR"
};

const signature = generateTransactionStatusSignature(testData);
console.log('Transaction Status署名:', signature);
```

### **Refund署名テスト**
```javascript
const testData = {
  merchId: 317157,
  password: "Test@123",
  merchTxnId: "6545e02c9d835",
  totalRefundAmount: 5,
  txnCurrency: "INR"
};

const expectedSignature = "a4df464724d1154cf2d33baf9b08cb6740637040e46d29034de472445b0df68af31de3c7089c0355bf0b5c887d568cd87b43a7b875ded9de8c9c946d4e57d40d";
const actualSignature = generateRefundSignature(testData);

console.log('期待値:', expectedSignature);
console.log('実際値:', actualSignature);
console.log('一致:', actualSignature === expectedSignature);
```

### **統合テスト関数**
```javascript
function runAllSignatureTests() {
  const tests = [
    {
      name: "Transaction Status署名テスト",
      type: "transaction_status",
      data: {
        merchId: 317157,
        merchTxnId: "63d12a8782587dda",
        amount: 1,
        txnCurrency: "INR"
      }
    },
    {
      name: "Refund署名テスト",
      type: "refund", 
      data: {
        merchId: 317157,
        password: "Test@123",
        merchTxnId: "6545e02c9d835",
        totalRefundAmount: 5,
        txnCurrency: "INR"
      },
      expected: "a4df464724d1154cf2d33baf9b08cb6740637040e46d29034de472445b0df68af31de3c7089c0355bf0b5c887d568cd87b43a7b875ded9de8c9c946d4e57d40d"
    }
  ];
  
  tests.forEach(test => {
    try {
      console.log(`\n🧪 ${test.name}`);
      const result = debugSignature(test.data, test.type);
      
      if (test.expected) {
        const passed = result.signature === test.expected;
        console.log(`結果: ${passed ? '✅ PASS' : '❌ FAIL'}`);
        if (!passed) {
          console.log(`期待値: ${test.expected}`);
          console.log(`実際値: ${result.signature}`);
        }
      } else {
        console.log(`生成完了: ${result.signature}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  });
}
```