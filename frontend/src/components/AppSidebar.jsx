import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  Settings,
  LogOut,
  Target,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { Brand } from "@/components/common";

const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Applications", icon: BriefcaseBusiness },
  { name: "Interviews", icon: CalendarDays },
  { name: "Follow-ups", icon: CheckSquare },
];
export default function AppSidebar({
  page,
  go,
  apps,
  pending,
  profile,
  logout,
}) {
  return (
    <Sidebar className="app-sidebar">
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        <div className="workspace-label">WORKSPACE</div>
        <SidebarMenu>
          {nav.map((n) => (
            <SidebarMenuItem key={n.name}>
              <SidebarMenuButton
                className="nav-item"
                isActive={page === n.name}
                onClick={() => go(n.name)}
              >
                <n.icon size={19} />
                <span>{n.name}</span>
                {n.name === "Applications" && (
                  <span className="nav-count">{apps.length}</span>
                )}
                {n.name === "Follow-ups" && (
                  <span className="nav-count">{pending.length}</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="sidebar-note">
          <span className="note-icon">
            <Target size={20} />
          </span>
          <strong>One step closer.</strong>
          <p>Keep your next opportunity in sight.</p>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="nav-item"
              isActive={page === "Settings"}
              onClick={() => go("Settings")}
            >
              <Settings size={19} />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="nav-item" onClick={logout}>
              <LogOut size={19} />
              Sign out
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="profile">
          <span className="avatar">{(profile.name || "User").slice(0, 1)}</span>
          <div>
            <strong>{profile.name || "Your workspace"}</strong>
            <small>Personal workspace</small>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
