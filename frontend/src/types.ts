export interface School {
  id: string;
  name: string;
  slug: string;
  created_at: number;
}

export interface Item {
  id: string;
  description: string;
  image_key?: string;   // only in dashboard
  status: 'unclaimed' | 'claimed';
  created_at: number;
  // claim info (if claimed)
  initials?: string;
  teacher_name?: string;
  claimed_at?: number;
}

export interface Me {
  sub: string;
  email: string;
  schoolId: string | null;
  schoolName: string | null;
  role: 'superadmin' | 'schooladmin' | 'staff';
}

export interface FacultyMember {
  id: string;
  email: string;
  name: string;
  role: string;
}
