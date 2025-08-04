# Atom Payment Gateway データフロー図

## 🔄 **決済フロー全体図**

```mermaid
sequenceDiagram
    participant User as 👤 顧客
    participant Frontend as 🖥️ フロントエンド
    participant Backend as ⚙️ バックエンド
    participant DB as 🗄️ データベース
    participant Atom as 🏦 Atom API
    participant AtomUI as 💳 Atom決済画面

    User->>Frontend: 1. 商品をカートに追加
    Frontend->>Backend: 2. 注文作成リクエスト
    Backend->>DB: 3. 注文データ保存
    DB-->>Backend: 4. 注文ID返却
    
    Backend->>Backend: 5. 決済ペイロード作成
    Backend->>Backend: 6. ペイロード暗号化
    Backend->>Atom: 7. AUTH APIコール
    Atom-->>Backend: 8. atomTokenId返却
    
    Backend->>DB: 9. tokenId保存
    Backend-->>Frontend: 10. tokenId返却
    Frontend->>AtomUI: 11. 決済画面表示
    
    User->>AtomUI: 12. 決済情報入力
    AtomUI->>Atom: 13. 決済処理実行
    Atom->>Backend: 14. コールバック送信
    
    Backend->>Backend: 15. 署名検証
    Backend->>DB: 16. 注文ステータス更新
    Backend-->>Atom: 17. 処理完了応答
    
    AtomUI-->>User: 18. 決済完了画面
```

---

## 💸 **リファンドフロー詳細**

```mermaid
sequenceDiagram
    participant Admin as 👨‍💼 管理者
    participant Backend as ⚙️ バックエンド 
    participant DB as 🗄️ データベース
    participant Atom as 🏦 Atom API

    Admin->>Backend: 1. リファンド申請
    Backend->>DB: 2. 注文データ取得
    DB-->>Backend: 3. 注文情報返却
    
    Backend->>Backend: 4. リファンド可能性チェック
    Backend->>Backend: 5. 署名生成
    Backend->>Backend: 6. ペイロード暗号化
    
    Backend->>Atom: 7. REFUND APIコール
    Atom-->>Backend: 8. リファンド結果返却
    
    Backend->>Backend: 9. レスポンス復号化
    Backend->>DB: 10. ステータス更新
    Backend-->>Admin: 11. 処理結果返却
```

---

## 📊 **データ保存タイミング**

### **決済プロセス中のデータ保存**
```mermaid
flowchart TD
    A[カート作成] --> B[注文データ保存]
    B --> C[決済開始API呼び出し]
    C --> D[atomTokenId保存]
    D --> E[決済画面表示]
    E --> F[決済完了コールバック]
    F --> G[atomTxnId保存]
    G --> H[ステータス更新: paid]
    
    B --> B1[(orders テーブル<br/>status: pending)]
    D --> D1[(orders テーブル<br/>atomTokenId追加)]
    G --> G1[(orders テーブル<br/>atomTxnId追加<br/>status: paid)]
```

### **リファンドプロセス中のデータ保存**
```mermaid
flowchart TD
    A[リファンド申請] --> B[注文データ取得]
    B --> C[リファンドAPI呼び出し]
    C --> D[refundTxnId取得]
    D --> E[ステータス更新: refunded]
    
    B --> B1[(orders テーブル<br/>status: paid)]
    D --> D1[(refunds テーブル<br/>新規作成)]
    E --> E1[(orders テーブル<br/>status: refunded)]
```

---

## 🔐 **暗号化・署名フロー**

### **リクエスト処理フロー**
```mermaid
flowchart LR
    A[ペイロード作成] --> B[署名生成]
    B --> C[ペイロードに署名追加]  
    C --> D[JSON文字列化]
    D --> E[暗号化]
    E --> F[16進数変換]
    F --> G[HTTPリクエスト送信]
    
    B --> B1[文字列連結<br/>merchId+password+...]
    B1 --> B2[HMAC-SHA512]
    
    E --> E1[PBKDF2キー導出]
    E1 --> E2[AES-256-CBC暗号化]
```

### **レスポンス処理フロー**
```mermaid
flowchart LR
    A[HTTPレスポンス受信] --> B[encData抽出]
    B --> C[復号化]
    C --> D[JSON解析]
    D --> E[署名検証]
    E --> F{署名OK?}
    F -->|Yes| G[データ保存]
    F -->|No| H[エラー処理]
    
    C --> C1[16進数→バイナリ]
    C1 --> C2[AES-256-CBC復号化]
    
    E --> E1[署名文字列構築]
    E1 --> E2[HMAC-SHA512計算]
    E2 --> E3[受信署名と比較]
```

---

## 🗄️ **データベースアクセスパターン**

