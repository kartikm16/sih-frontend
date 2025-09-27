import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link  from "next/link";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { to: "/dashboard", label: "Dashboard Overview" },
    { to: "/students", label: "Manage Students" },
    { to: "/faculty", label: "Manage Faculty" },
    { to: "/analytics", label: "Risk Analytics" },
    { to: "/feedback", label: "Feedback Report" },
    { to: "/data-entry", label: "Data Entry" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r bg-sidebar hidden md:flex flex-col transition-all",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-end p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 px-2 py-2">
        {items.map((item) => (
          <Link
            href={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent text-foreground"
            title={collapsed ? item.label : undefined}
          >
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
