# バックエンド認証実装ガイド

このドキュメントでは、Clerk認証を使用したバックエンドAPIの検証方法を説明します。

## 概要

フロントエンドは以下の2つの方法でバックエンドAPIを呼び出します：

1. **ユーザー認証付きAPI呼び出し**: Clerk JWTトークンを`Authorization`ヘッダーに含める
2. **Webhook呼び出し**: `X-Webhook-Secret`ヘッダーで認証する

## 1. ユーザー認証付きAPI呼び出しの検証

### フロントエンドからの送信内容

```typescript
Authorization: Bearer <Clerk JWT Token>
Content-Type: application/json
```

### バックエンド側の実装（必須）

#### 1.1 Clerk JWTトークンの検証

Clerkが発行したJWTトークンを検証する必要があります。各言語・フレームワークごとの実装方法：

##### Go (Gin) での実装例

```go
package middleware

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
    "github.com/clerk/clerk-sdk-go/v2"
    "github.com/clerk/clerk-sdk-go/v2/jwt"
)

func ClerkAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "認証トークンがありません"})
            c.Abort()
            return
        }

        // "Bearer " プレフィックスを削除
        token := strings.TrimPrefix(authHeader, "Bearer ")

        // Clerkトークンを検証
        claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
            Token: token,
        })
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "無効な認証トークンです"})
            c.Abort()
            return
        }

        // ユーザーIDをコンテキストに保存
        c.Set("clerkUserId", claims.Subject)
        c.Next()
    }
}

// 使用例
func main() {
    r := gin.Default()

    // 環境変数からClerk Secret Keyを設定
    clerk.SetKey(os.Getenv("CLERK_SECRET_KEY"))

    // 認証が必要なルート
    protected := r.Group("/api")
    protected.Use(ClerkAuthMiddleware())
    {
        protected.GET("/seats", getSeats)
        protected.POST("/seats", createSeat)
    }

    r.Run(":8080")
}

// コントローラーでユーザーIDを取得
func getSeats(c *gin.Context) {
    clerkUserId := c.GetString("clerkUserId")
    // clerkUserIdを使用してユーザー固有のデータを取得
}
```

##### Node.js (Express) での実装例

```javascript
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function clerkAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: '認証トークンがありません' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Clerkトークンを検証
    const verifiedToken = await clerkClient.verifyToken(token);

    // ユーザーIDをリクエストに保存
    req.clerkUserId = verifiedToken.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: '無効な認証トークンです' });
  }
}

// 使用例
app.use('/api', clerkAuthMiddleware);

app.get('/api/seats', (req, res) => {
  const clerkUserId = req.clerkUserId;
  // clerkUserIdを使用してユーザー固有のデータを取得
});
```

##### Spring Boot (Java) での実装例

```java
import com.clerk.backend_api.Clerk;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ClerkAuthFilter extends OncePerRequestFilter {

    @Value("${clerk.secret-key}")
    private String clerkSecretKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"認証トークンがありません\"}");
            return;
        }

        String token = authHeader.substring(7);

        try {
            Clerk clerk = Clerk.builder().bearerAuth(clerkSecretKey).build();
            var verifiedToken = clerk.jwt().verifyToken(token);

            // ユーザーIDをリクエスト属性に保存
            request.setAttribute("clerkUserId", verifiedToken.getSub());
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"無効な認証トークンです\"}");
        }
    }
}
```

#### 1.2 環境変数の設定

バックエンドの`.env`ファイルに以下を追加：

```env
# ClerkのSecret Key（フロントエンドのCLERK_SECRET_KEYと同じ値）
CLERK_SECRET_KEY=sk_test_VAObOw9utR9C5GZLyRaMG19sFOsXhsuXYAFz2fQ8Yg

# Clerk Publishable Key（検証に使用する場合）
CLERK_PUBLISHABLE_KEY=pk_test_ZnVuLW11bGxldC01OC5jbGVyay5hY2NvdW50cy5kZXYk
```

#### 1.3 Clerk SDKのインストール

各言語のSDKをインストール：

