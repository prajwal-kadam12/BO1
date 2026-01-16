
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganization } from "@/context/OrganizationContext";
import {
  ChevronsUpDown,
  Check,
  PlusCircle,
  LayoutDashboard,
  ShoppingCart,
  Users,
  FileText,
  Settings as SettingsIcon,
  Menu,
  ChevronRight,
  Package,
  ShoppingBag,
  Clock,
  Building2,
  FileCheck,
  UserCog,
  BarChart3,
  FolderOpen,
  Home,
  PanelLeftClose
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon?: React.ElementType;
  label: string;
  indent?: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon: Icon, label, indent, onClick }: NavItemProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
          isActive
            ? "bg-indigo-50 text-indigo-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          indent && "pl-10"
        )}
      >
        {Icon && <Icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-500")} />}
        {label}
      </div>
    </Link>
  );
};

interface CollapsibleNavItemProps {
  id: string;
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  openMenu: string | null;
  onMenuChange: (id: string | null) => void;
}

const CollapsibleNavItem = ({ id, icon: Icon, label, children, openMenu, onMenuChange }: CollapsibleNavItemProps) => {
  const isOpen = openMenu === id;

  return (
    <Collapsible open={isOpen} onOpenChange={(open) => {
      onMenuChange(open ? id : null);
    }} className="space-y-0.5">
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-slate-500" />
            {label}
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganization();

  // ... NavItem definitions

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-14 px-3 border-slate-200 hover:bg-slate-50 hover:text-slate-900">
              <div className="flex items-center gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center overflow-hidden shadow-md ring-2 ring-indigo-100">
                  <span className="font-display font-bold text-white text-lg">
                    {currentOrganization?.name.charAt(0).toUpperCase() || "B"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-tight truncate w-[120px]">
                    {currentOrganization?.name || "Billing App"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    {currentOrganization?.industry || "Accounting"}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start">
            <DropdownMenuLabel>My Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => setCurrentOrganization(org.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{org.name}</span>
                {currentOrganization?.id === org.id && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setLocation("/settings/organizations")} className="cursor-pointer">
              <PlusCircle className="mr-2 h-4 w-4" />
              Manage Organizations
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 py-3">
        <div className="px-2 space-y-0.5">
          <NavItem href="/" icon={Home} label="Home" />

          <CollapsibleNavItem id="items" icon={Package} label="Items" openMenu={openMenu} onMenuChange={setOpenMenu}>
            <NavItem href="/items" label="Items" indent />
          </CollapsibleNavItem>

          <CollapsibleNavItem id="sales" icon={ShoppingCart} label="Sales" openMenu={openMenu} onMenuChange={setOpenMenu}>
            <NavItem href="/customers" label="Customers" indent />
            <NavItem href="/estimates" label="Quotes" indent />
            <NavItem href="/sales-orders" label="Sales Orders" indent />
            <NavItem href="/invoices" label="Invoices" indent />
            <NavItem href="/delivery-challans" label="Delivery Challans" indent />
            <NavItem href="/payments-received" label="Payments Received" indent />
            <NavItem href="/credit-notes" label="Credit Notes" indent />
            <NavItem href="/eway-bills" label="e-Way Bills" indent />
          </CollapsibleNavItem>

          <CollapsibleNavItem id="purchases" icon={ShoppingBag} label="Purchases" openMenu={openMenu} onMenuChange={setOpenMenu}>
            <NavItem href="/vendors" label="Vendors" indent />
            <NavItem href="/expenses" label="Expenses" indent />
            <NavItem href="/purchase-orders" label="Purchase Orders" indent />
            <NavItem href="/bills" label="Bills" indent />
            <NavItem href="/payments-made" label="Payments Made" indent />
            <NavItem href="/vendor-credits" label="Vendor Credits" indent />
          </CollapsibleNavItem>

          <NavItem href="/time-tracking" icon={Clock} label="Time Tracking (TBD)" />

          <NavItem href="/banking" icon={Building2} label="Banking (TBD)" />

          <CollapsibleNavItem id="filing" icon={FileCheck} label="Filing & Compliance (TBD)" openMenu={openMenu} onMenuChange={setOpenMenu}>
            <NavItem href="/filing-compliance" label="GST Filing" indent />
          </CollapsibleNavItem>

          <CollapsibleNavItem id="accountant" icon={UserCog} label="Accountant (TBD)" openMenu={openMenu} onMenuChange={setOpenMenu}>
            <NavItem href="/manual-journals" label="Manual Journals" indent />
            <NavItem href="/bulk-update" label="Bulk Update" indent />
            <NavItem href="/chart-of-accounts" label="Chart of Accounts" indent />
            <NavItem href="/transaction-locking" label="Transaction Locking" indent />
          </CollapsibleNavItem>

          <NavItem href="/reports" icon={BarChart3} label="Reports" />

          <NavItem href="/documents" icon={FolderOpen} label="Documents (TBD)" />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div
            onClick={() => setLocation("/settings")}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-slate-200 flex-1"
            data-testid="button-settings"
          >
            <Avatar className="h-8 w-8 border border-slate-200">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-indigo-100 text-indigo-700">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">admin@Billing.com</p>
            </div>
            <SettingsIcon className="h-4 w-4 text-slate-400" />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50 bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 md:ml-64 min-h-screen flex flex-col transition-all duration-300 ease-in-out">
        {/* Mobile Menu Toggle */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="-ml-2">
            <Menu className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        <div className={cn("flex-1 min-h-0 overflow-hidden", (location.includes("/products/new") || (location.includes("/eway-bills") && !location.includes("/eway-bills/"))) ? "p-0" : "p-1 lg:p-2")}>
          {children}
        </div>
      </main>
    </div>
  );
}
