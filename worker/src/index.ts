// ─────────────────────────────────────────────────────────────────────────────
// Lost & Found – Cloudflare Worker
// ─────────────────────────────────────────────────────────────────────────────

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  FRONTEND_URL: string;
  WORKER_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  SUPERADMIN_EMAIL: string;
}

interface JWTPayload {
  sub: string;           // faculty id  (or 'superadmin')
  email: string;
  schoolId: string | null;
  role: string;          // 'superadmin' | 'schooladmin' | 'staff'
  exp: number;
}

// ── Crypto helpers ─────────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer | Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeB64url(s: string): string {
  return atob(s.replace(/-/g, '+').replace(/_/g, '/'));
}

async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header  = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body    = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const input   = `${header}.${body}`;
  const key     = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(decodeB64url(s), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes,
      new TextEncoder().encode(`${h}.${p}`));
    if (!valid) return null;
    const payload: JWTPayload = JSON.parse(decodeB64url(p));
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

function uuid(): string {
  return crypto.randomUUID();
}

// ── Response helpers ───────────────────────────────────────────────────────

function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function err(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ── Auth middleware ────────────────────────────────────────────────────────

async function getUser(req: Request, env: Env): Promise<JWTPayload | null> {
  const cookie = req.headers.get('Cookie') ?? '';
  const match  = cookie.match(/(?:^|;\s*)laf_session=([^;]+)/);
  if (!match) return null;
  return verifyJWT(match[1], env.JWT_SECRET);
}

function requireAuth(user: JWTPayload | null, role?: string): Response | null {
  if (!user) return err('Unauthorized', 401);
  if (role && user.role !== role && user.role !== 'superadmin') return err('Forbidden', 403);
  return null;
}

// ── Main handler ───────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;
    const origin = env.FRONTEND_URL;
    const cors   = corsHeaders(origin);

    // Preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    function respond(r: Response): Response {
      const h = new Headers(r.headers);
      for (const [k, v] of Object.entries(cors)) h.set(k, v);
      return new Response(r.body, { status: r.status, headers: h });
    }

    try {
      const result = await route(request, url, path, method, env);
      return respond(result);
    } catch (e: unknown) {
      console.error(e);
      return respond(err('Internal server error', 500));
    }
  },
};

// ── Router ─────────────────────────────────────────────────────────────────

