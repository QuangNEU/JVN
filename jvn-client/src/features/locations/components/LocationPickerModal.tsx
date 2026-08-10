'use client';

import { useState, useEffect } from 'react';
import { X, Search, ChevronRight, Check, Minus } from 'lucide-react';
import { Province, Ward, SelectedLocation, LocationPickerModalProps } from '../types/vnLocations';
import { getProvinces, getWardsByProvince } from '../services/vnLocations';





type CheckState = 'checked' | 'partial' | 'unchecked';

function CheckboxBox({ state }: { state: CheckState }) {
    if (state === 'unchecked') {
        return <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-slate-300" />;
    }
    return (
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-emerald-600">
            {state === 'checked' ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : <Minus className="h-3 w-3 text-white" strokeWidth={3} />}
        </span>
    );
}


export default function LocationPickerModal({ isOpen, onClose, onApply, initialSelected = [] }: LocationPickerModalProps) {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [activeProvince, setActiveProvince] = useState<Province | null>(null);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selected, setSelected] = useState<SelectedLocation[]>(initialSelected);
    const [loading, setLoading] = useState(false);
    const [provinceSearch, setProvinceSearch] = useState('');
    const [wardSearch, setWardSearch] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setSelected(initialSelected);
        setLoading(true);
        getProvinces().then((data) => { setProvinces(data); setLoading(false); });
        setActiveProvince(null);
        setWards([]);
        setWardSearch('');
    }, [isOpen]);

    const openProvince = async (p: Province) => {
        setActiveProvince(p);
        setWardSearch('');
        setWards(await getWardsByProvince(p.code));
    };

    const isSelected = (key: string) => selected.some((s) => s.key === key);

    const toggleProvinceWhole = (p: Province) => {
        const key = `province:${p.code}`;
        setSelected((s) =>
            isSelected(key)
                ? s.filter((x) => x.key !== key)
                : [...s, { key, type: 'province' as const, provinceCode: p.code, provinceName: p.name, name: p.name }]
        );
    };

    const toggleWard = (p: Province, w: Ward) => {
        const key = `ward:${w.code}`;
        setSelected((s) =>
            isSelected(key)
                ? s.filter((x) => x.key !== key)
                : [...s, { key, type: 'ward' as const, provinceCode: p.code, provinceName: p.name, name: w.name }]
        );
    };

    const toggleAllWards = (p: Province) => {
        const allKeys = wards.map((w) => `ward:${w.code}`);
        const allSelected = allKeys.length > 0 && allKeys.every((k) => isSelected(k));
        if (allSelected) {
            setSelected((s) => s.filter((x) => !allKeys.includes(x.key)));
        } else {
            const missing = wards
                .filter((w) => !isSelected(`ward:${w.code}`))
                .map((w) => ({ key: `ward:${w.code}`, type: 'ward' as const, provinceCode: p.code, provinceName: p.name, name: w.name }));
            setSelected((s) => [...s, ...missing]);
        }
    };

    const selectedWardCount = (provinceCode: string) =>
        selected.filter((s) => s.type === 'ward' && s.provinceCode === provinceCode).length;

    const filteredProvinces = provinces.filter((p) => p.name.toLowerCase().includes(provinceSearch.toLowerCase()));
    const filteredWards = wards.filter((w) => w.name.toLowerCase().includes(wardSearch.toLowerCase()));

    const allWardsState: CheckState = (() => {
        if (!activeProvince || wards.length === 0) return 'unchecked';
        const count = wards.filter((w) => isSelected(`ward:${w.code}`)).length;
        if (count === 0) return 'unchecked';
        return count === wards.length ? 'checked' : 'partial';
    })();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="text-base font-bold text-slate-800">Chọn địa điểm</h3>
                    <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-100" style={{ height: 400 }}>
                    <div className="flex flex-col overflow-y-auto p-3">
                        <div className="mb-1 flex items-center gap-2 border-b border-slate-100 px-2 pb-2">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                value={provinceSearch} onChange={(e) => setProvinceSearch(e.target.value)}
                                placeholder="Nhập Tỉnh/Thành phố"
                                className="w-full text-sm outline-none"
                            />
                        </div>
                        {loading ? (
                            <p className="px-2 py-4 text-sm text-slate-400">Đang tải...</p>
                        ) : (
                            filteredProvinces.map((p) => {
                                const isWholeSelected = isSelected(`province:${p.code}`);
                                const childCount = selectedWardCount(p.code);
                                const isActive = activeProvince?.code === p.code;
                                const state: CheckState = isWholeSelected ? 'checked' : childCount > 0 ? 'partial' : 'unchecked';
                                const highlighted = isActive || state !== 'unchecked';

                                return (
                                    <div
                                        key={p.code}
                                        onClick={() => openProvince(p)}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-2.5 text-sm ${highlighted ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <label className="flex flex-1 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <span onClick={() => toggleProvinceWhole(p)}>
                                                <CheckboxBox state={state} />
                                            </span>
                                            <span className={state !== 'unchecked' ? 'font-semibold text-blue-700' : 'text-slate-700'}>
                                                {p.name}
                                                {state === 'partial' && (
                                                    <span className="ml-1.5 text-xs font-normal text-slate-400">{childCount} phường/xã</span>
                                                )}
                                            </span>
                                        </label>
                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="flex flex-col overflow-y-auto p-3">
                        {!activeProvince ? (
                            <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-slate-400">
                                Vui lòng chọn Tỉnh/Thành phố
                            </div>
                        ) : (
                            <>
                                <div className="mb-1 flex items-center gap-2 border-b border-slate-100 px-2 pb-2">
                                    <Search className="h-4 w-4 text-slate-400" />
                                    <input
                                        value={wardSearch} onChange={(e) => setWardSearch(e.target.value)}
                                        placeholder="Nhập Phường/Xã"
                                        className="w-full text-sm outline-none"
                                    />
                                </div>
                                <label
                                    onClick={() => toggleAllWards(activeProvince)}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <CheckboxBox state={allWardsState} />
                                    Tất cả
                                </label>
                                <div className="my-1 border-t border-slate-100" />
                                {filteredWards.map((w) => {
                                    const checked = isSelected(`ward:${w.code}`);
                                    return (
                                        <label
                                            key={w.code}
                                            onClick={() => toggleWard(activeProvince, w)}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm ${checked ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <CheckboxBox state={checked ? 'checked' : 'unchecked'} />
                                            {w.name}
                                        </label>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <button onClick={() => setSelected([])} className="text-sm text-slate-500 hover:underline">
                        Bỏ chọn tất cả
                    </button>
                    <button
                        onClick={() => { onApply(selected); onClose(); }}
                        className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                    >
                        Áp dụng {selected.length > 0 && `(${selected.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
}