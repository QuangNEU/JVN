import { Province } from '../types/vnLocations';
import { Ward } from '../types/vnLocations';

let provincesCache: Province[] | null = null;
let wardsCache: Ward[] | null = null;

async function loadData() {
    if (!provincesCache || !wardsCache) {
        const [provinces, wards] = await Promise.all([
            import('../../../constants/current-provinces.json').then((m) => m.default as Province[]),
            import('../../../constants/current-wards.json').then((m) => m.default as Ward[]),
        ]);
        provincesCache = provinces;
        wardsCache = wards;
    }
    return { provinces: provincesCache, wards: wardsCache };
}

export async function getProvinces(): Promise<Province[]> {
    const { provinces } = await loadData();
    return provinces;
}

export async function getWardsByProvince(provinceCode: string): Promise<Ward[]> {
    const { wards } = await loadData();
    return wards.filter((w) => w.province_code === provinceCode);
}