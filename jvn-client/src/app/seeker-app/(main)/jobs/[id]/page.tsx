'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
    ArrowLeft, Link2, Heart, Send, MapPin, Star,
    Clock, Building2, Users, Briefcase, TrendingUp, ChevronRight, Info,
    ShieldCheck, X,
} from 'lucide-react';
import { useSaveJob } from '@/features/jobs/hooks/useSavedJob';
import { useCheckSavedJob } from '@/features/jobs/hooks/useCheckSavedJob';
import { useFollowCompany } from '@/features/follow/hooks/useFollowCompany';
import { useCheckFollowing } from '@/features/follow/hooks/useCheckFollowing';
import { usePublicJobDetail, usePublicJobs } from '@/features/jobs/hooks/usePublicJob';
import { useCheckApplied } from '@/features/applications/hooks/useApplyJob';
import { JobPost } from '@/features/jobs/types/jobs';
import JobListCard from '@/components/ui/JobListCard';
import { FacebookIcon, LinkedinIcon } from '@/components/icons/icons';
import ApplyJobModal from '@/components/ui/ApplyJobModal';
import ReportButton from '@/features/reports/components/ReportButton';
import { REPORT_TARGET_TYPE } from '@/features/reports/types/report';

const typeLabels: Record<string, string> = {
    FULLTIME: 'Toàn thời gian', PARTTIME: 'Bán thời gian', HYBRID: 'Hỗn hợp', REMOTE: 'Từ xa',
};
const levelLabels: Record<string, string> = {
    INTERN: 'Intern', FRESHER: 'Fresher', JUNIOR: 'Junior', SENIOR: 'Senior',
};

function formatSalary(job: JobPost) {
    if (job.is_negotiable) return 'Thỏa thuận';
    const min = job.salary_min ? Number(job.salary_min).toLocaleString('vi-VN') : null;
    const max = job.salary_max ? Number(job.salary_max).toLocaleString('vi-VN') : null;
    if (min && max) return `${min} - ${max} ${job.currency}`;
    if (min) return `Từ ${min} ${job.currency}`;
    if (max) return `Đến ${max} ${job.currency}`;
    return 'Thỏa thuận';
}

