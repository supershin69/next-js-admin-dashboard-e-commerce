import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
    const pathname = usePathname();
    const navItem = [
        { name: "Dashboard", href: "/dashboard"},
        { name: "Users", href: "/dashboard/users"},
        { name: "Categories", href: "/dashboard/categories"},
        { name: "Products", href: "/dashboard/products"},
        { name: "Orders", href: "/dashboard/orders"},
        { name: "Analytics", href: "/dashboard/analytics"},
    ];
  return (
    <div className="flex flex-col justify-between items-center h-full">
        <div className="w-full flex flex-col gap-2 justify-center items-center pt-2">
           {navItem.map((item) => (
            <Link 
                key={item.name} 
                href={item.href}
                className={`glass-link py-3 text-lg font-medium w-full ${pathname === item.href ? 'active' : ''}`}>{item.name}</Link>
           ))}
        </div>
        <div className="h-14 bg-white w-full flex items-center justify-center">Acc Management</div>
    </div>
  )
}
export default Sidebar