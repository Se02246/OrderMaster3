import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const menuItems = [
    {
      path: "/",
      label: "HOME",
      icon: "fa-home"
    },
    {
      path: "/calendar",
      label: "CALENDARIO",
      icon: "fa-calendar-alt"
    },
    {
      path: "/employees",
      label: "CLIENTI",
      icon: "fa-users"
    },
    {
      path: "/statistics",
      label: "STATISTICHE",
      icon: "fa-chart-pie"
    }
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 w-64 transform transition duration-200 ease-in-out bg-white shadow-lg z-30",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl font-bold text-dark">GESTORE ORDINI</h1>
        </div>
        
        <nav className="flex-grow">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className="mb-2">
                <Link
                  href={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center p-3 rounded-lg font-medium hover:bg-gray-100",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-dark"
                  )}
                >
                  <i className={`fas ${item.icon} mr-3 text-lg`}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
