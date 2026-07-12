import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import AIChatDrawer from '../ai/AIChatDrawer.jsx';
import { useChatStore } from '../../store/chatStore.js';

/**
 * Main application dashboard layout wrapper.
 */
const MainLayout = () => {
  const { activeConversation } = useChatStore();
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0F172A] relative">
      {/* Top Navigation */}
      <Navbar onAIToggle={() => setIsAIDrawerOpen((prev) => !prev)} />
      
      {/* Body Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat / Users Sidebar (visible or toggleable) */}
        <div className={`w-full md:w-80 h-full flex-shrink-0 ${activeConversation ? 'hidden md:block' : 'block'}`}>
          <Sidebar />
        </div>
        
        {/* Core Content Area */}
        <main className={`flex-1 h-full overflow-hidden bg-[#090D1A] flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <Outlet />
        </main>
      </div>

      {/* Embedded AI Assistant Panel Overlay */}
      <AIChatDrawer isOpen={isAIDrawerOpen} onClose={() => setIsAIDrawerOpen(false)} />
    </div>
  );
};

export default MainLayout;
