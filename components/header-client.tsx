
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function HeaderClient({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl container flex h-14 items-center justify-between mx-auto px-8">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2 font-bold">
            Jervi counts ur dev time
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {user && (
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/leaderboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link href={`/u/${user.user_metadata.user_name || "me"}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {user.user_metadata.user_name || "me"}
              </Link>
              {/* Note: Server Actions inside Client Component usually passed as props or imported directly if safe. 
                         However, for simple sign out form, we can just use a regular form submission to the action url if needed,
                         BUT recommended pattern in Next.js is passing the action or invoking it. 
                         For simplicity here, we assume the parent handles the server-side action context or we use a simple fetch/router method.
                         Actually, let's keep it simple: we passed 'signOut' is tricky. 
                         We'll use a standard <form action="/auth/signout" method="post"> if we created that route, 
                         OR we can just rely on the parent component being a server component.
                         WAIT, we are splitting this. Let's just render the 'Sign Out' button as a form here.
                      */}
              <form action="/auth/signout" method="post">
                <button className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Login
            </Link>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isOpen && (
        <div className="md:hidden border-b bg-background">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/leaderboard"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Leaderboard
            </Link>
            {user ? (
              <>
                <Link
                  href={`/u/${user.user_metadata.user_name || "me"}`}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  Profile: {user.user_metadata.user_name || "me"}
                </Link>
                <div className="px-3 py-2">
                  <form action="/auth/signout" method="post">
                    <button className="w-full text-left rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/20">
                      Sign Out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
