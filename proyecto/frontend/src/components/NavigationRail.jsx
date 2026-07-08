import { NavLink } from "react-router-dom";
import * as Tooltip from "./ui/Tooltip";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/classrooms", label: "Classrooms" },
  { to: "/students", label: "Students" },
  { to: "/activities", label: "Activities" },
  { to: "/grades", label: "Grades" },
  { to: "/reports", label: "Reports" },
  { to: "/periods", label: "Periods" },
];

const icons = {
  LayoutDashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  BookOpen: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  Users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  ClipboardList: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  GraduationCap: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0112 17.5c-2.582 0-5.133-.583-7.16-1.422L12 14zm0 0v4",
  FileText: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  Calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

const iconKeys = {
  "/": "LayoutDashboard",
  "/classrooms": "BookOpen",
  "/students": "Users",
  "/activities": "ClipboardList",
  "/grades": "GraduationCap",
  "/reports": "FileText",
  "/periods": "Calendar",
};

function RailIcon({ name }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name]} />
    </svg>
  );
}

function NavItem({ to, label, onClick }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <NavLink to={to} end={to === "/"} onClick={onClick} className="flex items-center justify-center w-12 h-12">
          {({ isActive }) => (
            <div
              className={`flex items-center justify-center w-full h-full rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                  : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <RailIcon name={iconKeys[to]} />
            </div>
          )}
        </NavLink>
      </Tooltip.Trigger>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip.Root>
  );
}

export default function NavigationRail({ onNavigate }) {
  return (
    <nav className="w-[72px] flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-1 z-10">
      <div className="mb-6 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-warm-400 flex items-center justify-center shadow-sm shadow-brand-500/20">
          <span className="text-white font-extrabold text-sm">AE</span>
        </div>
      </div>

      {navItems.map((item) => (
        <NavItem key={item.to} {...item} onClick={onNavigate} />
      ))}
    </nav>
  );
}
