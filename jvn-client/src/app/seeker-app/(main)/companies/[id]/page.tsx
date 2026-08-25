'use client';

import { useParams } from 'next/navigation';
import { Building2, Users, Briefcase, MapPin, Globe, Calendar } from 'lucide-react';
import { useCompanyDetail } from '@/features/companines/hooks/useCompanies';
import { useCheckFollowing } from '@/features/follow/hooks/useCheckFollowing';
import { useFollowCompany } from '@/features/follow/hooks/useFollowCompany';
import { usePublicJobs } from '@/features/jobs/hooks/usePublicJob';
import JobListCard from '@/components/ui/JobListCard';

export default function CompanyDetailPage() {
    const params = useParams();
    const id = Number(params.id);

    const { data: company, isLoading, isError } = useCompanyDetail(id);
    const { data: followingData } = useCheckFollowing(id);
    const followCompany = useFollowCompany(id);
    const isFollowing = followingData?.is_following ?? false;

    const { data: jobsData } = usePublicJobs({ company_id: company?.id, page: 1, page_size: 10 });

    if (isLoading) return <div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>;
    if (isError || !company) return <div className="py-16 text-center text-sm text-red-500">Không tìm thấy công ty này.</div>;

    return (
        <div className="bg-slate-50 pb-16">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <div className="rounded-2xl border border-slate-100 bg-white p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
                                {company.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Building2 className="h-7 w-7 text-blue-500" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">{company.name}</h1>
                                <p className="mt-1 text-sm text-slate-500">{company.industry || 'Chưa cập nhật lĩnh vực'}</p>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {company.active_jobs_count} tin đang tuyển</span>
                                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {company.followers_count} người theo dõi</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => followCompany.mutate()}
                            disabled={followCompany.isPending}
                            className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${isFollowing ? 'border border-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {isFollowing ? 'Đang theo dõi' : 'Theo dõi công ty'}
                        </button>
                    </div>

                    {company.description && (
                        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{company.description}</p>
                    )}

                    <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400" /> {[company.exact_address, company.ward, company.province].filter(Boolean).join(', ')}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <Users className="h-4 w-4 text-slate-400" /> Quy mô: {company.headcount || 'Chưa cập nhật'}
                        </div>
                        {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                                <Globe className="h-4 w-4" /> {company.website}
                            </a>
                        )}
                        {company.founded_date && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="h-4 w-4 text-slate-400" /> Thành lập: {new Date(company.founded_date).toLocaleDateString('vi-VN')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="mb-4 text-lg font-bold text-slate-800">Việc làm đang tuyển</h2>
                    <div className="space-y-3">
                        {jobsData?.results.length ? (
                            jobsData.results.map((job) => <JobListCard key={job.id} job={job} />)
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
                                Hiện chưa có tin tuyển dụng nào.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}