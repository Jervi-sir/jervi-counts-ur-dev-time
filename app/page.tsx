import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-2">
              Welcome to Your App
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              A Next.js 16 starter template with Supabase, generic UI components, and TypeScript.
              Scale your development with a robust foundation.
            </p>
          </div>
          <div className="space-x-4">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              href="/login"
            >
              Get Started
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              href="https://github.com/vercel/next.js"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 mt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6" data-v0-t="card">
            <div className="flex flex-col space-y-1.5">
              <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">App Router</h3>
            </div>
            <div className="p-0 pt-4">
              <p className="text-sm text-muted-foreground">
                Leverage the power of React Server Components and the new Next.js App Router for optimal performance.
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6" data-v0-t="card">
            <div className="flex flex-col space-y-1.5">
              <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">Supabase Auth</h3>
            </div>
            <div className="p-0 pt-4">
              <p className="text-sm text-muted-foreground">
                Secure authentication and user management provided by Supabase. Ready to go out of the box.
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6" data-v0-t="card">
            <div className="flex flex-col space-y-1.5">
              <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">Shadcn UI</h3>
            </div>
            <div className="p-0 pt-4">
              <p className="text-sm text-muted-foreground">
                Styled with Tailwind CSS and Radix UI primitives for accessible and customizable components.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
