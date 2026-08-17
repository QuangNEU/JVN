import Link from 'next/link';
import { Building2, Users, Briefcase, Sparkles } from 'lucide-react';
import { FeaturedCompany } from '../types/companies';

export default function CompanyCard({ company }: { company: FeaturedCompany }) {
    return (
        <Link
            href={`/companies/${company.id}`}
            className="block rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md"
        >
            {company.is_promoted && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                    <Sparkles className="h-3 w-3" /> Nổi bật
                </span>
            )}
            <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
                    {company.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                    ) : (
                        <Building2 className="h-6 w-6 text-blue-500" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-bold text-slate-800">{company.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{company.industry || 'Chưa cập nhật lĩnh vực'}</p>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {company.active_jobs_count} tin đang tuyển</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {company.followers_count} theo dõi</span>
            </div>
        </Link>
    );
}