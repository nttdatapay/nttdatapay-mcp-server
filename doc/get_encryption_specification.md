# Atom Payment Gateway 暗号化仕様書 - 完全版

## 🔐 **暗号化アルゴリズム**

### **基本仕様**
```yaml
暗号化方式: AES-256-CBC
キー導出: PBKDF2
ハッシュ関数: SHA-512
初期化ベクター: 固定（0-15の連続値）
署名方式: HMAC-SHA512
```

### **パラメータ詳細**
```yaml
AES:
  - キー長: 256ビット (32バイト)
  - ブロックサイズ: 128ビット (16バイト)
  - モード: CBC (Cipher Block Chaining)

PBKDF2:
  - 反復回数: 65,536回
  - キー長: 32バイト
  - ハッシュ: SHA-512

IV (初期化ベクター):
  - 固定値: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
  - 長さ: 16バイト
```

---

## 🔑 **暗号化キー管理**

### **実際の暗号化キー例（MerchId: 317157）**
```yaml
reqHashKey: "KEY123657234"
respHashKey: "KEYRESP123657234"
encReqKey: "A4476C2062FFA58980DC8F79EB6A799E"
encResKey: "75AEF0FA1B94B3C10D4F5B268F757F11"
```

### **環境変数設定**
```bash
# リクエスト暗号化用
ATOM_REQ_KEY="A4476C2062FFA58980DC8F79EB6A799E"
ATOM_REQ_SALT="your_request_salt"

# レスポンス復号化用  
ATOM_RES_KEY="75AEF0FA1B94B3C10D4F5B268F757F11"
ATOM_RES_SALT="your_response_salt"

# 署名用ハッシュキー
ATOM_REQ_HASH_KEY="KEY123657234"
ATOM_RES_HASH_KEY="KEYRESP123657234"
```

### **キー導出プロセス**
```javascript
// PBKDF2でキーを導出
const derivedKey = crypto.pbkdf2Sync(
  key,        // 元のキー（16進数文字列を想定）
  salt,       // ソルト（文字列）
  65536,      // 反復回数
  32,         // キー長（バイト）
  'sha512'    // ハッシュ関数
);
```

---

## 💻 **JavaScript実装テンプレート**

### **完全な暗号化クラス**
```javascript
import crypto from 'crypto';

class AtomCrypto {
  constructor(reqKey, reqSalt, resKey, resSalt) {
    this.reqKey = reqKey;
    this.reqSalt = reqSalt;
    this.resKey = resKey;
    this.resSalt = resSalt;
    
    // 固定設定
    this.algorithm = 'aes-256-cbc';
    this.iv = Buffer.from([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
    this.iterations = 65536;
    this.keyLength = 32;
    this.hashAlgorithm = 'sha512';
  }
  
  // リクエスト暗号化
  encryptRequest(data) {
    try {
      // 1. JSON文字列化
      const jsonString = JSON.stringify(data);
      
      // 2. キー導出
      const key = crypto.pbkdf2Sync(
        this.reqKey, 
        this.reqSalt, 
        this.iterations, 
        this.keyLength, 
        this.hashAlgorithm
      );
      
      // 3. 暗号化
      const cipher = crypto.createCipheriv(this.algorithm, key, this.iv);
      let encrypted = cipher.update(jsonString, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // 4. 16進数大文字で出力
      return encrypted.toString('hex').toUpperCase();
      
    } catch (error) {
      throw new Error(`Request encryption failed: ${error.message}`);
    }
  }
  
  // レスポンス復号化
  decryptResponse(hexString) {
    try {
      // 1. キー導出
      const key = crypto.pbkdf2Sync(
        this.resKey, 
        this.resSalt, 
        this.iterations, 
        this.keyLength, 
        this.hashAlgorithm
      );
      
      // 2. 16進数をバイナリに変換
      const encrypted = Buffer.from(hexString, 'hex');
      
      // 3. 復号化
      const decipher = crypto.createDecipheriv(this.algorithm, key, this.iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // 4. JSON解析
      const jsonString = decrypted.toString('utf8');
      return JSON.parse(jsonString);
      
    } catch (error) {
      throw new Error(`Response decryption failed: ${error.message}`);
    }
  }
  
  // 送信用フォームデータ作成
  createFormData(data, merchId) {
    const encData = this.encryptRequest(data);
    return `encData=${encodeURIComponent(encData)}&merchId=${encodeURIComponent(merchId)}`;
  }
}
```

