import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Calendar, ShieldCheck, FileSpreadsheet, Hexagon, Bell, Search, UserCircle, Layers, BarChart3, Settings, BookOpen, TrendingUp, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "All Requests", icon: FileText },
  { href: "/knowledge-base", label: "Architecture Patterns", icon: BookOpen },
  { href: "/jira", label: "JIRA Initiatives", icon: Layers },
  { href: "/leanix", label: "Initiatives", icon: LayoutGrid },
  { href: "/sessions", label: "ARC Sessions", icon: Calendar },
  { href: "/outcomes", label: "Review Outcomes", icon: ShieldCheck },
  { href: "/kpis", label: "KPI Dashboard", icon: BarChart3 },
  { href: "/executive-dashboard", label: "Executive Dashboard", icon: TrendingUp },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border/50 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 flex items-center space-x-3 text-primary">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Hexagon className="w-6 h-6 fill-primary/20" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">Architecture Review Process (Demo)</span>
        </div>
        
        <div className="px-4 pb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Navigation</div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-4 pb-2">
          <Link
            href="/admin"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group",
              location === "/admin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Demo Setup</span>
          </Link>
        </div>

        <div className="p-4 m-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
          <div className="flex items-center space-x-2 text-primary mb-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="font-bold text-sm">Process Guide</span>
          </div>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Need help understanding the architecture review phases? Read the enterprise guidelines.
          </p>
          <Link href="/process-guide" className="text-xs font-semibold text-primary hover:underline flex items-center">
            Read Docs <ArrowRightIcon className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="md:hidden flex items-center space-x-2 text-primary">
            <Hexagon className="w-5 h-5" />
            <span className="font-display font-bold">ARC</span>
          </div>
          
          <div className="hidden md:flex items-center w-96 relative">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search architecture requests..." 
              className="w-full bg-secondary/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer p-1 pr-3 hover:bg-secondary rounded-full transition-colors border border-transparent hover:border-border/50">
              <UserCircle className="w-8 h-8 text-primary" />
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold leading-tight">Mehak Suri</div>
                <div className="text-xs text-muted-foreground leading-tight">Enterprise Architect</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

function ArrowRightIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}