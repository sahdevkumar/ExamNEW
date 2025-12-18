import React from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Layers, 
  ClipboardCheck, 
  LayoutDashboard,
  Menu,
  Printer
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'marks', label: 'Enter Marks', icon: ClipboardCheck },
    { id: 'results', label: 'Results & Reports', icon: Layers },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'exams', label: 'Exams', icon: Calendar },
    { id: 'print', label: 'Print', icon: Printer },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        print:hidden
      `}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            ExamPro
          </h1>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 print:hidden">
          <button 
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
             <div className="text-sm text-gray-500">Academic Year 2024-2025</div>
             <div className="h-8 w-8 rounded-full bg-secondary text-dark flex items-center justify-center font-bold text-xs shadow-sm">
               AD
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
};