### **署名生成統合クラス**
```javascript
class AtomSignature {
  constructor() {
    this.reqHashKey = 'KEY123657234';
    this.resHashKey = 'KEYRESP123657234';
  }
  
  // Transaction Status API署名生成
  generateTransactionStatusSignature(data) {
    const signatureString = [
      data.merchId.toString(),
      data.merchTxnId.toString(),
      data.amount.toString(),          // 整数
      data.txnCurrency.toString()
    ].join('');
    
    return crypto.createHmac('sha512', this.reqHashKey)
      .update(signatureString)
      .digest('hex');
  }
  
  // Refund API署名生成
  generateRefundSignature(data) {
    const signatureString = [
      data.merchId.toString(),
      data.password.toString(),
      data.merchTxnId.toString(),
      Math.floor(data.totalRefundAmount).toString(), // 整数
      data.txnCurrency.toString(),
      'REFUNDINIT'
    ].join('');
    
    return crypto.createHmac('sha512', this.reqHashKey)
      .update(signatureString)
      .digest('hex');
  }
  
  // Callback署名検証
  verifyCallbackSignature(callbackData) {
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
    
    const calculatedSignature = crypto.createHmac('sha512', this.resHashKey)
      .update(signatureString)
      .digest('hex');
    
    const receivedSignature = r.payDetails.signature;
    
    return {
      isValid: calculatedSignature === receivedSignature,
      calculated: calculatedSignature,
      received: receivedSignature,
      signatureString: signatureString
    };
  }
}
```

---

## 🧪 **テスト用実装**

### **完全なテストスイート**
```javascript
class AtomCryptoTester {
  constructor() {
    this.crypto = new AtomCrypto(
      'A4476C2062FFA58980DC8F79EB6A799E',  // reqKey (sample)
      'test_request_salt',                  // reqSalt
      '75AEF0FA1B94B3C10D4F5B268F757F11',  // resKey (sample)
      'test_response_salt'                  // resSalt
    );
    this.signature = new AtomSignature();
  }
  
  // 暗号化・復号化テスト
  testEncryptionDecryption() {
    console.log('🧪 暗号化・復号化テスト');
    
    const testPayload = {
      payInstrument: {
        headDetails: {
          api: "AUTH",
          version: "OTSv1.1",
          platform: "FLASH"
        },
        merchDetails: {
          merchId: "317157",
          password: "Test@123",
          merchTxnId: "TEST_ENC_001",
          merchTxnDate: "2023-07-13 20:46:00"
        },
        payDetails: {
          amount: 1,
          product: "NSE",
          txnCurrency: "INR"
        }
      }
    };
    
    try {
      // 暗号化
      const encrypted = this.crypto.encryptRequest(testPayload);
      console.log('✅ 暗号化成功');
      console.log(`暗号化データ長: ${encrypted.length}`);
      console.log(`暗号化サンプル: ${encrypted.substring(0, 50)}...`);
      
      // 復号化（テスト用に同じキーを使用）
      const decrypted = this.crypto.decryptResponse(encrypted);
      console.log('✅ 復号化成功');
      
      // 整合性確認
      const isMatch = JSON.stringify(testPayload) === JSON.stringify(decrypted);
      console.log(`データ整合性: ${isMatch ? '✅ 正常' : '❌ 異常'}`);
      
      return { success: true, encrypted, decrypted, isMatch };
      
    } catch (error) {
      console.error('❌ 暗号化テスト失敗:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  // 署名テスト
  testSignatures() {
    console.log('🧪 署名生成・検証テスト');
    
    // Transaction Status署名テスト
    const statusData = {
      merchId: 317157,
      merchTxnId: "63d12a8782587dda",
      amount: 1,
      txnCurrency: "INR"
    };
    
    const statusSignature = this.signature.generateTransactionStatusSignature(statusData);
    console.log('✅ Transaction Status署名生成:', statusSignature);
    
    // Refund署名テスト（公開されている例と比較）
    const refundData = {
      merchId: 317157,
      password: "Test@123",
      merchTxnId: "6545e02c9d835",
      totalRefundAmount: 5,
      txnCurrency: "INR"
    };
    
    const refundSignature = this.signature.generateRefundSignature(refundData);
    const expectedRefundSig = "a4df464724d1154cf2d33baf9b08cb6740637040e46d29034de472445b0df68af31de3c7089c0355bf0b5c887d568cd87b43a7b875ded9de8c9c946d4e57d40d";
    
    console.log('✅ Refund署名生成:', refundSignature);
    console.log(`署名一致: ${refundSignature === expectedRefundSig ? '✅ 正常' : '❌ 異常'}`);
    
    return {
      statusSignature,
      refundSignature,
      refundMatch: refundSignature === expectedRefundSig
    };
  }
  
  // 統合テスト
  runAllTests() {
    console.log('🚀 Atom暗号化統合テスト開始');
    console.log('='.repeat(50));
    
    const encryptionResult = this.testEncryptionDecryption();
    const signatureResult = this.testSignatures();
    
    console.log('='.repeat(50));
    console.log('📊 テスト結果サマリー');
    console.log(`暗号化テスト: ${encryptionResult.success ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`署名テスト: ${signatureResult.refundMatch ? '✅ 成功' : '❌ 失敗'}`);
    
    const allPassed = encryptionResult.success && signatureResult.refundMatch;
    console.log(`総合結果: ${allPassed ? '✅ 全テスト成功' : '❌ 一部テスト失敗'}`);
    
    return { encryptionResult, signatureResult, allPassed };
  }
}
```

---

## 🐍 **Python実装テンプレート**

### **Python暗号化クラス**
```python
import hashlib
import hmac
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