async function route(
  req: Request,
  url: URL,
  path: string,
  method: string,
  env: Env,
): Promise<Response> {

  // ── Public: gallery ─────────────────────────────────────────────────────
  // GET /api/gallery/:slug
  const galleryMatch = path.match(/^\/api\/gallery\/([^/]+)$/);
  if (galleryMatch && method === 'GET') {
    const slug = galleryMatch[1];
    const school = await env.DB.prepare(
      'SELECT id, name, slug FROM schools WHERE slug = ?'
    ).bind(slug).first<{ id: string; name: string; slug: string }>();
    if (!school) return err('School not found', 404);

    const items = await env.DB.prepare(`
      SELECT i.id, i.description, i.status, i.created_at,
             c.initials, c.teacher_name
      FROM   items i
      LEFT JOIN claims c ON c.item_id = i.id
      WHERE  i.school_id = ?
      ORDER  BY i.created_at DESC
    `).bind(school.id).all();

    return json({ school, items: items.results });
  }

  // ── Public: image proxy ─────────────────────────────────────────────────
  // GET /api/images/:key  (key may include slashes encoded as ~)
  if (path.startsWith('/api/images/') && method === 'GET') {
    const key = decodeURIComponent(path.replace('/api/images/', ''));
    const obj = await env.BUCKET.get(key);
    if (!obj) return new Response('Not found', { status: 404 });
    const headers = new Headers();
    headers.set('Content-Type', obj.httpMetadata?.contentType ?? 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    return new Response(obj.body, { headers });
  }

  // ── Public: claim item ──────────────────────────────────────────────────
  // POST /api/items/:id/claim
  const claimMatch = path.match(/^\/api\/items\/([^/]+)\/claim$/);
  if (claimMatch && method === 'POST') {
    const itemId = claimMatch[1];
    const body   = await req.json<{ initials?: string; teacher_name?: string }>();
    const initials     = (body.initials     ?? '').trim().toUpperCase().slice(0, 5);
    const teacherName  = (body.teacher_name ?? '').trim().slice(0, 80);
    if (!initials || !teacherName) return err('Initials and teacher name required');

    const item = await env.DB.prepare(
      'SELECT id, status FROM items WHERE id = ?'
    ).bind(itemId).first<{ id: string; status: string }>();
    if (!item) return err('Item not found', 404);
    if (item.status !== 'unclaimed') return err('Item already claimed');

    await env.DB.batch([
      env.DB.prepare("UPDATE items SET status = 'claimed' WHERE id = ?").bind(itemId),
      env.DB.prepare(
        'INSERT INTO claims (id, item_id, initials, teacher_name) VALUES (?,?,?,?)'
      ).bind(uuid(), itemId, initials, teacherName),
    ]);

    return json({ success: true });
  }

  // ── Auth: Google OAuth ──────────────────────────────────────────────────
  // GET /api/auth/login
  if (path === '/api/auth/login' && method === 'GET') {
    const params = new URLSearchParams({
      client_id:     env.GOOGLE_CLIENT_ID,
      redirect_uri:  `${env.WORKER_URL}/api/auth/callback`,
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'online',
    });
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
  }

  // GET /api/auth/callback
  if (path === '/api/auth/callback' && method === 'GET') {
    const code = url.searchParams.get('code');
    if (!code) return Response.redirect(`${env.FRONTEND_URL}/login?error=no_code`, 302);

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${env.WORKER_URL}/api/auth/callback`,
        grant_type:    'authorization_code',
      }),
    });
    if (!tokenRes.ok) return Response.redirect(`${env.FRONTEND_URL}/login?error=token`, 302);
    const tokens = await tokenRes.json<{ id_token: string }>();

    // Decode id_token (we trust Google so no full verify needed here)
    const idPayload = JSON.parse(decodeB64url(tokens.id_token.split('.')[1]));
    const email: string = idPayload.email;
    if (!email) return Response.redirect(`${env.FRONTEND_URL}/login?error=no_email`, 302);

    let payload: JWTPayload;

    // Superadmin check
    if (email.toLowerCase() === env.SUPERADMIN_EMAIL.toLowerCase()) {
      payload = { sub: 'superadmin', email, schoolId: null, role: 'superadmin',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 };
    } else {
      // Look up faculty record
      const faculty = await env.DB.prepare(
        'SELECT id, school_id, role FROM faculty WHERE email = ?'
      ).bind(email.toLowerCase()).first<{ id: string; school_id: string; role: string }>();
      if (!faculty) return Response.redirect(`${env.FRONTEND_URL}/login?error=not_authorized`, 302);
      payload = {
        sub: faculty.id, email, schoolId: faculty.school_id, role: faculty.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      };
    }

    const token = await signJWT(payload, env.JWT_SECRET);
    const cookie = `laf_session=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 7}`;

    return new Response(null, {
      status: 302,
      headers: { Location: `${env.FRONTEND_URL}/dashboard`, 'Set-Cookie': cookie },
    });
  }

  // POST /api/auth/logout
  if (path === '/api/auth/logout' && method === 'POST') {
    const cookie = 'laf_session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0';
    return json({ success: true }, 200, { 'Set-Cookie': cookie });
  }

  // GET /api/me
  if (path === '/api/me' && method === 'GET') {
    const user = await getUser(req, env);
    if (!user) return err('Unauthorized', 401);

    let schoolName: string | null = null;
    if (user.schoolId) {
      const s = await env.DB.prepare('SELECT name FROM schools WHERE id = ?')
        .bind(user.schoolId).first<{ name: string }>();
      schoolName = s?.name ?? null;
    }
    return json({ ...user, schoolName });
  }

  // ── Protected: faculty dashboard ────────────────────────────────────────
  const user = await getUser(req, env);

  // GET /api/dashboard  — items + claims for the user's school
  if (path === '/api/dashboard' && method === 'GET') {
    const authErr = requireAuth(user);
    if (authErr) return authErr;
    const schoolId = url.searchParams.get('schoolId') ?? user!.schoolId;
    if (!schoolId) return err('No school', 400);
    // superadmin / schooladmin can query any school, staff only their own
    if (user!.role === 'staff' && schoolId !== user!.schoolId) return err('Forbidden', 403);

    const items = await env.DB.prepare(`
      SELECT i.id, i.description, i.image_key, i.status, i.created_at,
             c.initials, c.teacher_name, c.claimed_at
      FROM   items i
      LEFT JOIN claims c ON c.item_id = i.id
      WHERE  i.school_id = ?
      ORDER  BY i.created_at DESC
    `).bind(schoolId).all();

    return json({ items: items.results });
  }

  // POST /api/items  — upload new lost item
  if (path === '/api/items' && method === 'POST') {
    const authErr = requireAuth(user);
    if (authErr) return authErr;

    const formData   = await req.formData();
    const file       = formData.get('image') as File | null;
    const description = (formData.get('description') as string ?? '').trim().slice(0, 200);
    const schoolId   = (formData.get('schoolId') as string) ?? user!.schoolId;

    if (!file || !description || !schoolId) return err('image, description, and schoolId required');
    if (user!.role === 'staff' && schoolId !== user!.schoolId) return err('Forbidden', 403);

    // Validate file type
    const ct = file.type;
    if (!ct.startsWith('image/')) return err('File must be an image');

    const ext    = ct === 'image/png' ? 'png' : ct === 'image/gif' ? 'gif' : 'jpg';
    const itemId = uuid();
    const key    = `${schoolId}/${itemId}.${ext}`;

    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: ct },
    });

    await env.DB.prepare(
      'INSERT INTO items (id, school_id, description, image_key, created_by) VALUES (?,?,?,?,?)'
    ).bind(itemId, schoolId, description, key, user!.sub).run();

    return json({ id: itemId, image_key: key, description, status: 'unclaimed' }, 201);
  }

  // DELETE /api/items/:id  — mark returned, hard-delete photo + records
  const deleteMatch = path.match(/^\/api\/items\/([^/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const authErr = requireAuth(user);
    if (authErr) return authErr;
    const itemId = deleteMatch[1];

    const item = await env.DB.prepare(
      'SELECT school_id, image_key FROM items WHERE id = ?'
    ).bind(itemId).first<{ school_id: string; image_key: string }>();
    if (!item) return err('Not found', 404);
    if (user!.role === 'staff' && item.school_id !== user!.schoolId) return err('Forbidden', 403);

    // Delete from R2
    await env.BUCKET.delete(item.image_key);

    // Cascade delete: claims row is deleted via ON DELETE CASCADE; delete item
    await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(itemId).run();

    return json({ success: true });
  }

  // ── Superadmin: school management ───────────────────────────────────────

  // GET /api/schools
  if (path === '/api/schools' && method === 'GET') {
    const authErr = requireAuth(user, 'superadmin');
    if (authErr) return authErr;
    const schools = await env.DB.prepare('SELECT * FROM schools ORDER BY name').all();
    return json({ schools: schools.results });
  }

  // POST /api/schools
  if (path === '/api/schools' && method === 'POST') {
    const authErr = requireAuth(user, 'superadmin');
    if (authErr) return authErr;
    const body = await req.json<{ name?: string; slug?: string }>();
    const name = (body.name ?? '').trim().slice(0, 100);
    const slug = (body.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
    if (!name || !slug) return err('name and slug required');
    const id = uuid();
    await env.DB.prepare('INSERT INTO schools (id, name, slug) VALUES (?,?,?)').bind(id, name, slug).run();
    return json({ id, name, slug }, 201);
  }

  // GET /api/schools/:id/faculty
  const facultyListMatch = path.match(/^\/api\/schools\/([^/]+)\/faculty$/);
  if (facultyListMatch && method === 'GET') {
    const authErr = requireAuth(user);
    if (authErr) return authErr;
    const schoolId = facultyListMatch[1];
    if (user!.role === 'staff') return err('Forbidden', 403);
    if (user!.role === 'schooladmin' && user!.schoolId !== schoolId) return err('Forbidden', 403);
    const rows = await env.DB.prepare(
      'SELECT id, email, name, role FROM faculty WHERE school_id = ? ORDER BY email'
    ).bind(schoolId).all();
    return json({ faculty: rows.results });
  }

  // POST /api/schools/:id/faculty
  const facultyAddMatch = path.match(/^\/api\/schools\/([^/]+)\/faculty$/);
  if (facultyAddMatch && method === 'POST') {
    const authErr = requireAuth(user);
    if (authErr) return authErr;
    const schoolId = facultyAddMatch[1];
    if (user!.role === 'staff') return err('Forbidden', 403);
    if (user!.role === 'schooladmin' && user!.schoolId !== schoolId) return err('Forbidden', 403);

    const body  = await req.json<{ email?: string; name?: string; role?: string }>();
    const email = (body.email ?? '').toLowerCase().trim();
    const name  = (body.name  ?? '').trim().slice(0, 100);
    const role  = ['schooladmin', 'staff'].includes(body.role ?? '') ? body.role! : 'staff';
    if (!email) return err('email required');

    const id = uuid();
    try {
      await env.DB.prepare(
        'INSERT INTO faculty (id, school_id, email, name, role) VALUES (?,?,?,?,?)'
      ).bind(id, schoolId, email, name, role).run();
    } catch {
      return err('Faculty member already exists for this school');
    }
    return json({ id, email, name, role }, 201);
  }

  // DELETE /api/schools/:schoolId/faculty/:facultyId
  const facultyDelMatch = path.match(/^\/api\/schools\/([^/]+)\/faculty\/([^/]+)$/);
  if (facultyDelMatch && method === 'DELETE') {
    const authErr = requireAuth(user);
    if (authErr) return authErr;
    const [, schoolId, facultyId] = facultyDelMatch;
    if (user!.role === 'staff') return err('Forbidden', 403);
    if (user!.role === 'schooladmin' && user!.schoolId !== schoolId) return err('Forbidden', 403);
    await env.DB.prepare('DELETE FROM faculty WHERE id = ? AND school_id = ?').bind(facultyId, schoolId).run();
    return json({ success: true });
  }

  return err('Not found', 404);
}
