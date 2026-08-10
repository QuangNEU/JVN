export interface Province {
    code: string;
    name: string;
    type: string;
}

export interface Ward {
    code: string;
    name: string;
    type: string;
    province_code: string;
}

export interface SelectedLocation {
    key: string;
    type: 'province' | 'ward';
    provinceCode: string;
    provinceName: string;
    name: string;
}

export interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (locations: SelectedLocation[]) => void;
    initialSelected?: SelectedLocation[];
}

export interface ProvinceWardValue {
    provinceCode?: string;
    provinceName?: string;
    wardCode?: string;
    wardName?: string;
}

export interface ProvinceWardSelectProps {
    value: ProvinceWardValue;
    onChange: (value: ProvinceWardValue) => void;
    accentClassName?: string;
}