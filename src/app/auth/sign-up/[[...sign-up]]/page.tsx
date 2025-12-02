import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="bg-gray-300 flex items-center justify-center min-h-screen">
      <SignUp
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
