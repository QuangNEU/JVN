
export const CV_LEVELS = [
    "INTERN",
    "FRESHER",
    "JUNIOR",
    "MIDDLE",
    "SENIOR",
    "MANAGER",
] as const;

export type CVLevel = (typeof CV_LEVELS)[number];

export const CV_LEVEL_LABELS: Record<CVLevel, string> = {
    INTERN: "Thực tập sinh",
    FRESHER: "Fresher",
    JUNIOR: "Junior",
    MIDDLE: "Middle",
    SENIOR: "Senior",
    MANAGER: "Quản lý",
};

export interface Tag {
    id: number;
    tag_name: string;
}

export interface CV {
    id: number;
    title: string;
    file: string;
    level: CVLevel;
    is_default: boolean;
    tags: Tag[];
    created_at: string;
    updated_at: string;
}


export interface CVFormPayload {
    title: string;
    level: CVLevel;
    tag_ids: number[];
    file?: File | null;
}