### **決済時のデータ操作**
```sql
-- 1. 注文作成
INSERT INTO orders (user_id, merch_txn_id, total_amount, status) 
VALUES (?, ?, ?, 'pending');

-- 2. atomTokenId保存
UPDATE orders 
SET atom_token_id = ?, updated_at = NOW() 
WHERE id = ?;

-- 3. 決済完了時
UPDATE orders 
SET atom_txn_id = ?, status = 'paid', payment_method = ?, updated_at = NOW()
WHERE merch_txn_id = ?;
```

### **リファンド時のデータ操作**
```sql
-- 1. 注文データ取得
SELECT id, atom_txn_id, merch_txn_id, total_amount, status 
FROM orders 
WHERE id = ? AND status = 'paid';

-- 2. リファンド記録作成
INSERT INTO refunds (order_id, refund_amount, refund_txn_id, status) 
VALUES (?, ?, ?, 'completed');

-- 3. 注文ステータス更新
UPDATE orders 
SET status = 'refunded', updated_at = NOW() 
WHERE id = ?;
```

---

## 📈 **エラーハンドリングフロー**

### **決済エラー処理**
```mermaid
flowchart TD
    A[API呼び出し] --> B{レスポンス受信}
    B -->|成功| C[データ保存]
    B -->|エラー| D[エラーコード確認]
    
    D --> E{エラー種別}
    E -->|認証エラー| F[認証情報確認]
    E -->|署名エラー| G[署名ロジック確認]
    E -->|システムエラー| H[再試行処理]
    E -->|その他| I[サポート連絡]
    
    F --> J[設定修正後再試行]
    G --> K[署名修正後再試行]
    H --> L{再試行回数チェック}
    L -->|制限内| M[指数バックオフ再試行]
    L -->|制限超過| N[エラー報告]
```

### **リカバリー処理**
```mermaid
flowchart TD
    A[処理失敗検出] --> B[失敗原因分析]
    B --> C{復旧可能?}
    C -->|Yes| D[自動復旧処理]
    C -->|No| E[手動対応必要]
    
    D --> F[データ整合性チェック]
    F --> G[不整合データ修正]
    G --> H[処理再実行]
    
    E --> I[管理者通知]
    I --> J[手動データ修正]
    J --> K[処理完了]
```

---

## 🔄 **ステータス遷移図**

### **注文ステータス遷移**
```mermaid
stateDiagram-v2
    [*] --> pending : 注文作成
    pending --> paid : 決済完了
    pending --> cancelled : 決済失敗/キャンセル
    paid --> shipped : 商品発送
    paid --> refunded : リファンド完了
    shipped --> delivered : 配送完了
    shipped --> refunded : 返品・リファンド
    delivered --> refunded : 返品・リファンド
    refunded --> [*]
    cancelled --> [*]
    delivered --> [*]
```

### **決済処理ステータス**
```mermaid
stateDiagram-v2
    [*] --> initializing : 決済開始
    initializing --> token_generated : tokenId取得
    token_generated --> user_payment : ユーザー決済中
    user_payment --> payment_success : 決済成功
    user_payment --> payment_failed : 決済失敗
    payment_success --> callback_received : コールバック受信
    callback_received --> signature_verified : 署名検証完了
    signature_verified --> completed : 処理完了
    payment_failed --> [*]
    completed --> [*]
```

---

## 📊 **パフォーマンス考慮事項**

### **ボトルネック箇所**
```mermaid
flowchart TD
    A[リクエスト受信] --> B[データベース接続]
    B --> C[暗号化処理]
    C --> D[外部API呼び出し]
    D --> E[レスポンス処理]
    
    B --> B1[⚠️ DB接続プール]
    C --> C1[⚠️ CPU集約的処理]
    D --> D1[⚠️ ネットワーク遅延]
    E --> E2[⚠️ 大量データ処理]
```

### **最適化ポイント**
- **データベース**: 接続プーリング、インデックス最適化
- **暗号化**: 非同期処理、キャッシュ活用
- **API呼び出し**: タイムアウト設定、リトライ機構
- **メモリ管理**: 大きなペイロードの分割処理

---

## 🔍 **監視・ログポイント**

### **監視すべきメトリクス**
```yaml
決済成功率: payment_success_rate
平均レスポンス時間: avg_response_time
エラー発生率: error_rate
API可用性: api_availability
署名検証失敗率: signature_failure_rate
```

### **ログ出力ポイント**
```javascript
// 重要なログポイント
logger.info('Payment initiated', { orderId, amount });
logger.info('Token received', { atomTokenId });
logger.info('Callback received', { atomTxnId, status });
logger.warn('Signature verification failed', { orderId });
logger.error('API call failed', { error, retryCount });
```