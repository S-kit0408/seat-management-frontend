import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

export default async function HomePage() {
  const { userId } = await auth()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl text-gray-600 font-bold mb-8">
        {/*座席管理システム*/}
        ******システム
      </h1>
      <div className="flex gap-4">
        {userId ? (
          <Link
            href="/dashboard"
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
          >
            ダッシュボードへ
          </Link>
        ) : (
          <>
            <Link
              href="/auth/sign-in"
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
            >
              サインイン
            </Link>
            <Link
              href="/signup"
              className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
            >
              サインアップ
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
