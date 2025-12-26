"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Terminal, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function InstallationSection() {
    const [activeTab, setActiveTab] = useState<"vscode" | "antigravity">("vscode");
    const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMap((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
            setCopiedMap((prev) => ({ ...prev, [key]: false }));
        }, 2000);
    };

    return (
        <section id="install" className="container space-y-6 py-12 md:py-24 lg:py-32">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl font-bold">
                    Get Started
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Select your environment to see installation instructions.
                </p>
            </div>

            <div className="mx-auto flex w-full max-w-[400px] items-center justify-center p-1 rounded-full bg-muted">
                <button
                    onClick={() => setActiveTab("vscode")}
                    className={cn(
                        "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                        activeTab === "vscode"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    VS Code
                </button>
                <button
                    onClick={() => setActiveTab("antigravity")}
                    className={cn(
                        "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                        activeTab === "antigravity"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Antigravity
                </button>
            </div>

            <div className="mx-auto max-w-[58rem] mt-8">
                {activeTab === "vscode" ? (
                    <div className="rounded-xl border bg-card p-6 md:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="rounded-full bg-primary/10 p-4">
                                <Download className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Install for VS Code</h3>
                            <p className="text-muted-foreground max-w-md">
                                The easiest way to get started. Just install our extension directly from the Visual Studio Marketplace.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <Link
                                    href="https://marketplace.visualstudio.com/items?itemName=jervi-sir.jervi-counts-ur-dev-time"
                                    target="_blank"
                                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <Download className="mr-2 h-4 w-4" /> Go to Marketplace
                                </Link>
                                <div className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-mono text-muted-foreground shadow-sm">
                                    Or search `jervi-counts-ur-dev-time`
                                </div>
                            </div>

                            {/* New Sections for VS Code */}
                            <div className="mt-8 space-y-6 border-t pt-8 text-left w-full max-w-2xl mx-auto">
                                <div className="space-y-4">
                                    <h4 className="text-xl font-bold">How It Works</h4>
                                    <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                                        <li><strong>Install</strong> the extension.</li>
                                        <li><strong>Sign in</strong> when prompted (uses your existing VS Code GitHub authentication).</li>
                                        <li><strong>Just Code!</strong> The extension runs quietly in the background.</li>
                                        <li>Visit the <strong>Dashboard</strong> to see if you are coding more than Jervi.</li>
                                    </ol>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xl font-bold">Commands</h4>
                                    <p className="text-sm text-muted-foreground">
                                        You can access these commands from the Command Palette (<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"><span className="text-xs">Ctrl</span>+<span className="text-xs">Shift</span>+<span className="text-xs">P</span></kbd>):
                                    </p>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex flex-col gap-1 sm:flex-row sm:items-center">
                                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Jervi Counter: Sync to Supabase Now</code>
                                            <span className="text-muted-foreground ml-2">- Force a sync immediately.</span>
                                        </li>
                                        <li className="flex flex-col gap-1 sm:flex-row sm:items-center">
                                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Jervi Counter: Show Current User</code>
                                            <span className="text-muted-foreground ml-2">- See who is currently logged in.</span>
                                        </li>
                                        <li className="flex flex-col gap-1 sm:flex-row sm:items-center">
                                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">Jervi Counter: Show Today</code>
                                            <span className="text-muted-foreground ml-2">- See your tracked time for today.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card p-6 md:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col space-y-8">
                            <div className="text-center space-y-2">
                                <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit">
                                    <Terminal className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold">Setup for Antigravity</h3>
                                <p className="text-muted-foreground">
                                    A few extra steps to get running in your specific environment.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                                        Open Settings
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Click on the Antigravity settings icon.
                                    </p>
                                    <div className="mt-4 w-full overflow-hidden rounded-lg border shadow-sm">
                                        <img
                                            src="./images/step1.png"
                                            alt="Antigravity Settings"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                                            Update Marketplace URLs
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Paste the following URLs into the respective fields in settings:
                                        </p>
                                        <div className="mt-4 mb-4 w-full overflow-hidden rounded-lg border shadow-sm">
                                            <img
                                                src="./images/step2.png"
                                                alt="Update Marketplace URLs"
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">Marketplace Item URL</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                                                        https://marketplace.visualstudio.com/items
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard("https://marketplace.visualstudio.com/items", "url1")}
                                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                    >
                                                        {copiedMap["url1"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">Marketplace Gallery URL</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                                                        https://marketplace.visualstudio.com/_apis/public/gallery
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard("https://marketplace.visualstudio.com/_apis/public/gallery", "url2")}
                                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                    >
                                                        {copiedMap["url2"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                                            Restart & Install
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Restart Antigravity, then search for <strong>jervi-counts-ur-dev-time</strong> and install.
                                        </p>
                                    </div>

                                    {/* New Step 4 for Antigravity */}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">4</span>
                                            Launch & Use
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Use <kbd className="font-mono text-xs bg-muted px-1 rounded">Ctrl+Shift+P</kbd> giving access to <strong>Jervi Counter</strong> commands like <code>Show Today</code> or <code>Sync</code>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
