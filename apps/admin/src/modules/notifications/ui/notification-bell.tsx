import { Button } from "@otbt/ui";
import { Bell } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useNotifications } from "../notifications.hooks";
import { NotificationDropdown } from "./notification-dropdown";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const { data } = useNotifications("all");
  const unreadCount = data?.summary.unreadCount ?? 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open notifications"
        className="relative overflow-visible"
        onClick={() => setOpen((current) => !current)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold leading-none text-destructive-foreground">
            {Math.min(unreadCount, 9)}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div id={menuId} role="menu">
          <NotificationDropdown />
        </div>
      ) : null}
    </div>
  );
}