**Go:**
```bash
go get github.com/clerk/clerk-sdk-go/v2
```

**Node.js:**
```bash
npm install @clerk/clerk-sdk-node
```

**Java:**
```xml
<dependency>
    <groupId>com.clerk</groupId>
    <artifactId>backend-api</artifactId>
    <version>最新バージョン</version>
</dependency>
```

**Python:**
```bash
pip install clerk-backend-api
```

## 2. Webhook呼び出しの検証

Clerk Webhookからバックエンドへのユーザー同期呼び出しを検証します。

### フロントエンド（Next.js Webhook）からの送信内容

```typescript
X-Webhook-Secret: <共有シークレットキー>
Content-Type: application/json

// Body例（user.created）
{
  "clerkUserId": "user_xxxxx",
  "email": "user@example.com",
  "name": "山田 太郎",
  "avatarUrl": "https://...",
  "primaryAuthProvider": "email_code"
}
```

### バックエンド側の実装（必須）

#### 2.1 シークレットキーの検証

##### Go (Gin) での実装例

```go
func WebhookAuthMiddleware() gin.HandlerFunc {
    webhookSecret := os.Getenv("BACKEND_API_SECRET")

    return func(c *gin.Context) {
        receivedSecret := c.GetHeader("X-Webhook-Secret")

        if receivedSecret == "" || receivedSecret != webhookSecret {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なWebhookシークレット"})
            c.Abort()
            return
        }

        c.Next()
    }
}

// 使用例
func main() {
    r := gin.Default()

    webhook := r.Group("/api")
    webhook.Use(WebhookAuthMiddleware())
    {
        webhook.POST("/users", createUserFromWebhook)
        webhook.PUT("/users/:id", updateUserFromWebhook)
    }

    r.Run(":8080")
}
```

##### Node.js (Express) での実装例

```javascript
function webhookAuthMiddleware(req, res, next) {
  const webhookSecret = process.env.BACKEND_API_SECRET;
  const receivedSecret = req.headers['x-webhook-secret'];

  if (!receivedSecret || receivedSecret !== webhookSecret) {
    return res.status(401).json({ error: '無効なWebhookシークレット' });
  }

  next();
}

// 使用例
app.post('/api/users', webhookAuthMiddleware, createUserFromWebhook);
app.put('/api/users/:id', webhookAuthMiddleware, updateUserFromWebhook);
```

#### 2.2 環境変数の設定

バックエンドの`.env`ファイルに以下を追加：

```env
# Webhook検証用シークレット（フロントエンドのBACKEND_API_SECRETと同じ値）
BACKEND_API_SECRET=your-secure-secret-key-here
```

**⚠️ 重要:** 本番環境では、強力なランダム文字列を使用してください：

```bash
# ランダムシークレットの生成例
openssl rand -base64 32
```

#### 2.3 ユーザー作成・更新エンドポイントの実装

##### Go (Gin) での実装例

```go
type CreateUserRequest struct {
    ClerkUserId          string `json:"clerkUserId" binding:"required"`
    Email                string `json:"email" binding:"required,email"`
    Name                 string `json:"name" binding:"required"`
    AvatarUrl            string `json:"avatarUrl"`
    PrimaryAuthProvider  string `json:"primaryAuthProvider"`
}

func createUserFromWebhook(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // データベースにユーザーを作成
    user := models.User{
        ClerkUserId:         req.ClerkUserId,
        Email:               req.Email,
        Name:                req.Name,
        AvatarUrl:           req.AvatarUrl,
        PrimaryAuthProvider: req.PrimaryAuthProvider,
    }

    if err := db.Create(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザーの作成に失敗しました"})
        return
    }

    c.JSON(http.StatusCreated, user)
}

func updateUserFromWebhook(c *gin.Context) {
    clerkUserId := c.Param("id")

    var req struct {
        Email     string `json:"email"`
        Name      string `json:"name"`
        AvatarUrl string `json:"avatarUrl"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // データベースのユーザーを更新
    if err := db.Model(&models.User{}).
        Where("clerk_user_id = ?", clerkUserId).
        Updates(map[string]interface{}{
            "email":      req.Email,
            "name":       req.Name,
            "avatar_url": req.AvatarUrl,
        }).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザーの更新に失敗しました"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "ユーザーを更新しました"})
}
```

## 3. データベーススキーマ

ユーザーテーブルには以下のカラムが必要です：

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,  -- Clerkのユーザーid
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    primary_auth_provider VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- clerk_user_idにインデックスを作成（検索の高速化）
CREATE INDEX idx_clerk_user_id ON users(clerk_user_id);
```

