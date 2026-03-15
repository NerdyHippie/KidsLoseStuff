const BASE = import.meta.env.VITE_API_URL ?? 'https://kids-lose-stuff.nerdiesthippie.workers.dev';

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        credentials: 'include',
        ...opts,
        headers: { ...opts.headers },
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((e as { error?: string }).error ?? res.statusText);
    }
    return res.json() as Promise<T>;
}

export const api = {
    me: () => request<import('./types').Me>('/api/me'),

    gallery: (slug: string) =>
        request<{ school: import('./types').School; items: import('./types').Item[] }>(
            `/api/gallery/${slug}`
        ),

    claimItem: (itemId: string, initials: string, teacher_name: string) =>
        request<{ success: boolean }>(`/api/items/${itemId}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initials, teacher_name }),
        }),

    dashboard: (schoolId?: string) =>
        request<{ items: import('./types').Item[] }>(
            `/api/dashboard${schoolId ? `?schoolId=${schoolId}` : ''}`
        ),

    uploadItem: (schoolId: string, description: string, image: File) => {
        const fd = new FormData();
        fd.append('schoolId', schoolId);
        fd.append('description', description);
        fd.append('image', image);
        return request<import('./types').Item>('/api/items', { method: 'POST', body: fd });
    },

    deleteItem: (itemId: string) =>
        request<{ success: boolean }>(`/api/items/${itemId}`, { method: 'DELETE' }),

    schools: () =>
        request<{ schools: import('./types').School[] }>('/api/schools'),

    createSchool: (name: string, slug: string) =>
        request<import('./types').School>('/api/schools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, slug }),
        }),

    getFaculty: (schoolId: string) =>
        request<{ faculty: import('./types').FacultyMember[] }>(`/api/schools/${schoolId}/faculty`),

    addFaculty: (schoolId: string, email: string, name: string, role: string) =>
        request<import('./types').FacultyMember>(`/api/schools/${schoolId}/faculty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, role }),
        }),

    removeFaculty: (schoolId: string, facultyId: string) =>
        request<{ success: boolean }>(`/api/schools/${schoolId}/faculty/${facultyId}`, {
            method: 'DELETE',
        }),

    logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

    imageUrl: (key: string) => `${BASE}/api/images/${encodeURIComponent(key)}`,

    loginUrl: () => `${BASE}/api/auth/login`,
};
