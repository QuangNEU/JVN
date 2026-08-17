import AdminCategoryReviewList from "@/features/jobs/components/AdminCategoryReviewList";

export default function AdminCategoriesPage() {
    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Duyệt danh mục</h1>
                <p className="text-sm text-gray-500">Xem xét đề xuất danh mục mới từ công ty.</p>
            </div>
            <AdminCategoryReviewList />
        </div>
    );
}