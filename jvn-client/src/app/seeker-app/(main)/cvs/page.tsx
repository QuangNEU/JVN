import CVList from "@/components/ui/CvList";

export const metadata = {
    title: "Quản lý CV",
};

export default function CVsPage() {
    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <CVList />
        </main>
    );
}