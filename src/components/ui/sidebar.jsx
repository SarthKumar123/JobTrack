import { createContext, useContext, useState } from "react";
import { PanelLeftIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
const SidebarContext = createContext(null);
export function SidebarProvider({ children, style }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-svh w-full" style={style}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
export function Sidebar({ children, className }) {
  const isMobile = useIsMobile();
  const { open, setOpen } = useContext(SidebarContext);
  const content = (
    <div data-slot="sidebar-inner" className="flex h-full flex-col bg-sidebar">
      {children}
    </div>
  );
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className={cn("w-72 gap-0 p-0", className)}>
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
            <SheetDescription>Choose a JobTrack page.</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <div className="w-(--sidebar-width) shrink-0">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-10 w-(--sidebar-width)",
          className,
        )}
      >
        {content}
      </aside>
    </div>
  );
}
export function SidebarTrigger({ className }) {
  const { setOpen } = useContext(SidebarContext);
  return (
    <button
      type="button"
      className={cn("icon-btn", className)}
      aria-label="Open navigation"
      onClick={() => setOpen(true)}
    >
      <PanelLeftIcon size={20} />
    </button>
  );
}
export function SidebarHeader({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}
export function SidebarFooter({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}
export function SidebarContent({ className, ...props }) {
  return (
    <nav
      aria-label="Workspace"
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
        className,
      )}
      {...props}
    />
  );
}
export function SidebarMenu({ className, ...props }) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full flex-col gap-1", className)}
      {...props}
    />
  );
}
export function SidebarMenuItem(props) {
  return <li {...props} />;
}
export function SidebarMenuButton({
  isActive = false,
  className,
  onClick,
  ...props
}) {
  const { setOpen } = useContext(SidebarContext);
  return (
    <button
      type="button"
      data-slot="sidebar-menu-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn("flex w-full items-center text-left", className)}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    />
  );
}
