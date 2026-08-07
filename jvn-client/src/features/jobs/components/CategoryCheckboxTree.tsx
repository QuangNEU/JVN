'use client';

import { useState } from 'react';
import { Check, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { Category } from '@/features/jobs/types/jobs';

interface CategoryCheckboxTreeProps {
    categories: Category[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    mode?: 'filter' | 'leaf-only';
    accentClassName?: string;
}

function CheckboxBox({ state, accentClassName }: { state: 'checked' | 'partial' | 'unchecked'; accentClassName: string }) {
    if (state === 'unchecked') {
        return <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300" />;
    }
    return (
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${accentClassName}`}>
            {state === 'checked' ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : <Minus className="h-3 w-3 text-white" strokeWidth={3} />}
        </span>
    );
}

export default function CategoryCheckboxTree({
    categories,
    selectedIds,
    onChange,
    mode = 'filter',
    accentClassName = 'bg-blue-600',
}: CategoryCheckboxTreeProps) {
    // Mặc định đóng, tự mở sẵn nhóm nào đang có category con được chọn
    const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
        const initial = new Set<number>();
        categories.forEach((cat) => {
            if (cat.children.some((c) => selectedIds.includes(c.id))) initial.add(cat.id);
        });
        return initial;
    });

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggle = (id: number) => {
        onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
    };

    const toggleGroup = (cat: Category) => {
        const childIds = cat.children.map((c) => c.id);
        const allSelected = childIds.every((id) => selectedIds.includes(id));
        onChange(
            allSelected
                ? selectedIds.filter((id) => !childIds.includes(id))
                : [...new Set([...selectedIds, ...childIds])]
        );
    };

    return (
        <div className="space-y-1">
            {categories.map((cat) => {
                const hasChildren = cat.children.length > 0;

                if (!hasChildren) {
                    const checked = selectedIds.includes(cat.id);
                    return (
                        <button
                            key={cat.id} type="button" onClick={() => toggle(cat.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <CheckboxBox state={checked ? 'checked' : 'unchecked'} accentClassName={accentClassName} />
                            {cat.title}
                        </button>
                    );
                }

                const childIds = cat.children.map((c) => c.id);
                const selectedChildCount = childIds.filter((id) => selectedIds.includes(id)).length;
                const isAllSelected = selectedChildCount === childIds.length;
                const isPartial = selectedChildCount > 0 && !isAllSelected;
                const isExpanded = expandedIds.has(cat.id);

                return (
                    <div key={cat.id}>
                        <div className="flex items-center gap-1">
                            <button
                                type="button" onClick={() => toggleExpand(cat.id)}
                                className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>

                            {mode === 'filter' ? (
                                <button
                                    type="button" onClick={() => toggleGroup(cat)}
                                    className="flex flex-1 items-center gap-2 rounded-lg py-1.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                >
                                    <CheckboxBox
                                        state={isAllSelected ? 'checked' : isPartial ? 'partial' : 'unchecked'}
                                        accentClassName={accentClassName}
                                    />
                                    {cat.title}
                                </button>
                            ) : (
                                <button
                                    type="button" onClick={() => toggleExpand(cat.id)}
                                    className="flex-1 py-1.5 text-left text-sm font-semibold text-slate-800"
                                >
                                    {cat.title}
                                </button>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="ml-7 space-y-1 border-l border-slate-100 pl-3">
                                {cat.children.map((child) => {
                                    const checked = selectedIds.includes(child.id);
                                    return (
                                        <button
                                            key={child.id} type="button" onClick={() => toggle(child.id)}
                                            className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                                        >
                                            <CheckboxBox state={checked ? 'checked' : 'unchecked'} accentClassName={accentClassName} />
                                            {child.title}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}