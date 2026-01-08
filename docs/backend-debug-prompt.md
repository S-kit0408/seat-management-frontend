# バックエンド デバッグ・確認プロンプト

以下のプロンプトをバックエンド Claude Code プロジェクトに渡してください。

---

## Claude Code へのプロンプト

```
【タスク】GetVisibleReservations の実装確認とデバッグ

【背景】
フロント側で修正を完了しましたが、他ユーザーからの座席が相変わらず「可」と表示されています。
その原因を特定し、必要な修正を実装する必要があります。

【目的】
1. GetVisibleReservations の実装箇所を特定
2. フィルタリングロジックの現状を把握
3. in_use/reserved 予約をプライバシー設定を無視して返すように修正

---

## ステップ1：実装箇所の特定

以下のファイル・関数を探してください：

### 確認対象ファイル
- usecase/reservation_usecase.go → GetVisibleReservations メソッド
- repository/reservation_repository.go → GetVisibleReservations メソッド
- handlers/reservation_handler.go → GetVisibleReservations ハンドラー

### やること
1. GetVisibleReservations メソッドが usecase に存在するか確認
2. そのメソッドの実装全体をコピーして共有
3. フィルタリングロジック（WHERE 句や if 文）の場所を特定

---

## ステップ2：ログ出力による確認

以下のログを usecase または repository に追加して、データフローを確認してください：

### 修正ポイント：usecase/reservation_usecase.go（推奨）

以下のログを GetVisibleReservations メソッドに追加：

```go
func (u *ReservationUsecase) GetVisibleReservations(
    ctx context.Context,
    userID string,
    startTime,
    endTime *time.Time,
) ([]model.Reservation, error) {
    log.Printf("[GetVisibleReservations] userID: %s, startTime: %v, endTime: %v", userID, startTime, endTime)

    // データベースから全予約を取得（修正前）
    allReservations, err := u.repo.GetReservations(ctx, startTime, endTime)
    if err != nil {
        return nil, err
    }

    log.Printf("[GetVisibleReservations] Total reservations from DB: %d", len(allReservations))

    // 各予約をログ出力
    for i, r := range allReservations {
        log.Printf("[GetVisibleReservations] Reservation[%d]: ID=%s, Status=%s, UserID=%s, PrivacySetting=%s, StartTime=%v, EndTime=%v",
            i, r.ID, r.Status, r.UserID, r.PrivacySetting, r.StartTime, r.EndTime)
    }

    // フィルタリング前の件数
    now := time.Now()
    var visibleReservations []model.Reservation

    for _, r := range allReservations {
        log.Printf("[GetVisibleReservations] Processing: ID=%s, Status=%s, UserID=%s vs CurrentUserID=%s, Privacy=%s",
            r.ID, r.Status, r.UserID, userID, r.PrivacySetting)

        // ここにフィルタリングロジック
        // ... (既存の実装)

        log.Printf("[GetVisibleReservations] After filter: Added=%v", added) // 追加されたか
    }

    log.Printf("[GetVisibleReservations] Final visible reservations: %d", len(visibleReservations))
    return visibleReservations, nil
}
```

### ログ確認
アプリケーション起動後、以下を実行：
1. ユーザーAで別ユーザーBの座席を予約（ステータス：reserved）
2. ユーザーCのアカウントで `/api/reservations/visible` をリクエスト
3. サーバーログに上記の `[GetVisibleReservations]` で始まるログが出力されているか確認
4. 各予約の Status, UserID, PrivacySetting を確認

---

## ステップ3：修正が必要か判断

### ケースA：API が他ユーザーの予約を返していない場合
→ GetVisibleReservations で他ユーザーの予約が除外されている
→ フィルタリングロジックを修正する必要がある

### ケースB：API が他ユーザーの予約を返しているが、フロント側で「可」と表示される場合
→ ステータスの値を確認
  - 'scheduled' ではなく 'reserved' または 'in_use' か？
  - 時間判定が正しくされているか？

### ケースC：API がまったく予約を返さない場合
→ データベースに予約が保存されていない
→ 予約作成のハンドラーやユースケースを確認

---

## ステップ4：修正の実装

以下のロジックで GetVisibleReservations を修正してください：

### 現在の問題のあるロジック（推定）
```go
// 他のユーザーのプライベート予約を除外している
if r.PrivacySetting == "private" && r.UserID != userID {
    continue  // ← これが原因で他ユーザーの予約が見えない
}
```

### 修正後のロジック
```go
func (u *ReservationUsecase) GetVisibleReservations(
    ctx context.Context,
    userID string,
    startTime,
    endTime *time.Time,
) ([]model.Reservation, error) {
    log.Printf("[DEBUG] GetVisibleReservations called for userID: %s", userID)

    // DB から予約を取得
    allReservations, err := u.repo.GetReservations(ctx, startTime, endTime)
    if err != nil {
        return nil, err
    }

    log.Printf("[DEBUG] Total reservations from DB: %d", len(allReservations))

    now := time.Now()
    var visibleReservations []model.Reservation

    for _, r := range allReservations {
        // ========== 新しいロジック ==========

        // ステップ1：in_use/reserved はプライバシー設定を無視して全員に見せる
        if r.Status == "in_use" {
            log.Printf("[DEBUG] Adding in_use reservation: %s", r.ID)
            visibleReservations = append(visibleReservations, r)
            continue
        }

        // reserved で開始時刻が過ぎている場合も全員に見せる
        if r.Status == "reserved" && r.StartTime.Before(now) {
            log.Printf("[DEBUG] Adding reserved (started) reservation: %s", r.ID)
            visibleReservations = append(visibleReservations, r)
            continue
        }

        // ステップ2：完了済み・キャンセル・欠席は表示しない
        if r.Status == "completed" || r.Status == "cancelled" || r.Status == "no_show" {
            log.Printf("[DEBUG] Skipping %s status reservation: %s", r.Status, r.ID)
            continue
        }

        // ステップ3：その他のステータスについてはプライバシー設定をチェック
        log.Printf("[DEBUG] Checking privacy for reservation: %s, Privacy=%s, UserID=%s", r.ID, r.PrivacySetting, r.UserID)

        if r.PrivacySetting == "public" {
            log.Printf("[DEBUG] Adding public reservation: %s", r.ID)
            visibleReservations = append(visibleReservations, r)
        } else if r.PrivacySetting == "private" && r.UserID == userID {
            log.Printf("[DEBUG] Adding private reservation (own): %s", r.ID)
            visibleReservations = append(visibleReservations, r)
        } else if r.PrivacySetting == "friends" && isFriend(ctx, r.UserID, userID) {
            log.Printf("[DEBUG] Adding friends reservation: %s", r.ID)
            visibleReservations = append(visibleReservations, r)
        } else {
            log.Printf("[DEBUG] Skipping hidden reservation: %s (Privacy=%s)", r.ID, r.PrivacySetting)
        }
    }

    log.Printf("[DEBUG] Final visible reservations count: %d", len(visibleReservations))
    return visibleReservations, nil
}
```

---

## ステップ5：テスト

修正後、以下のシナリオでテストしてください：

### テストシナリオ1：in_use 予約の表示
1. **ユーザーA** で座席1を予約（ステータス: in_use、プライバシー: private）
2. **ユーザーB** で `/api/reservations/visible` をリクエスト
3. **期待結果** ユーザーAの予約が返される（プライバシー設定が private でも）
4. **確認方法** レスポンスに ユーザーA の予約が含まれていることを確認

### テストシナリオ2：reserved で開始済みの予約表示
1. **ユーザーA** で座席2を予約（ステータス: reserved、開始時刻: 現在時刻 - 5分、プライバシー: private）
2. **ユーザーB** で `/api/reservations/visible` をリクエスト
3. **期待結果** ユーザーAの予約が返される
4. **確認方法** レスポンスに返されることを確認

### テストシナリオ3：reserved でまだ開始していない予約は非表示
1. **ユーザーA** で座席3を予約（ステータス: reserved、開始時刻: 現在時刻 + 1時間、プライバシー: private）
2. **ユーザーB** で `/api/reservations/visible` をリクエスト
3. **期待結果** ユーザーAの予約は返されない（まだ開始していないため）
4. **確認方法** レスポンスに返されないことを確認

### テストシナリオ4：public 予約は常に表示
1. **ユーザーA** で座席4を予約（ステータス: reserved、プライバシー: public）
2. **ユーザーB** で `/api/reservations/visible` をリクエスト
3. **期待結果** ユーザーAの予約が返される
4. **確認方法** レスポンスに返されることを確認

---

## ステップ6：フロント側との連携確認

修正後、フロント側では以下の動作が期待されます：

1. **座席マップ表示**
   - 他ユーザーが in_use 中の座席 → オレンジ色「使用中」
   - 他ユーザーが reserved（開始済み）の座席 → オレンジ色「使用中」
   - 他ユーザーが reserved（未開始）の座席 → 青色「予約済」

2. **座席情報パネル**
   - 他ユーザーの in_use 座席を選択 → 「使用中」と表示
   - 他ユーザーの reserved 座席を選択 → 「予約済」と表示

---

## デバッグ時の注意点

1. **タイムゾーン確認**
   - StartTime / EndTime の timezone が JST に統一されているか？
   - 時間比較で UTC と JST が混在していないか？

2. **ステータスの値**
   - DB に保存されているステータスが実際に 'in_use', 'reserved' などか？
   - 'scheduled' や他の値になっていないか？

3. **プライバシー設定の値**
   - DB に保存されている privacy_setting が 'public', 'private', 'friends' か？

4. **NULL チェック**
   - r.PrivacySetting が nil または empty string になっていないか？

---

## 質問リスト（修正後の報告用）

修正完了時に以下をお知らせください：

1. ✅ GetVisibleReservations の実装箇所の確認
2. ✅ ログ出力を追加して確認した内容
3. ✅ 修正を実装したか？ (はい/いいえ)
4. ✅ テストシナリオ 1-4 の結果
5. ✅ ビルド成功したか？ (はい/いいえ)
6. ✅ フロント側で「使用中」の座席がオレンジ色で表示されるようになったか？
```

---

このプロンプトをバックエンド Claude Code プロジェクトに渡してください！
