'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { Province, Ward } from '../types/vnLocations';
import { getProvinces, getWardsByProvince } from '../services/vnLocations';
import { ProvinceWardSelectProps, ProvinceWardValue } from '../types/vnLocations';



export default function ProvinceWardSelect({ value, onChange, accentClassName = 'border-blue-500' }: ProvinceWardSelectProps) {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [isProvinceOpen, setIsProvinceOpen] = useState(false);
    const [isWardOpen, setIsWardOpen] = useState(false);
    const [provinceSearch, setProvinceSearch] = useState('');
    const [wardSearch, setWardSearch] = useState('');

    const provinceRef = useRef<HTMLDivElement>(null);
    const wardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getProvinces().then(setProvinces);
    }, []);

    useEffect(() => {
        if (value.provinceCode) {
            getWardsByProvince(value.provinceCode).then(setWards);
        } else {
            setWards([]);
        }
    }, [value.provinceCode]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) setIsProvinceOpen(false);
            if (wardRef.current && !wardRef.current.contains(e.target as Node)) setIsWardOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectProvince = (p: Province) => {
        onChange({ provinceCode: p.code, provinceName: p.name, wardCode: undefined, wardName: undefined });
        setIsProvinceOpen(false);
        setProvinceSearch('');
    };

    const selectWard = (w: Ward) => {
        onChange({ ...value, wardCode: w.code, wardName: w.name });
        setIsWardOpen(false);
        setWardSearch('');
    };

    const filteredProvinces = provinces.filter((p) => p.name.toLowerCase().includes(provinceSearch.toLowerCase()));
    const filteredWards = wards.filter((w) => w.name.toLowerCase().includes(wardSearch.toLowerCase()));

    return (
        <div className="grid grid-cols-2 gap-4">
            <div ref={provinceRef} className="relative">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tỉnh/Thành phố *</label>
                <button
                    type="button"
                    onClick={() => setIsProvinceOpen((v) => !v)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm outline-none ${isProvinceOpen ? accentClassName : 'border-slate-200'}`}
                >
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className={`flex-1 truncate ${value.provinceName ? 'text-slate-700' : 'text-slate-400'}`}>
                        {value.provinceName || 'Chọn tỉnh/thành phố'}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isProvinceOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProvinceOpen && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                autoFocus value={provinceSearch} onChange={(e) => setProvinceSearch(e.target.value)}
                                placeholder="Tìm tỉnh/thành phố"
                                className="w-full text-sm outline-none"
                            />
                        </div>
                        <div className="max-h-52 overflow-y-auto p-1">
                            {filteredProvinces.map((p) => (
                                <button
                                    key={p.code} type="button" onClick={() => selectProvince(p)}
                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div ref={wardRef} className="relative">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phường/xã *</label>
                <button
                    type="button"
                    disabled={!value.provinceCode}
                    onClick={() => setIsWardOpen((v) => !v)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm outline-none ${!value.provinceCode ? 'cursor-not-allowed bg-slate-50 border-slate-200' : isWardOpen ? accentClassName : 'border-slate-200'}`}
                >
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className={`flex-1 truncate ${value.wardName ? 'text-slate-700' : 'text-slate-400'}`}>
                        {value.wardName || 'Chọn phường/xã'}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isWardOpen ? 'rotate-180' : ''}`} />
                </button>

                {isWardOpen && value.provinceCode && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                autoFocus value={wardSearch} onChange={(e) => setWardSearch(e.target.value)}
                                placeholder="Tìm phường/xã"
                                className="w-full text-sm outline-none"
                            />
                        </div>
                        <div className="max-h-52 overflow-y-auto p-1">
                            {filteredWards.map((w) => (
                                <button
                                    key={w.code} type="button" onClick={() => selectWard(w)}
                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    {w.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}