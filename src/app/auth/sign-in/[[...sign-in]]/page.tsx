import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="bg-gray-300 flex items-center justify-center min-h-screen">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
