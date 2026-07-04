import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

/**
 * Main application dashboard layout wrapper.
 */
const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0F172A]">
      {/* Top Navigation */}
      <Navbar />
      
      {/* Body Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat / Users Sidebar (visible or toggleable) */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Core Content Area */}
        <main className="flex-1 h-full overflow-hidden bg-[#090D1A] flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