class AtomCrypto:
    def __init__(self, req_key: str, req_salt: str, res_key: str, res_salt: str):
        self.req_key = bytes.fromhex(req_key)  # 16進数文字列からバイナリに変換
        self.req_salt = req_salt.encode('utf-8')
        self.res_key = bytes.fromhex(res_key)  # 16進数文字列からバイナリに変換
        self.res_salt = res_salt.encode('utf-8')
        
        # 固定設定
        self.iv = bytes(range(16))  # [0,1,2,3,...,15]
        self.iterations = 65536
        self.key_length = 32
        self.algorithm = algorithms.AES
        self.mode = modes.CBC
    
    def _derive_key(self, key: bytes, salt: bytes) -> bytes:
        """PBKDF2でキーを導出"""
        kdf = PBKDF2HMAC(
            algorithm=hashlib.sha512(),
            length=self.key_length,
            salt=salt,
            iterations=self.iterations,
            backend=default_backend()
        )
        return kdf.derive(key)
    
    def _pad(self, data: bytes) -> bytes:
        """PKCS7パディング"""
        block_size = 16
        padding_length = block_size - (len(data) % block_size)
        padding = bytes([padding_length] * padding_length)
        return data + padding
    
    def _unpad(self, data: bytes) -> bytes:
        """PKCS7パディング除去"""
        padding_length = data[-1]
        return data[:-padding_length]
    
    def encrypt_request(self, data: dict) -> str:
        """リクエストデータを暗号化"""
        try:
            # 1. JSON文字列化
            json_string = json.dumps(data, separators=(',', ':'))
            
            # 2. キー導出
            key = self._derive_key(self.req_key, self.req_salt)
            
            # 3. 暗号化
            cipher = Cipher(self.algorithm(key), self.mode(self.iv), backend=default_backend())
            encryptor = cipher.encryptor()
            
            # データをパディングして暗号化
            padded_data = self._pad(json_string.encode('utf-8'))
            encrypted = encryptor.update(padded_data) + encryptor.finalize()
            
            # 4. 16進数大文字で出力
            return encrypted.hex().upper()
            
        except Exception as e:
            raise Exception(f"Request encryption failed: {str(e)}")
    
    def decrypt_response(self, hex_string: str) -> dict:
        """レスポンスデータを復号化"""
        try:
            # 1. キー導出
            key = self._derive_key(self.res_key, self.res_salt)
            
            # 2. 16進数をバイナリに変換
            encrypted_data = bytes.fromhex(hex_string)
            
            # 3. 復号化
            cipher = Cipher(self.algorithm(key), self.mode(self.iv), backend=default_backend())
            decryptor = cipher.decryptor()
            
            decrypted_padded = decryptor.update(encrypted_data) + decryptor.finalize()
            decrypted = self._unpad(decrypted_padded)
            
            # 4. JSON解析
            json_string = decrypted.decode('utf-8')
            return json.loads(json_string)
            
        except Exception as e:
            raise Exception(f"Response decryption failed: {str(e)}")

