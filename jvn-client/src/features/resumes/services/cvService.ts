import axiosClient from "@/services/axios";
import type { CV, CVFormPayload, Tag } from "../types/cv";

function buildFormData(payload: CVFormPayload): FormData {
    const fd = new FormData();
    fd.append("title", payload.title);
    fd.append("level", payload.level);
    payload.tag_ids.forEach((id) => fd.append("tag_ids", String(id)));
    if (payload.file) fd.append("file", payload.file);
    return fd;
}

export const cvService = {
    list: async (): Promise<CV[]> => {
        const { data } = await axiosClient.get("/resumes/cvs");
        return data;
    },

    create: async (payload: CVFormPayload): Promise<CV> => {
        const { data } = await axiosClient.post("/resumes/cvs", buildFormData(payload), {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

    update: async (id: number, payload: CVFormPayload): Promise<CV> => {
        const { data } = await axiosClient.patch(`/resumes/cvs/${id}`, buildFormData(payload), {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

    remove: async (id: number): Promise<void> => {
        await axiosClient.delete(`/resumes/cvs/${id}`);
    },

    setDefault: async (id: number): Promise<CV> => {
        const { data } = await axiosClient.post(`/resumes/cvs/${id}/set-default`);
        return data;
    },
};