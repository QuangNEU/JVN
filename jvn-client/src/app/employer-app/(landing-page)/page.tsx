import Link from 'next/link';
import { ArrowRight, Users, Zap, ShieldCheck } from 'lucide-react';

const stats = [
    { value: '12 triệu+', label: 'Ứng viên đang tìm việc' },
    { value: '60.000+', label: 'Tin tuyển dụng mỗi ngày' },
    { value: '5.000+', label: 'Doanh nghiệp tin dùng' },
];

const features = [
    { icon: Zap, title: 'Đăng tin nhanh chóng', desc: 'Tạo tin tuyển dụng chỉ trong vài phút, tiếp cận ứng viên ngay lập tức.' },
    { icon: Users, title: 'Tiếp cận đúng ứng viên', desc: 'Bộ lọc thông minh giúp bạn tìm đúng người phù hợp với vị trí cần tuyển.' },
    { icon: ShieldCheck, title: 'Quản lý minh bạch', desc: 'Theo dõi trạng thái từng ứng viên, duyệt hồ sơ ngay trên hệ thống.' },
];

export default function EmployerHomePage() {
    return (
        <div>
            {/* Hero */}
            <section className="bg-gradient-to-b from-amber-50 to-white px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl font-extrabold leading-tight text-slate-800 md:text-5xl">
                        Đăng tin tuyển dụng <span className="text-amber-500">miễn phí</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-500">
                        Tiếp cận hàng triệu ứng viên đang tìm việc trên JVN mỗi ngày
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/register"
                            className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600"
                        >
                            Đăng tin ngay <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a
                            href="tel:1900068889"
                            className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-8 py-3.5 text-sm font-bold text-slate-700 hover:border-slate-300"
                        >
                            Tư vấn miễn phí
                        </a>
                    </div>
                </div>

                <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
                    {stats.map((s) => (
                        <div key={s.label} className="text-center">
                            <p className="text-3xl font-extrabold text-slate-800">{s.value}</p>
                            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section >

            {/* Features */}
            < section className="mx-auto max-w-6xl px-6 py-20" >
                <h2 className="mb-12 text-center text-2xl font-bold text-slate-800">
                    Vì sao chọn JVN for Business?
                </h2>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {features.map((f) => (
                        <div key={f.title} className="rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                <f.icon className="h-7 w-7" />
                            </span>
                            <h3 className="mt-5 text-base font-bold text-slate-800">{f.title}</h3>
                            <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section >

            {/* CTA cuối trang */}
            < section className="bg-slate-900 px-6 py-16 text-center" >
                <h2 className="text-2xl font-bold text-white">Sẵn sàng tìm ứng viên phù hợp?</h2>
                <p className="mt-2 text-slate-300">Đăng ký tài khoản doanh nghiệp miễn phí ngay hôm nay</p>
                <Link
                    href="/register"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-amber-600"
                >
                    Bắt đầu ngay <ArrowRight className="h-4 w-4" />
                </Link>
            </section >
        </div >
    );
}