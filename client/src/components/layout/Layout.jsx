import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div>
      <Sidebar />
      <main className="min-h-screen pl-[320px] text-[17px]">
        <div className="min-h-screen bg-white py-6 pl-[200px] pr-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
