import { useState, useEffect } from "react";
import { authService, accessLogService } from "@/services";
import { Shield, User, Clock, Globe, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserAccessLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    authService.me().then(u => {
      if (u?.role === "admin") {
        setIsAdmin(true);
        loadLogs();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    }).catch(() => {
      setIsAdmin(false);
      setLoading(false);
    });
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await accessLogService.list("-created_at", 500);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h2 className="font-heading text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">This page is for admins only.</p>
        </div>
      </div>
    );
  }

  // Aggregate logs by user
  const userStats = Object.values(
    logs.reduce((acc, log) => {
      const key = log.user_email;
      if (!acc[key]) {
        acc[key] = {
          user_email: log.user_email,
          user_name: log.user_name,
          pages_accessed: new Set(),
          total_visits: 0,
          last_access_time: log.last_access_time || log.created_date,
          page_history: [],
        };
      }
      acc[key].pages_accessed.add(log.page_name);
      acc[key].total_visits += 1;
      const logTime = log.last_access_time || log.created_date;
      if (new Date(logTime) > new Date(acc[key].last_access_time)) {
        acc[key].last_access_time = logTime;
      }
      acc[key].page_history.push({ page: log.page_name, time: logTime });
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.last_access_time) - new Date(a.last_access_time));

  const selectedUserLogs = selectedUser
    ? logs.filter(l => l.user_email === selectedUser).sort((a, b) =>
        new Date(b.last_access_time || b.created_date) - new Date(a.last_access_time || a.created_date)
      )
    : [];

  const fmt = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" /> User Access Logs
          </h1>
          <p className="text-muted-foreground mt-1">Monitor who's visiting and what pages they access.</p>
        </div>
        <Button variant="outline" onClick={loadLogs} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: userStats.length, icon: User },
          { label: "Total Page Visits", value: logs.length, icon: Activity },
          { label: "Unique Pages Tracked", value: new Set(logs.map(l => l.page_url)).size, icon: Globe },
          { label: "Today's Visits", value: logs.filter(l => new Date(l.last_access_time || l.created_date).toDateString() === new Date().toDateString()).length, icon: Clock },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <s.icon className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold font-heading">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold">Users</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : userStats.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No access logs yet.</div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {userStats.map(u => (
                <button
                  key={u.user_email}
                  onClick={() => setSelectedUser(selectedUser === u.user_email ? null : u.user_email)}
                  className={`w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors ${selectedUser === u.user_email ? "bg-accent/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{u.user_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.user_email}</p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 font-medium">
                      {u.total_visits} visits
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmt(u.last_access_time)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[...u.pages_accessed].slice(0, 4).map(p => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">{p}</span>
                    ))}
                    {u.pages_accessed.size > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">+{u.pages_accessed.size - 4} more</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Activity detail */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-semibold">
              {selectedUser ? `Activity — ${selectedUser}` : "Select a user to view activity"}
            </h2>
          </div>
          {!selectedUser ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Click a user on the left to see their page-by-page activity.
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {selectedUserLogs.map((log, i) => (
                <div key={log.id || i} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{log.page_name}</span>
                    <span className="text-xs text-muted-foreground">{fmt(log.last_access_time || log.created_date)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.page_url}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}