function formatDate(value: string | null) {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fullAddress(job: JobPost) {
    if (job.company_exact_address) {
        return job.company_exact_address;
    }
    const parts = [job.company_ward, job.company_province].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
}

const safetyTips = [
    'Kiểm tra thông tin công ty, việc làm trước khi ứng tuyển.',
    'Không nộp bất kỳ khoản phí nào trước khi được nhận việc.',
    'Cẩn trọng với tin tuyển dụng yêu cầu ký giấy tờ không rõ ràng hoặc nộp giấy tờ gốc ngay từ đầu.',
    'Ưu tiên phỏng vấn trực tiếp tại địa chỉ công ty rõ ràng, tránh chỉ giao dịch qua tin nhắn.',
];

export default function PublicJobDetailPage() {
    const params = useParams();
    const id = Number(params.id);
    const { data: job, isLoading, isError } = usePublicJobDetail(id);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'detail' | 'related'>('detail');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const router = useRouter();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { data: savedData } = useCheckSavedJob(id);
    const { data: isApplied } = useCheckApplied(id);
    const saveJob = useSaveJob(id);
    const isSaved = savedData?.is_saved ?? false;

    const { data: followingData } = useCheckFollowing(job?.company_id ?? 0);
    const followCompany = useFollowCompany(job?.company_id ?? 0);
    const isFollowing = followingData?.is_following ?? false;

    const handleToggleSave = () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/jobs/${id}`);
            return;
        }
        if (saveJob.isPending) return;
        saveJob.mutate();
    };

    const handleToggleFollow = () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/jobs/${id}`);
            return;
        }
        if (followCompany.isPending) return;
        followCompany.mutate();
    };

    const handleApplyClick = () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/jobs/${id}`);
            return;
        }
        if (isApplied) return;
        setShowApplyModal(true);
    };

    const relatedCategoryIds = job?.category?.map((c) => c.id) ?? [];
    const { data: relatedData } = usePublicJobs({
        category_ids: relatedCategoryIds.length > 0 ? relatedCategoryIds : undefined,
        page: 1,
        page_size: 6,
    },
        { enabled: relatedCategoryIds.length > 0 }
    );
    const relatedJobs = (relatedData?.results ?? []).filter((j) => j.id !== id);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleShareFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    };

    const handleShareLinkedin = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
    };

    if (isLoading) {
        return <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">Đang tải...</div>;
    }

    if (isError || !job) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-red-500">Không tìm thấy tin tuyển dụng này.</p>
                <Link href="/jobs" className="text-sm font-semibold text-blue-600 hover:underline">Quay lại tìm việc</Link>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 pb-16">
            <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
                {/* Breadcrumb */}
                <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                    <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/jobs" className="hover:text-blue-600">Việc làm</Link>
                    {job.category?.[0] && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <Link href={`/jobs?category_ids=${job.category[0].id}`} className="hover:text-blue-600">
                                {job.category[0].title}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="truncate text-slate-700">{job.title}</span>
                </div>

                <Link href="/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 sm:hidden">
                    <ArrowLeft className="h-4 w-4" /> Quay lại
                </Link>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[64px_1fr_360px]">
                    {/* Share icons - cột trái, chỉ desktop */}
                    <div className="hidden flex-col items-center gap-3 lg:flex">
                        <button onClick={handleShareFacebook} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-600">
                            <FacebookIcon className="h-4 w-4" />
                        </button>
                        <button onClick={handleShareLinkedin} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-600">
                            <LinkedinIcon className="h-4 w-4" />
                        </button>
                        <button onClick={handleCopyLink} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-600">
                            <Link2 className="h-4 w-4" />
                            {copied && (
                                <span className="absolute left-12 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs text-white">
                                    Đã sao chép
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Cột giữa: nội dung chính */}
                    <div className="min-w-0">
                        {/* Card tiêu đề + nút hành động */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-6">
                            <h1 className="text-xl font-bold leading-snug text-slate-800 sm:text-2xl">{job.title}</h1>

                            <p className="mt-3 text-2xl font-bold text-blue-600">{formatSalary(job)}</p>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                        <MapPin className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-xs text-slate-400">Địa điểm</p>
                                        <p className="text-sm font-semibold text-slate-700">{job.company_province || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                        <Star className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-xs text-slate-400">Kinh nghiệm</p>
                                        <p className="text-sm font-semibold text-slate-700">{job.experience_requirement}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                        <Clock className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-xs text-slate-400">Hạn ứng tuyển</p>
                                        <p className="text-sm font-semibold text-slate-700">{formatDate(job.expiration_date)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={handleApplyClick}
                                    disabled={isApplied}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white ${isApplied ? 'cursor-not-allowed bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    <Send className="h-4 w-4" /> {isApplied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
                                </button>
                                <button
                                    onClick={handleToggleSave}
                                    disabled={saveJob.isPending}
                                    className={`flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold disabled:opacity-60 ${isSaved ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                                        }`}
                                >
                                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-blue-600' : ''}`} /> {isSaved ? 'Đã lưu' : 'Lưu tin'}
                                </button>
                            </div>
                        </div>

                        {/* Tổng quan */}
                        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-6">
                            <h2 className="mb-3 border-l-4 border-blue-600 pl-3 text-base font-bold text-slate-800">Tổng quan</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex flex-wrap items-start gap-3">
                                    <span className="w-24 shrink-0 text-slate-400">Yêu cầu:</span>
                                    <div className="flex flex-1 flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{job.experience_requirement == '0' ? "Không yêu cầu kinh nghiệm" : `${job.experience_requirement} năm kinh nghiệm`}</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{levelLabels[job.level] ?? job.level}</span>
                                    </div>
                                </div>
                                {job.benefit && (
                                    <div className="flex flex-wrap items-start gap-3">
                                        <span className="w-24 shrink-0 text-slate-400">Quyền lợi:</span>
                                        <p className="flex-1 text-slate-600">{job.benefit.slice(0, 80)}{job.benefit.length > 80 ? '...' : ''}</p>
                                    </div>
                                )}
                                {job.tags?.length > 0 && (
                                    <div className="flex flex-wrap items-start gap-3">
                                        <span className="w-24 shrink-0 text-slate-400">Kỹ năng:</span>
                                        <div className="flex flex-1 flex-wrap gap-2">
                                            {job.tags.map((t) => (
                                                <span key={t.id} className="rounded-full bg-blue-50 px-3 py-1 text-blue-600">{t.tag_name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs dính trên đầu */}
                        <div className="sticky top-0 z-20 mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-2 py-1">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setActiveTab('detail')}
                                    className={`rounded-xl px-4 py-3 text-sm font-bold ${activeTab === 'detail' ? 'text-blue-600' : 'text-slate-500'}`}
                                >
                                    Chi tiết tin tuyển dụng
                                    {activeTab === 'detail' && <div className="mt-1 h-0.5 w-full rounded-full bg-blue-600" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab('related')}
                                    className={`rounded-xl px-4 py-3 text-sm font-bold ${activeTab === 'related' ? 'text-blue-600' : 'text-slate-500'}`}
                                >
                                    Việc làm liên quan
                                    {activeTab === 'related' && <div className="mt-1 h-0.5 w-full rounded-full bg-blue-600" />}
                                </button>
                            </div>
                            <button
                                onClick={handleApplyClick}
                                disabled={isApplied}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white ${isApplied ? 'cursor-not-allowed bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                <Send className="h-4 w-4" /> {isApplied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
                            </button>
                        </div>

                        {activeTab === 'detail' ? (
                            <>
                                <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6">
                                    <h2 className="mb-3 border-l-4 border-blue-600 pl-3 text-base font-bold text-slate-800">Mô tả công việc</h2>
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.descriptions}</p>
                                </section>

                                <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6">
                                    <h2 className="mb-3 border-l-4 border-blue-600 pl-3 text-base font-bold text-slate-800">Yêu cầu ứng viên</h2>
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.requirement}</p>

                                    {job.tags?.length > 0 && (
                                        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-500">
                                                <Info className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400">Kỹ năng liên quan</p>
                                                <p className="text-sm font-medium text-slate-700">{job.tags.map((t) => t.tag_name).join(', ')}</p>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {job.benefit && (
                                    <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6">
                                        <h2 className="mb-3 border-l-4 border-blue-600 pl-3 text-base font-bold text-slate-800">Quyền lợi ứng viên</h2>
                                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.benefit}</p>
                                    </section>
                                )}

                                <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6">
                                    <h2 className="mb-3 border-l-4 border-blue-600 pl-3 text-base font-bold text-slate-800">Địa điểm và thời gian</h2>
                                    <p className="mb-1 text-sm font-semibold text-slate-700">Địa điểm làm việc</p>
                                    <p className="mb-4 text-sm text-slate-600">{fullAddress(job) || 'Chưa cập nhật địa chỉ cụ thể'}</p>
                                    <p className="mb-1 text-sm font-semibold text-slate-700">Cách thức ứng tuyển</p>
                                    <p className="text-sm text-slate-600">
                                        Ứng viên nộp hồ sơ trực tuyến bằng cách bấm <span className="font-semibold text-blue-600">Ứng tuyển ngay</span> phía trên.
                                    </p>

                                    <button
                                        onClick={handleApplyClick}
                                        disabled={isApplied}
                                        className={`flex flex-1 mt-4 mb-4 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white ${isApplied ? 'cursor-not-allowed bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        <Send className="h-4 w-4" /> {isApplied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
                                    </button>
                                    <div>
                                        <ReportButton targetType={REPORT_TARGET_TYPE.JOB_POST} targetId={job.id} />
                                    </div>
                                </section>
                            </>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {relatedJobs.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
                                        Chưa có việc làm liên quan.
                                    </div>
                                ) : (
                                    relatedJobs.map((j) => <JobListCard key={j.id} job={j} />)
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar phải */}
                    <div className="space-y-4">
                        {/* Card công ty */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
                                    {job.company_logo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={job.company_logo} alt={job.company_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-6 w-6 text-blue-500" />
                                    )}
                                </div>
                                <h3 className="text-sm font-bold leading-snug text-slate-800">{job.company_name}</h3>
                                {job.company_id && (
                                    <div className='ml-auto'>
                                        <ReportButton targetType={REPORT_TARGET_TYPE.COMPANY} targetId={job.company_id} />
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex items-start gap-2.5">
                                    <Users className="h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400">Quy mô</p>
                                        <p className="font-medium text-slate-700">{job.company_headcount || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400">Lĩnh vực</p>
                                        <p className="font-medium text-slate-700">{job.company_industry || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-400">Địa điểm</p>
                                        <p className="font-medium text-slate-700">{fullAddress(job) || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/jobs?keyword=${encodeURIComponent(job.company_name)}`}
                                className="mt-4 block rounded-full border border-blue-600 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
                            >
                                Xem các tin khác của công ty
                            </Link>
                            <button
                                onClick={handleToggleFollow}
                                disabled={followCompany.isPending}
                                className={`mt-2 block w-full rounded-full py-2.5 text-center text-sm font-semibold disabled:opacity-60 ${isFollowing
                                    ? 'border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {isFollowing ? 'Đang theo dõi' : 'Theo dõi công ty'}
                            </button>
                        </div>

                        {/* Thông tin chung */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-5">
                            <h3 className="mb-3 text-sm font-bold text-slate-800">Thông tin chung</h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex items-center gap-2.5">
                                    <TrendingUp className="h-4 w-4 text-slate-400" />
                                    <dt className="text-slate-400">Cấp bậc:</dt>
                                    <dd className="ml-auto font-medium text-slate-700">{levelLabels[job.level] ?? job.level}</dd>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <dt className="text-slate-400">Số lượng tuyển:</dt>
                                    <dd className="ml-auto font-medium text-slate-700">{job.headcount} người</dd>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Briefcase className="h-4 w-4 text-slate-400" />
                                    <dt className="text-slate-400">Loại hình:</dt>
                                    <dd className="ml-auto font-medium text-slate-700">{typeLabels[job.type] ?? job.type}</dd>
                                </div>
                            </dl>
                        </div>

                        {job.category?.length > 0 && (
                            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Danh mục nghề liên quan</h3>
                                <div className="flex flex-col gap-2">
                                    {job.category.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/jobs?category_ids=${cat.id}`}
                                            className="rounded-full border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600"
                                        >
                                            {cat.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {job.company_province && (
                            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Tìm việc theo khu vực</h3>
                                <Link
                                    href={`/jobs?location=${encodeURIComponent(job.company_province)}`}
                                    className="inline-block rounded-full border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600"
                                >
                                    {job.company_province}
                                </Link>
                            </div>
                        )}

                        {/* Bí kíp tìm việc an toàn */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-5">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                                <ShieldCheck className="h-4 w-4 text-blue-600" /> Bí kíp tìm việc an toàn
                            </h3>
                            <ul className="space-y-2.5">
                                {safetyTips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <ApplyJobModal
                jobPostId={id}
                jobTitle={job.title}
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
            />
        </div>
    );
}