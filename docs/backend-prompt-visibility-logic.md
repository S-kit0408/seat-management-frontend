# バックエンド修正プロンプト：座席状態の可視性ロジック

以下のプロンプトをClaude CodeでGoバックエンドプロジェクトに渡してください。

---

## Claude Code へのプロンプト

```
【タスク】getVisibleReservations エンドポイントの可視性ロジック修正

【背景】
現在、座席の使用状況がユーザーのプライバシー設定によって隠されているため、
他のユーザーから予約中の座席が見えません。

例：
- ユーザーAが座席1を予約（プライバシー設定：private）
- ユーザーBが座席1の状態を見ると → 「可」と表示される（ユーザーAの予約が見えない）

これは実務上の大きな問題です。座席が実際に使用中かどうかは、
すべてのユーザーが知る必要がある情報です。

【目的】
座席の「使用状況」（in_use ステータスと reserved ステータス）については、
プライバシー設定を無視して全ユーザーに見えるようにします。

実装方針：
- in_use ステータスの予約 → 常に全員に見える
- reserved ステータスで開始時刻以降の予約 → 常に全員に見える
- その他のステータス（completed, cancelled, no_show） → 表示しない

【修正箇所】
ファイル：handlers/reservations.go（または同等のファイル）
関数名：GetVisibleReservations（またはそれに相当する関数）

【実装内容】

### 現在の処理（問題のある箇所）
getVisibleReservations で予約をフィルタリング時に、
プライバシー設定（privacy_setting）をチェックして予約を除外している箇所があると思われます。

問題のあるロジック例：
```go
if reservation.PrivacySetting == "private" && reservation.UserID != currentUserID {
  continue  // プライベート予約は除外
}
```

### 修正後の処理
以下のロジックに変更してください：

```go
// ステップ1：ステータスが in_use または reserved の場合、プライバシー設定を無視して返す
if reservation.Status == "in_use" || reservation.Status == "reserved" {
  // 時間制約のチェック：reserved の場合、開始時刻がまだ来ていない予約は除外
  if reservation.Status == "reserved" {
    if reservation.StartTime.After(now) {
      continue  // まだ開始していない予約は除外
    }
  }
  // プライバシー設定を無視して返す
  visibleReservations = append(visibleReservations, reservation)
  continue
}

// ステップ2：その他のステータスについてはプライバシー設定をチェック
if reservation.Status == "completed" || reservation.Status == "cancelled" || reservation.Status == "no_show" {
  continue  // 完了済み・キャンセル・欠席は表示しない
}

// ステップ3：その他のステータスについては既存のプライバシー設定ロジックを適用
if reservation.PrivacySetting == "private" && reservation.UserID != currentUserID {
  continue  // プライベート予約は除外
} else if reservation.PrivacySetting == "friends" && !isFriend(reservation.UserID, currentUserID) {
  continue  // フレンドのみ公開なら、フレンドでなければ除外
}

visibleReservations = append(visibleReservations, reservation)
```

【重要な注意点】
1. now（現在時刻）が正確に取得されていることを確認してください
2. reservation.StartTime と reservation.EndTime のタイムゾーンが JST に統一されていることを確認
3. reserved ステータスで開始時刻がまだ来ていない予約は除外（まだ使用されていない）

【テスト方法】
実装後、以下のシナリオでテストしてください：

1. ユーザーAが座席1を予約（プライバシー設定：private、ステータス：reserved、開始時刻：現在時刻から5分後）
2. ユーザーBが getVisibleReservations を呼び出す
3. **期待：** ユーザーAの予約が見える（プライバシー設定が private でも見える）
4. **理由：** reserved ステータスで開始時刻以降だから

別シナリオ：
1. ユーザーAが座席1の予約をチェックイン（ステータス：in_use、プライバシー設定：private）
2. ユーザーBが getVisibleReservations を呼び出す
3. **期待：** ユーザーAの予約が見える
4. **理由：** in_use ステータスだから

【実装完了後の確認】
- ビルドが成功すること
- 既存の単体テストがすべてパスすること
- GetVisibleReservations 関数の関連テストで以下を確認：
  - in_use 予約は全員に見える
  - reserved 予約（開始済み）は全員に見える
  - completed/cancelled/no_show 予約は見えない
  - public 予約は全員に見える
  - friends 予約はフレンドのみ見える
  - private 予約（in_use/reserved 以外）は本人と管理者のみ見える
```

---

## 補足情報

### ファイル構成例（参考）
```
backend/
├── handlers/
│   └── reservations.go
├── models/
│   └── reservation.go
├── repository/
│   └── reservation_repository.go
└── tests/
    └── reservations_test.go
```

### Go の構造体の参考形式
```go
type Reservation struct {
  ID            string
  UserID        string
  SeatID        string
  Status        string    // "in_use", "reserved", "completed", etc.
  PrivacySetting string   // "public", "private", "friends"
  StartTime     time.Time
  EndTime       time.Time
}

type VisibleReservationsRequest struct {
  StartTime *time.Time
  EndTime   *time.Time
}
```

### API レスポンス例
```json
{
  "reservations": [
    {
      "id": "01KCRTGQ93S2N1NVTMP4STMRMR",
      "seat_id": "01KBQ6XQ4NCBZ0J8N4473KGPMY",
      "user_id": "01KB2TDC9G0XFGDB4DTD51CXDH",
      "status": "in_use",
      "privacy_setting": "private",
      "start_time": "2025-12-19T12:30:00+09:00",
      "end_time": "2025-12-19T14:30:00+09:00"
    }
  ]
}
```

---

## 実装完了後のフロント側の動作

この修正後、フロント側では以下の動作が期待されます：

1. **座席マップ表示**
   - 他ユーザーが `in_use` または `reserved` 中の座席 → オレンジ色「使用中」表示
   - （プライバシー設定が private でも見える）

2. **座席情報パネル**
   - 他ユーザーが使用中の座席を選択 → 「現在の予約状態」セクションに「使用中」が表示される
   - ユーザー名やメモなどは、プライバシー設定に応じて表示/非表示

3. **フロント側の時間判定**
   - フロント側は reserved で開始時刻 <= 現在時刻 < 終了時刻の予約を「in_use」として表示
   - バックエンド側でも同様のロジックで in_use に変換することを推奨

---

## 質問・確認事項

実装時に不明な点があれば、以下の情報を確認してください：

1. **现在の getVisibleReservations の実装場所**
   - handlers/reservations.go？
   - repository/reservation_repository.go？

2. **プライバシー設定の現在の実装**
   - PrivacySetting フィールドの名前は何か？
   - enum の値は何か？

3. **タイムゾーン処理**
   - 時刻比較で使用している timezone は何か？
   - StartTime / EndTime は UTC か JST か？

4. **ユーザー認証**
   - 現在のユーザーID の取得方法は何か？
```

---

このプロンプトをClaude Codeに渡して実装してください。必要に応じて詳細情報を追加してください！
