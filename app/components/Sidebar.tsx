"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import ProfilePic from '@/public/img/person-test.jpeg';
import {
  faBell,
  faBoxesStacked,
  faCartShopping,
  faFolderTree,
  faHouse,
  faLayerGroup,
  faRightFromBracket,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { logout } from "../lib/logout";
import client from "@/app/api/client";

type SidebarProfile = {
  name: string;
  role: string;
};

const Sidebar = () => {
  const pathname = usePathname();
  const [profile, setProfile] = useState<SidebarProfile | null>(null);
  const navItem = [
    { name: "Dashboard", href: "/dashboard", icon: faHouse },
    { name: "Users", href: "/dashboard/users", icon: faUsers },
    { name: "Categories", href: "/dashboard/categories", icon: faFolderTree },
    { name: "Products", href: "/dashboard/products", icon: faBoxesStacked },
    { name: "Variants", href: "/dashboard/variants", icon: faLayerGroup },
    { name: "Orders", href: "/dashboard/orders", icon: faCartShopping },
    { name: "Notifications", href: "/dashboard/notifications", icon: faBell },
  ];
  const profileLink = "/dashboard/profile";

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await client
        .from("profiles")
        .select("name, role")
        .eq("user_id", user.id)
        .single<SidebarProfile>();

      if (!error && data) {
        setProfile(data);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className="flex h-full flex-col justify-between bg-background px-4 py-5">
      <div>

        <nav className="space-y-1">
          {navItem.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "border-light-purple/40 bg-light-purple/10 text-foreground"
                    : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-foreground"
                }`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`text-sm ${isActive ? "text-light-purple" : "text-gray-400 group-hover:text-foreground"}`}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-gray-200 bg-background p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-gray-200">
            <Image
              fill={true}
              sizes="40px"
              alt="Profile Image"
              src={ProfilePic}
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {profile?.name ?? "Unknown User"}
            </p>
            <p className="text-xs capitalize text-gray-500">
              {profile?.role ?? "unknown"}
            </p>
          </div>
        </div>

        <Link
          href={profileLink}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faUser} />
          Profile
        </Link>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          onClick={logout}
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
