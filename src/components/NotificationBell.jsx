import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { notificationService } from "@/services";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    notificationService.list("-created_at", 20)
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    await notificationService.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-foreground/70" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border font-heading font-semibold text-sm">Notifications</div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet</p>
          ) : notifications.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} className={`p-3 border-b border-border/50 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${!n.is_read ? "bg-accent/30" : ""}`}>
              <p className="text-foreground/90">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
