import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card sticky top-0 z-10">
            <div className="h-16 flex items-center px-6">
              <SidebarTrigger className="mr-4" />
              <div className="flex-1" />
            </div>
            <div className="px-6 pb-3">
              <Breadcrumbs />
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};
