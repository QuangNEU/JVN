// src/components/layout/Footer.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Users, Briefcase, PlaySquare, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = [
    {
        title: 'Về JVN',
        links: [
            { label: 'Giới thiệu', href: '/about' },
            { label: 'Điều khoản dịch vụ', href: '/terms' },
            { label: 'Chính sách bảo mật', href: '/privacy' },
            { label: 'Liên hệ', href: '/contact' },
        ],
    },
    {
        title: 'Dành cho ứng viên',
        links: [
            { label: 'Tìm việc làm', href: '/jobs' },
            { label: 'Tạo CV', href: '/cvs' },
            { label: 'Việc làm theo danh mục', href: '/jobs?category=all' },
        ],
    },
    {
        title: 'Dành cho nhà tuyển dụng',
        links: [
            { label: 'Đăng tin tuyển dụng', href: '/company/jobs/new' },
            { label: 'Quản lý tin đã đăng', href: '/company/jobs' },
            { label: 'Bảng giá dịch vụ', href: '/pricing' },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="border-t border-slate-100 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-14">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
                    {/* Cột logo + thông tin liên hệ */}
                    <div>
                        <Image src="/logo.png" alt="JVN" width={72} height={84} />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
                            Nền tảng kết nối ứng viên và nhà tuyển dụng — tìm việc nhanh, tuyển đúng người.
                        </p>
                        <div className="mt-5 space-y-2.5 text-sm text-slate-500">
                            <div className="flex items-center gap-2.5">
                                <Phone className="h-4 w-4 text-blue-600" />
                                <span>1900 068 889</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <span>[email protected]</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
                                <span>Hà Nội, Việt Nam</span>
                            </div>
                        </div>
                    </div>

                    {/* Các cột link */}
                    {footerLinks.map((col) => (
                        <div key={col.title}>
                            <h3 className="mb-4 text-sm font-bold text-slate-800">{col.title}</h3>
                            <ul className="space-y-2.5">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-slate-500 transition-colors hover:text-blue-600"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="my-10 h-px bg-slate-100" />

                {/* Bottom bar */}
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-sm text-slate-400">
                        © {new Date().getFullYear()} JVN. Bảo lưu mọi quyền.
                    </p>
                    <div className="flex items-center gap-3">
                        {[Users, Briefcase, PlaySquare].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-blue-500 hover:text-blue-600"
                            >
                                <Icon className="h-4 w-4" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer >
    );
}