## 4. セキュリティチェックリスト

### ✅ 必須の実装

- [ ] Clerk JWTトークンの検証を実装
- [ ] Webhookシークレットキーの検証を実装
- [ ] 環境変数にシークレットキーを保存（コードに直接書かない）
- [ ] HTTPSを使用（本番環境）
- [ ] CORS設定を適切に行う

### ✅ 推奨の実装

- [ ] レート制限（Rate Limiting）の実装
- [ ] ログ記録（認証失敗、異常なアクセス）
- [ ] トークンのキャッシング（パフォーマンス向上）
- [ ] エラーハンドリングの改善
- [ ] リトライロジック（Webhook処理失敗時）

## 5. CORS設定

フロントエンド（Next.js）からのAPI呼び出しを許可するために、バックエンドでCORSを設定します。

### Go (Gin) での実装例

```go
import "github.com/gin-contrib/cors"

func main() {
    r := gin.Default()

    // CORS設定
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000", "https://your-domain.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Webhook-Secret"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))

    // ... ルート定義
}
```

### Node.js (Express) での実装例

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'Content-Type', 'Authorization', 'X-Webhook-Secret'],
  credentials: true,
}));
```

## 6. テスト方法

### 6.1 JWTトークンの取得（開発環境）

フロントエンドで以下のコードを実行してトークンを取得：

```typescript
// クライアントコンポーネント内で
const { getToken } = useAuth();
const token = await getToken();
console.log('JWT Token:', token);
```

### 6.2 curlでのテスト

```bash
# ユーザー認証付きAPIのテスト
curl -X GET http://localhost:8080/api/seats \
  -H "Authorization: Bearer <取得したJWTトークン>" \
  -H "Content-Type: application/json"

# Webhookのテスト
curl -X POST http://localhost:8080/api/users \
  -H "X-Webhook-Secret: your-secure-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "clerkUserId": "user_test123",
    "email": "test@example.com",
    "name": "テストユーザー",
    "avatarUrl": "https://example.com/avatar.jpg",
    "primaryAuthProvider": "email_code"
  }'
```

## 7. トラブルシューティング

### 問題: "無効な認証トークンです"エラー

**原因:**
- Clerk Secret Keyが正しく設定されていない
- トークンが期限切れ
- トークンのフォーマットが不正

**解決策:**
1. `.env`ファイルの`CLERK_SECRET_KEY`を確認
2. フロントエンドで新しいトークンを取得
3. トークンに"Bearer "プレフィックスが含まれているか確認

### 問題: CORS エラー

**原因:**
- バックエンドのCORS設定が不足

**解決策:**
1. `Access-Control-Allow-Origin`ヘッダーを設定
2. `Access-Control-Allow-Headers`に`Authorization`を追加
3. `OPTIONS`メソッドを許可

### 問題: Webhookが動作しない

**原因:**
- `BACKEND_API_SECRET`がフロントエンドとバックエンドで一致していない
- Webhookエンドポイントが公開されていない

**解決策:**
1. 両方の`.env`ファイルでシークレットキーを確認
2. ネットワーク設定を確認（ファイアウォール、ポート開放）

## 8. 参考リンク

- [Clerk Backend API Documentation](https://clerk.com/docs/backend-requests/overview)
- [Clerk JWT Verification](https://clerk.com/docs/backend-requests/handling/manual-jwt)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks/overview)

---

**作成日**: 2025年1月26日
**最終更新**: 2025年1月26日
