import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	cn,
	useSidebar,
} from "@otbt/ui";
import {
	Package,
	Plus,
	ReceiptText,
	Settings,
	Users,
	type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router";

type NavItem = {
	key: "products" | "add-product" | "customers" | "orders";
	label: string;
	href: string;
	icon: LucideIcon;
};

const navItems: NavItem[] = [
	{ key: "products", label: "Products", href: "/", icon: Package },
	{ key: "add-product", label: "Add Product", href: "/products/new", icon: Plus },
	{ key: "customers", label: "Customers", href: "/customers", icon: Users },
	{ key: "orders", label: "Orders", href: "/orders", icon: ReceiptText },
];

export function AdminSidebar() {
	const { pathname } = useLocation();
	const { open } = useSidebar();
	const settingsIsActive = pathname === "/settings";

	return (
		<aside
			className={cn(
				"h-[calc(100svh-4rem)] shrink-0 overflow-hidden border-r bg-sidebar transition-[width] duration-200 ease-linear",
				open ? "w-64" : "w-0 border-r-0",
			)}
		>
			<Sidebar collapsible="none" className="h-full w-64">
				<SidebarContent className="gap-0 p-4">
					<SidebarGroup className="p-0">
						<SidebarGroupLabel className="h-auto px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
							Storefront
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="gap-1">
								{navItems.map((item) => {
									const Icon = item.icon;
									const isActive =
										item.key === "products"
											? pathname === "/"
											: pathname === item.href || pathname.startsWith(`${item.href}/`);

									return (
										<SidebarMenuItem key={item.key}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												size="lg"
												className={
													isActive
														? "h-10 px-3 font-medium text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground [&>svg]:text-primary-foreground [&>span]:text-primary-foreground"
														: "h-10 px-3 font-medium text-foreground"
												}
											>
												<Link to={item.href}>
													<Icon className="size-4" />
													<span>{item.label}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="mt-auto p-4 pt-2">
					<SidebarMenu className="gap-1">
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								isActive={settingsIsActive}
								className={
									settingsIsActive
										? "h-10 px-3 font-medium text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground [&>svg]:text-primary-foreground [&>span]:text-primary-foreground"
										: "h-10 px-3 font-medium text-foreground"
								}
							>
								<Link to="/settings">
									<Settings className="size-4" />
									<span>Settings</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
		</aside>
	);
}
