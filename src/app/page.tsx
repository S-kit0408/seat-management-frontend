import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-8">座席管理システム</h1>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
        >
          サインイン
        </Link>
        <Link
          href="/sign-up"
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
        >
          サインアップ
        </Link>
      </div>
    </div>
  )
}