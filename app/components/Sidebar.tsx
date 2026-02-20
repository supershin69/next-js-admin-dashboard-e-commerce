import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import ProfilePic from '@/public/img/person-test.jpeg';
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { logout } from "../lib/logout";

const Sidebar = () => {
    const pathname = usePathname();
    const navItem = [
        { name: "Dashboard", href: "/dashboard"},
        { name: "Users", href: "/dashboard/users"},
        { name: "Categories", href: "/dashboard/categories"},
        { name: "Products", href: "/dashboard/products"},
        { name: "Orders", href: "/dashboard/orders"},
        { name: "Notifications", href: "/dashboard/notifications"},
    ];
    const profileLink = '/dashboard/profile';
    const [ isOpen, setIsOpen ] = useState(true);
    const toggleOpen = () => {
      setIsOpen((prev) => !prev);
    }

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
   <div className="w-full">
      {/* 1. This container holds the text and shrinks to 0 */}
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-28 border-t border-gray-100' : 'max-h-0'}`}>
        <Link href={profileLink} className="h-14 flex justify-center items-center hover:text-background hover:bg-foreground">Profile</Link>
        <button className="h-14 flex justify-center items-center w-full hover:text-background hover:bg-foreground" onClick={logout}>Log Out</button>
      </div>

      {/* 2. This button is ALWAYS outside the shrinking div, so it stays visible at the bottom */}
      <div className="h-14 flex justify-center gap-2 items-center border-t border-gray-100">
        <div className="relative overflow-hidden h-10 w-10 rounded-full">
          <Image fill={true} sizes="48px" alt="Profile Image" src={ProfilePic} className="object-cover"/>
        </div>
        
        <h1 className="text-md">Shin Thant Aung</h1>

        <button 
          className={`p-4 transition-transform duration-300 text-lg`} 
          onClick={toggleOpen}
        >
          {isOpen ? <FontAwesomeIcon icon={faChevronDown}/> : <FontAwesomeIcon icon={faChevronUp}/>}
        </button>
      </div>
    </div>
    </div>
  )
}
export default Sidebar
