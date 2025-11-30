/**
 * Clerk認証を使用したAPI呼び出しの実装例
 *
 * このファイルは実装例を示すためのサンプルコードです。
 * 実際のプロジェクトでは、これらのパターンを参考にしてください。
 */

// ============================================
// 1. サーバーコンポーネントでの使用例
// ============================================

/**
 * Example: サーバーコンポーネントでデータを取得
 */
/*
import { apiServerFetch } from '@/lib/api-client';

export default async function SeatsPage() {
  try {
    const response = await apiServerFetch('/api/seats', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('データの取得に失敗しました');
    }

    const seats = await response.json();

    return (
      <div>
        <h1>座席一覧</h1>
        <ul>
          {seats.map((seat: any) => (
            <li key={seat.id}>{seat.name}</li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    return <div>エラーが発生しました: {error.message}</div>;
  }
}
*/

// ============================================
// 2. Server Actionでの使用例（推奨）
// ============================================

/**
 * Example: Server ActionでデータをPOST
 */
/*
'use server';

import { apiServerFetch } from '@/lib/api-client';
import { revalidatePath } from 'next/cache';

export async function createSeat(formData: FormData) {
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  try {
    const response = await apiServerFetch('/api/seats', {
      method: 'POST',
      body: JSON.stringify({ name, location }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const newSeat = await response.json();

    // キャッシュを再検証
    revalidatePath('/seats');

    return { success: true, data: newSeat };
  } catch (error) {
    return { success: false, error: '座席の作成に失敗しました' };
  }
}
*/

// ============================================
// 3. クライアントコンポーネントでの使用例
// ============================================

/**
 * Example: クライアントコンポーネントでuseAuthを使用
 */
/*
'use client';

import { useAuth } from '@clerk/nextjs';
import { apiClientFetch } from '@/lib/api-client';
import { useState } from 'react';

export function CreateSeatForm() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;

    try {
      const response = await apiClientFetch(
        '/api/seats',
        {
          method: 'POST',
          body: JSON.stringify({ name, location }),
        },
        getToken
      );

      if (!response.ok) {
        throw new Error('座席の作成に失敗しました');
      }

      const newSeat = await response.json();
      alert('座席を作成しました: ' + newSeat.name);
    } catch (error) {
      alert('エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="座席名" required />
      <input name="location" placeholder="場所" required />
      <button type="submit" disabled={loading}>
        {loading ? '作成中...' : '座席を作成'}
      </button>
    </form>
  );
}
*/

// ============================================
// 4. カスタムフックでの使用例（推奨）
// ============================================

/**
 * Example: useSeatsカスタムフックを作成
 */
/*
'use client';

import { useAuth } from '@clerk/nextjs';
import { apiClientFetch } from '@/lib/api-client';
import { useState, useEffect } from 'react';

interface Seat {
  id: string;
  name: string;
  location: string;
}

export function useSeats() {
  const { getToken } = useAuth();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await apiClientFetch('/api/seats', { method: 'GET' }, getToken);

        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }

        const data = await response.json();
        setSeats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [getToken]);

  const createSeat = async (name: string, location: string) => {
    try {
      const response = await apiClientFetch(
        '/api/seats',
        {
          method: 'POST',
          body: JSON.stringify({ name, location }),
        },
        getToken
      );

      if (!response.ok) {
        throw new Error('座席の作成に失敗しました');
      }

      const newSeat = await response.json();
      setSeats([...seats, newSeat]);
      return { success: true, data: newSeat };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      };
    }
  };

  return { seats, loading, error, createSeat };
}

// 使用例:
export function SeatsComponent() {
  const { seats, loading, error, createSeat } = useSeats();

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div>
      <h1>座席一覧</h1>
      <ul>
        {seats.map((seat) => (
          <li key={seat.id}>{seat.name} - {seat.location}</li>
        ))}
      </ul>
    </div>
  );
}
*/

// ============================================
// 5. React Query (TanStack Query) との組み合わせ（推奨）
// ============================================

/**
 * Example: React Queryを使用した実装
 */
/*
'use client';

import { useAuth } from '@clerk/nextjs';
import { apiClientFetch } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Seat {
  id: string;
  name: string;
  location: string;
}

export function useSeatsQuery() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['seats'],
    queryFn: async () => {
      const response = await apiClientFetch('/api/seats', { method: 'GET' }, getToken);

      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }

      return response.json() as Promise<Seat[]>;
    },
  });
}

export function useCreateSeatMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; location: string }) => {
      const response = await apiClientFetch(
        '/api/seats',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        getToken
      );

      if (!response.ok) {
        throw new Error('座席の作成に失敗しました');
      }

      return response.json() as Promise<Seat>;
    },
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['seats'] });
    },
  });
}

// 使用例:
export function SeatsWithReactQuery() {
  const { data: seats, isLoading, error } = useSeatsQuery();
  const createSeat = useCreateSeatMutation();

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  const handleCreate = async () => {
    try {
      await createSeat.mutateAsync({ name: '新しい座席', location: 'A-1' });
      alert('座席を作成しました');
    } catch (error) {
      alert('エラー: ' + error.message);
    }
  };

  return (
    <div>
      <h1>座席一覧</h1>
      <button onClick={handleCreate}>座席を追加</button>
      <ul>
        {seats?.map((seat) => (
          <li key={seat.id}>{seat.name} - {seat.location}</li>
        ))}
      </ul>
    </div>
  );
}
*/

export {};
