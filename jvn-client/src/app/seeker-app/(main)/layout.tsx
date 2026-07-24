import TopNavBar from '@/components/layout/TopNavBar';
import Footer from '@/components/layout/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <TopNavBar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}