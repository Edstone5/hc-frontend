import { Outlet } from 'react-router';
import Header from '@cmlayout/Header';

function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen max-w-screen overflow-x-hidden">
      <Header />

      <main className="flex-1 bg-[var(--color-secondary)]">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