class AtomSignature:
    def __init__(self):
        self.req_hash_key = b"KEY123657234"
        self.res_hash_key = b"KEYRESP123657234"
    
    def generate_transaction_status_signature(self, data: dict) -> str:
        """Transaction Status API用署名生成"""
        signature_string = (
            str(data['merchId']) +
            str(data['merchTxnId']) +
            str(data['amount']) +
            str(data['txnCurrency'])
        )
        
        return hmac.new(
            self.req_hash_key,
            signature_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
    
    def generate_refund_signature(self, data: dict) -> str:
        """Refund API用署名生成"""
        signature_string = (
            str(data['merchId']) +
            str(data['password']) +
            str(data['merchTxnId']) +
            str(int(data['totalRefundAmount'])) +  # 整数変換
            str(data['txnCurrency']) +
            "REFUNDINIT"
        )
        
        return hmac.new(
            self.req_hash_key,
            signature_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
    
    def verify_callback_signature(self, callback_data: dict) -> dict:
        """Callback署名検証"""
        r = callback_data['payInstrument']
        
        signature_string = (
            str(r['merchDetails']['merchId']) +
            str(r['payDetails']['atomTxnId']) +
            str(r['merchDetails']['merchTxnId']) +
            f"{float(r['payDetails']['totalAmount']):.2f}" +  # 小数点2桁
            str(r['responseDetails']['statusCode']) +
            str(r['payModeSpecificData']['subChannel'][0]) +  # 配列の最初
            str(r['payModeSpecificData']['bankDetails']['bankTxnId'])
        )
        
        calculated_signature = hmac.new(
            self.res_hash_key,
            signature_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        received_signature = r['payDetails']['signature']
        
        return {
            'is_valid': calculated_signature == received_signature,
            'calculated': calculated_signature,
            'received': received_signature,
            'signature_string': signature_string
        }
```

---

## 🐹 **Go実装テンプレート**

### **Go暗号化実装**
```go
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/hmac"
    "crypto/sha512"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "golang.org/x/crypto/pbkdf2"
    "math"
    "strconv"
    "strings"
)

type AtomCrypto struct {
    ReqKey    []byte
    ReqSalt   []byte
    ResKey    []byte
    ResSalt   []byte
    IV        []byte
    Algorithm string
}

func NewAtomCrypto(reqKey, reqSalt, resKey, resSalt string) *AtomCrypto {
    // 16進数文字列をバイナリに変換
    reqKeyBytes, _ := hex.DecodeString(reqKey)
    resKeyBytes, _ := hex.DecodeString(resKey)
    
    // 固定IV [0,1,2,3,...,15]
    iv := make([]byte, 16)
    for i := 0; i < 16; i++ {
        iv[i] = byte(i)
    }
    
    return &AtomCrypto{
        ReqKey:  reqKeyBytes,
        ReqSalt: []byte(reqSalt),
        ResKey:  resKeyBytes,
        ResSalt: []byte(resSalt),
        IV:      iv,
    }
}

func (ac *AtomCrypto) EncryptRequest(data interface{}) (string, error) {
    // 1. JSON文字列化
    jsonBytes, err := json.Marshal(data)
    if err != nil {
        return "", fmt.Errorf("JSON marshal failed: %v", err)
    }
    
    // 2. キー導出
    key := pbkdf2.Key(ac.ReqKey, ac.ReqSalt, 65536, 32, sha512.New)
    
    // 3. AES暗号化
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", fmt.Errorf("AES cipher creation failed: %v", err)
    }
    
    // パディング
    paddedData := ac.pad(jsonBytes)
    
    // CBC暗号化
    mode := cipher.NewCBCEncrypter(block, ac.IV)
    encrypted := make([]byte, len(paddedData))
    mode.CryptBlocks(encrypted, paddedData)
    
    // 4. 16進数大文字で出力
    return strings.ToUpper(hex.EncodeToString(encrypted)), nil
}

func (ac *AtomCrypto) DecryptResponse(hexString string) (map[string]interface{}, error) {
    // 1. キー導出
    key := pbkdf2.Key(ac.ResKey, ac.ResSalt, 65536, 32, sha512.New)
    
    // 2. 16進数をバイナリに変換
    encrypted, err := hex.DecodeString(hexString)
    if err != nil {
        return nil, fmt.Errorf("hex decode failed: %v", err)
    }
    
    // 3. AES復号化
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, fmt.Errorf("AES cipher creation failed: %v", err)
    }
    
    mode := cipher.NewCBCDecrypter(block, ac.IV)
    decrypted := make([]byte, len(encrypted))
    mode.CryptBlocks(decrypted, encrypted)
    
    // パディング除去
    unpaddedData := ac.unpad(decrypted)
    
    // 4. JSON解析
    var result map[string]interface{}
    err = json.Unmarshal(unpaddedData, &result)
    if err != nil {
        return nil, fmt.Errorf("JSON unmarshal failed: %v", err)
    }
    
    return result, nil
}

func (ac *AtomCrypto) pad(data []byte) []byte {
    blockSize := 16
    paddingLength := blockSize - (len(data) % blockSize)
    padding := make([]byte, paddingLength)
    for i := range padding {
        padding[i] = byte(paddingLength)
    }
    return append(data, padding...)
}

