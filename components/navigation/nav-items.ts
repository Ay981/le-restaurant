import type { IconType } from "react-icons";
import { CiDiscount1, CiHome } from "react-icons/ci";
import { FiLogIn, FiUserPlus } from "react-icons/fi";
import { GrAnalytics } from "react-icons/gr";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineMessage } from "react-icons/md";

export type NavItem = {
  icon: IconType;
  href: string;
};

export const navItems: NavItem[] = [
  { icon: CiHome, href: "/" },
  { icon: FiUserPlus, href: "/create-account" },
  { icon: FiLogIn, href: "/sign-in" },
  { icon: CiDiscount1, href: "/discounts" },
  { icon: GrAnalytics, href: "/analytics" },
  { icon: MdOutlineMessage, href: "/messages" },
  { icon: IoIosNotificationsOutline, href: "/notifications" },
  { icon: IoSettingsOutline, href: "/settings" },
];