func (ac *AtomCrypto) unpad(data []byte) []byte {
    paddingLength := int(data[len(data)-1])
    return data[:len(data)-paddingLength]
}

// 署名生成
type AtomSignature struct {
    ReqHashKey []byte
    ResHashKey []byte
}

func NewAtomSignature() *AtomSignature {
    return &AtomSignature{
        ReqHashKey: []byte("KEY123657234"),
        ResHashKey: []byte("KEYRESP123657234"),
    }
}

func (as *AtomSignature) GenerateRefundSignature(data map[string]interface{}) string {
    signatureString := fmt.Sprintf("%v%v%v%v%v%s",
        data["merchId"],
        data["password"],
        data["merchTxnId"],
        int(data["totalRefundAmount"].(float64)), // 整数変換
        data["txnCurrency"],
        "REFUNDINIT",
    )
    
    h := hmac.New(sha512.New, as.ReqHashKey)
    h.Write([]byte(signatureString))
    return hex.EncodeToString(h.Sum(nil))
}
```

---

## ⚠️ **実装時の重要な注意点**

### **1. キー形式の統一**
```javascript
// ❌ 間違い: 文字列のまま使用
const key = "A4476C2062FFA58980DC8F79EB6A799E";

// ✅ 正しい: 16進数文字列をバイナリに変換
const key = Buffer.from("A4476C2062FFA58980DC8F79EB6A799E", 'hex');
```

### **2. IV（初期化ベクター）の固定値**
```javascript
// ✅ 必ず固定値を使用
const IV = Buffer.from([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);

// ❌ ランダムIVは使用しない（通常のセキュリティ実装と異なる）
const IV = crypto.randomBytes(16); // 使用禁止
```

### **3. 出力形式の統一**
```javascript
// ✅ 暗号化結果は16進数大文字
return encrypted.toString('hex').toUpperCase();

// ✅ 署名は16進数小文字
return hmac.digest('hex');
```

### **4. エラーハンドリング**
```javascript
function safeAtomOperation(operation) {
  try {
    return operation();
  } catch (error) {
    // 機密情報をログに出力しない
    if (error.message.includes('key') || error.message.includes('password')) {
      console.error('Atom crypto operation failed: [REDACTED]');
    } else {
      console.error('Atom crypto operation failed:', error.message);
    }
    throw new Error('Cryptographic operation failed');
  }
}
```

---

## 🔧 **本番環境での最適化**

### **パフォーマンス最適化**
```javascript
class OptimizedAtomCrypto extends AtomCrypto {
  constructor(reqKey, reqSalt, resKey, resSalt) {
    super(reqKey, reqSalt, resKey, resSalt);
    
    // キーを事前計算してキャッシュ
    this.derivedReqKey = crypto.pbkdf2Sync(this.reqKey, this.reqSalt, 65536, 32, 'sha512');
    this.derivedResKey = crypto.pbkdf2Sync(this.resKey, this.resSalt, 65536, 32, 'sha512');
  }
  
  encryptRequest(data) {
    // 事前計算されたキーを使用
    const jsonString = JSON.stringify(data);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.derivedReqKey, this.iv);
    
    let encrypted = cipher.update(jsonString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return encrypted.toString('hex').toUpperCase();
  }
  
  decryptResponse(hexString) {
    // 事前計算されたキーを使用
    const encrypted = Buffer.from(hexString, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.derivedResKey, this.iv);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }
}
```

### **メモリ効率の最適化**
```javascript
// 大きなペイロードの場合はストリーム処理
function encryptLargePayload(data, crypto) {
  const jsonString = JSON.stringify(data);
  
  if (jsonString.length > 1024 * 1024) { // 1MB以上
    console.warn('Large payload detected, consider streaming');
  }
  
  return crypto.encryptRequest(data);
}
```

---

## ⚠️ **セキュリティ注意事項**

### **キー管理**
1. **環境変数**: 暗号化キーは必ず環境変数で管理
2. **バージョン管理**: .envファイルをGitにコミットしない
3. **定期ローテーション**: キーの定期的な変更を推奨

### **実装注意点**
1. **固定IV**: IVは固定値を使用（通常はランダムが推奨だが仕様に準拠）
2. **文字エンコード**: UTF-8で統一
3. **エラーハンドリング**: 暗号化失敗時の適切な処理
4. **ログ出力**: 機密データをログに出力しない

### **本番環境での注意**
1. **HTTPS必須**: 通信は必ずHTTPS経由
2. **タイムアウト**: 適切なタイムアウト設定
3. **ログ監視**: 異常な暗号化エラーの監視
4. **バックアップ**: キーのセキュアなバックアップ