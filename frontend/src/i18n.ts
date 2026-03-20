// ─── Locale Types ─────────────────────────────────────────────────────────────
export type Locale = 'en' | 'es' | 'pt' | 'am' | 'uk' | 'ro' | 'zh' | 'fr' | 'ko' | 'vi';

export interface Translations {
  langName: string;           // native name shown in picker
  heroSub: string;
  itemsWaiting: (n: number) => string;
  filterAll: (n: number) => string;
  filterUnclaimed: (n: number) => string;
  filterClaimed: (n: number) => string;
  noItems: (filter: string) => string;
  claimBtn: string;
  claimedBadge: string;
  footer: string;
  galleryNotFound: string;
  checkLink: string;
  // ClaimModal
  claimTitle: string;
  claimSubtitle: (desc: string) => string;
  initialsLabel: string;
  initialsPlaceholder: string;
  initialsHint: string;
  teacherLabel: string;
  teacherPlaceholder: string;
  cancel: string;
  submit: string;
  errorInitials: string;
  errorTeacher: string;
  errorGeneric: string;
  successTitle: string;
  successBody: string;
}

// ─── English ──────────────────────────────────────────────────────────────────
const en: Translations = {
  langName: 'English',
  heroSub: "Recognize something? Tap Claim This Item and enter your child's initials and teacher's name — we'll get it back to their homeroom.",
  itemsWaiting: (n) => `${n} item${n !== 1 ? 's' : ''} waiting to be claimed`,
  filterAll: (n) => `All (${n})`,
  filterUnclaimed: (n) => `Unclaimed (${n})`,
  filterClaimed: (n) => `Claimed (${n})`,
  noItems: (f) => `No ${f !== 'all' ? f + ' ' : ''}items right now!`,
  claimBtn: 'Claim This Item',
  claimedBadge: '✓ Claimed',
  footer: "Items are removed from this gallery once they've been returned to their owner.",
  galleryNotFound: 'Gallery not found',
  checkLink: 'Check the link and try again.',
  claimTitle: 'Claim This Item',
  claimSubtitle: (d) => `"${d}" — enter your child's initials and teacher's name. Faculty will drop it off at their homeroom.`,
  initialsLabel: "Child's Initials",
  initialsPlaceholder: 'e.g. A.M.',
  initialsHint: 'First and last initials only — no full name needed.',
  teacherLabel: "Teacher's Name",
  teacherPlaceholder: 'e.g. Mrs. Smith',
  cancel: 'Cancel',
  submit: 'Submit Claim',
  errorInitials: "Please enter your child's initials.",
  errorTeacher: "Please enter the teacher's name.",
  errorGeneric: 'Something went wrong.',
  successTitle: 'Claim Recorded!',
  successBody: 'Faculty will deliver the item to the homeroom. Keep an eye out!',
};

// ─── Spanish ──────────────────────────────────────────────────────────────────
const es: Translations = {
  langName: 'Español',
  heroSub: "¿Reconoce algo? Toque Reclamar este artículo e ingrese las iniciales de su hijo/a y el nombre del maestro/a — lo enviaremos a su salón de clases.",
  itemsWaiting: (n) => `${n} artículo${n !== 1 ? 's' : ''} esperando ser reclamado${n !== 1 ? 's' : ''}`,
  filterAll: (n) => `Todo (${n})`,
  filterUnclaimed: (n) => `Sin reclamar (${n})`,
  filterClaimed: (n) => `Reclamado (${n})`,
  noItems: (f) => `¡No hay artículos${f !== 'all' ? ' ' + f : ''} ahora mismo!`,
  claimBtn: 'Reclamar este artículo',
  claimedBadge: '✓ Reclamado',
  footer: 'Los artículos se eliminan de esta galería una vez que han sido devueltos a su dueño.',
  galleryNotFound: 'Galería no encontrada',
  checkLink: 'Verifique el enlace e intente de nuevo.',
  claimTitle: 'Reclamar este artículo',
  claimSubtitle: (d) => `"${d}" — ingrese las iniciales de su hijo/a y el nombre del maestro/a. El personal lo entregará en su salón de clases.`,
  initialsLabel: 'Iniciales del niño/a',
  initialsPlaceholder: 'p.ej. A.M.',
  initialsHint: 'Solo primera y última inicial — no se necesita el nombre completo.',
  teacherLabel: 'Nombre del maestro/a',
  teacherPlaceholder: 'p.ej. Sra. García',
  cancel: 'Cancelar',
  submit: 'Enviar reclamo',
  errorInitials: 'Por favor ingrese las iniciales de su hijo/a.',
  errorTeacher: 'Por favor ingrese el nombre del maestro/a.',
  errorGeneric: 'Algo salió mal.',
  successTitle: '¡Reclamo registrado!',
  successBody: 'El personal entregará el artículo en el salón de clases. ¡Esté atento/a!',
};

// ─── Portuguese ───────────────────────────────────────────────────────────────
const pt: Translations = {
  langName: 'Português',
  heroSub: "Reconheceu algo? Toque em Reivindicar este item e insira as iniciais do seu filho/a e o nome do professor/a — nós o devolveremos à sala de aula.",
  itemsWaiting: (n) => `${n} item${n !== 1 ? 's' : ''} aguardando para ser reivindicado${n !== 1 ? 's' : ''}`,
  filterAll: (n) => `Todos (${n})`,
  filterUnclaimed: (n) => `Não reivindicado (${n})`,
  filterClaimed: (n) => `Reivindicado (${n})`,
  noItems: (f) => `Nenhum item${f !== 'all' ? ' ' + f : ''} no momento!`,
  claimBtn: 'Reivindicar este item',
  claimedBadge: '✓ Reivindicado',
  footer: 'Os itens são removidos desta galeria assim que forem devolvidos ao seu proprietário.',
  galleryNotFound: 'Galeria não encontrada',
  checkLink: 'Verifique o link e tente novamente.',
  claimTitle: 'Reivindicar este item',
  claimSubtitle: (d) => `"${d}" — insira as iniciais do seu filho/a e o nome do professor/a. A equipe entregará na sala de aula.`,
  initialsLabel: 'Iniciais da criança',
  initialsPlaceholder: 'ex: A.M.',
  initialsHint: 'Apenas iniciais do primeiro e último nome — não é necessário o nome completo.',
  teacherLabel: 'Nome do professor/a',
  teacherPlaceholder: 'ex: Prof. Silva',
  cancel: 'Cancelar',
  submit: 'Enviar reivindicação',
  errorInitials: 'Por favor, insira as iniciais do seu filho/a.',
  errorTeacher: 'Por favor, insira o nome do professor/a.',
  errorGeneric: 'Algo deu errado.',
  successTitle: 'Reivindicação registrada!',
  successBody: 'A equipe entregará o item na sala de aula. Fique atento/a!',
};

// ─── Amharic ──────────────────────────────────────────────────────────────────
const am: Translations = {
  langName: 'አማርኛ',
  heroSub: 'ያወቁት ነገር አለ? "ይህንን እቃ ጠይቅ" የሚለውን ይንኩና የልጅዎን ስም መነሻ ፊደላት እና የአስተማሪው ስም ያስገቡ — ወደ ክፍላቸው እንመልሰዋለን።',
  itemsWaiting: (n) => `${n} እቃ${n !== 1 ? 'ዎች' : ''} ለባለቤቱ ለመመለስ እየተጠበቀ ነው`,
  filterAll: (n) => `ሁሉም (${n})`,
  filterUnclaimed: (n) => `ያልተጠየቀ (${n})`,
  filterClaimed: (n) => `የተጠየቀ (${n})`,
  noItems: (_f) => 'አሁን እቃዎች የሉም!',
  claimBtn: 'ይህንን እቃ ጠይቅ',
  claimedBadge: '✓ ተጠይቋል',
  footer: 'እቃዎቹ ለባለቤታቸው ከተመለሱ በኋላ ከዚህ ጋለሪ ይወገዳሉ።',
  galleryNotFound: 'ጋለሪ አልተገኘም',
  checkLink: 'አገናኙን ያረጋግጡ እና እንደገና ይሞክሩ።',
  claimTitle: 'ይህንን እቃ ጠይቅ',
  claimSubtitle: (d) => `"${d}" — የልጅዎን ስም መነሻ ፊደላት እና የአስተማሪውን ስም ያስገቡ። ሠራተኞቹ ወደ ክፍላቸው ያደርሱታል።`,
  initialsLabel: 'የልጅዎ ስም መነሻ ፊደላት',
  initialsPlaceholder: 'ለምሳ፡ አ.መ.',
  initialsHint: 'የመጀመሪያ እና የአያት ስም መነሻ ፊደሎች ብቻ — ሙሉ ስም አያስፈልግም።',
  teacherLabel: 'የአስተማሪ ስም',
  teacherPlaceholder: 'ለምሳ፡ አቶ ተሰፋ',
  cancel: 'ሰርዝ',
  submit: 'ጥያቄ አስገባ',
  errorInitials: 'እባክዎ የልጅዎን ስም መነሻ ፊደላት ያስገቡ።',
  errorTeacher: 'እባክዎ የአስተማሪውን ስም ያስገቡ።',
  errorGeneric: 'የሆነ ነገር ስህተት ሄዷል።',
  successTitle: 'ጥያቄ ተመዝግቧል!',
  successBody: 'ሠራተኞቹ እቃውን ወደ ክፍሉ ያደርሱታል። ይጠብቁ!',
};

// ─── Ukrainian ────────────────────────────────────────────────────────────────
const uk: Translations = {
  langName: 'Українська',
  heroSub: "Впізнали щось? Натисніть «Заявити про цей предмет» та введіть ініціали вашої дитини та ім'я вчителя — ми доставимо його до їхнього класу.",
  itemsWaiting: (n) => {
    const last = n % 10, tens = n % 100;
    const s = (tens >= 11 && tens <= 14) ? 'ів' : last === 1 ? '' : (last >= 2 && last <= 4) ? 'и' : 'ів';
    return `${n} предмет${s} очікує на власника`;
  },
  filterAll: (n) => `Усі (${n})`,
  filterUnclaimed: (n) => `Незаявлені (${n})`,
  filterClaimed: (n) => `Заявлені (${n})`,
  noItems: (_f) => 'Зараз немає предметів!',
  claimBtn: 'Заявити про цей предмет',
  claimedBadge: '✓ Заявлено',
  footer: 'Предмети видаляються з цієї галереї після повернення власнику.',
  galleryNotFound: 'Галерею не знайдено',
  checkLink: 'Перевірте посилання та спробуйте ще раз.',
  claimTitle: 'Заявити про цей предмет',
  claimSubtitle: (d) => `"${d}" — введіть ініціали вашої дитини та ім'я вчителя. Персонал доставить до їхнього класу.`,
  initialsLabel: 'Ініціали дитини',
  initialsPlaceholder: 'напр. А.М.',
  initialsHint: "Лише перша та остання ініціали — повне ім'я не потрібне.",
  teacherLabel: "Ім'я вчителя",
  teacherPlaceholder: 'напр. Пані Коваленко',
  cancel: 'Скасувати',
  submit: 'Подати заявку',
  errorInitials: 'Будь ласка, введіть ініціали вашої дитини.',
  errorTeacher: "Будь ласка, введіть ім'я вчителя.",
  errorGeneric: 'Щось пішло не так.',
  successTitle: 'Заявку зареєстровано!',
  successBody: 'Персонал доставить предмет до класу. Очікуйте!',
};

// ─── Romanian ─────────────────────────────────────────────────────────────────
const ro: Translations = {
  langName: 'Română',
  heroSub: 'Recunoașteți ceva? Apăsați Revendicați acest articol și introduceți inițialele copilului dvs. și numele profesorului — îl vom trimite la clasa lor.',
  itemsWaiting: (n) => `${n} articol${n !== 1 ? 'e' : ''} în așteptare de revendicare`,
  filterAll: (n) => `Toate (${n})`,
  filterUnclaimed: (n) => `Nerevendicate (${n})`,
  filterClaimed: (n) => `Revendicate (${n})`,
  noItems: (_f) => 'Nu există articole acum!',
  claimBtn: 'Revendicați acest articol',
  claimedBadge: '✓ Revendicat',
  footer: 'Articolele sunt eliminate din această galerie după ce au fost returnate proprietarului.',
  galleryNotFound: 'Galerie negăsită',
  checkLink: 'Verificați linkul și încercați din nou.',
  claimTitle: 'Revendicați acest articol',
  claimSubtitle: (d) => `"${d}" — introduceți inițialele copilului dvs. și numele profesorului. Personalul îl va livra la clasa lor.`,
  initialsLabel: 'Inițialele copilului',
  initialsPlaceholder: 'ex. A.M.',
  initialsHint: 'Doar inițialele de început și de final — nu este nevoie de numele complet.',
  teacherLabel: 'Numele profesorului',
  teacherPlaceholder: 'ex. Dna. Ionescu',
  cancel: 'Anulați',
  submit: 'Trimiteți cererea',
  errorInitials: 'Vă rugăm să introduceți inițialele copilului dvs.',
  errorTeacher: 'Vă rugăm să introduceți numele profesorului.',
  errorGeneric: 'Ceva a mers greșit.',
  successTitle: 'Cerere înregistrată!',
  successBody: 'Personalul va livra articolul la clasă. Fiți atenți!',
};

// ─── Mandarin Chinese ─────────────────────────────────────────────────────────
const zh: Translations = {
  langName: '中文',
  heroSub: '认出了什么？点击"认领此物品"，输入您孩子的姓名缩写和老师的名字——我们会将物品送回他们的教室。',
  itemsWaiting: (n) => `${n} 件物品等待认领`,
  filterAll: (n) => `全部 (${n})`,
  filterUnclaimed: (n) => `未认领 (${n})`,
  filterClaimed: (n) => `已认领 (${n})`,
  noItems: (_f) => '目前没有物品！',
  claimBtn: '认领此物品',
  claimedBadge: '✓ 已认领',
  footer: '物品归还给失主后将从此展示页面删除。',
  galleryNotFound: '找不到展示页面',
  checkLink: '请检查链接后重试。',
  claimTitle: '认领此物品',
  claimSubtitle: (d) => `"${d}" — 请输入您孩子的姓名缩写和老师的名字。工作人员将把物品送到他们的教室。`,
  initialsLabel: '孩子的姓名缩写',
  initialsPlaceholder: '例如 A.M.',
  initialsHint: '仅需名字和姓氏的首字母——不需要填写全名。',
  teacherLabel: '老师姓名',
  teacherPlaceholder: '例如 王老师',
  cancel: '取消',
  submit: '提交认领',
  errorInitials: '请输入您孩子的姓名缩写。',
  errorTeacher: '请输入老师的名字。',
  errorGeneric: '出了点问题。',
  successTitle: '认领已记录！',
  successBody: '工作人员将把物品送到教室。请留意！',
};

// ─── French ───────────────────────────────────────────────────────────────────
const fr: Translations = {
  langName: 'Français',
  heroSub: "Vous reconnaissez quelque chose ? Appuyez sur Réclamer cet objet et entrez les initiales de votre enfant et le nom de l'enseignant(e) — nous le ferons parvenir à leur salle de classe.",
  itemsWaiting: (n) => `${n} objet${n !== 1 ? 's' : ''} en attente de réclamation`,
  filterAll: (n) => `Tous (${n})`,
  filterUnclaimed: (n) => `Non réclamés (${n})`,
  filterClaimed: (n) => `Réclamés (${n})`,
  noItems: (_f) => "Aucun objet pour l'instant !",
  claimBtn: 'Réclamer cet objet',
  claimedBadge: '✓ Réclamé',
  footer: "Les objets sont retirés de cette galerie une fois restitués à leur propriétaire.",
  galleryNotFound: 'Galerie introuvable',
  checkLink: 'Vérifiez le lien et réessayez.',
  claimTitle: 'Réclamer cet objet',
  claimSubtitle: (d) => `"${d}" — entrez les initiales de votre enfant et le nom de l'enseignant(e). Le personnel le livrera à leur salle de classe.`,
  initialsLabel: "Initiales de l'enfant",
  initialsPlaceholder: 'ex. A.M.',
  initialsHint: "Premières et dernières initiales uniquement — pas de nom complet nécessaire.",
  teacherLabel: "Nom de l'enseignant(e)",
  teacherPlaceholder: 'ex. Mme Dupont',
  cancel: 'Annuler',
  submit: 'Soumettre la réclamation',
  errorInitials: "Veuillez entrer les initiales de votre enfant.",
  errorTeacher: "Veuillez entrer le nom de l'enseignant(e).",
  errorGeneric: 'Une erreur s\'est produite.',
  successTitle: 'Réclamation enregistrée !',
  successBody: 'Le personnel livrera l\'objet en salle de classe. Soyez attentif/attentive !',
};

// ─── Korean ───────────────────────────────────────────────────────────────────
const ko: Translations = {
  langName: '한국어',
  heroSub: "무언가 알아보셨나요? '이 물건 찾기'를 눌러 자녀의 이름 이니셜과 선생님 이름을 입력하세요 — 담임 교실로 전달해 드리겠습니다.",
  itemsWaiting: (n) => `찾아갈 물건 ${n}개`,
  filterAll: (n) => `전체 (${n})`,
  filterUnclaimed: (n) => `미수령 (${n})`,
  filterClaimed: (n) => `수령 완료 (${n})`,
  noItems: (_f) => '현재 물건이 없습니다!',
  claimBtn: '이 물건 찾기',
  claimedBadge: '✓ 수령 완료',
  footer: '물건이 주인에게 반환되면 이 갤러리에서 삭제됩니다.',
  galleryNotFound: '갤러리를 찾을 수 없습니다',
  checkLink: '링크를 확인하고 다시 시도하세요.',
  claimTitle: '이 물건 찾기',
  claimSubtitle: (d) => `"${d}" — 자녀의 이름 이니셜과 선생님 이름을 입력하세요. 교직원이 담임 교실로 전달해 드립니다.`,
  initialsLabel: '자녀 이름 이니셜',
  initialsPlaceholder: '예: A.M.',
  initialsHint: '이름 첫 글자와 성 첫 글자만 입력 — 전체 이름 불필요.',
  teacherLabel: '선생님 이름',
  teacherPlaceholder: '예: 김선생님',
  cancel: '취소',
  submit: '찾기 신청',
  errorInitials: '자녀의 이름 이니셜을 입력해 주세요.',
  errorTeacher: '선생님 이름을 입력해 주세요.',
  errorGeneric: '오류가 발생했습니다.',
  successTitle: '신청이 접수되었습니다!',
  successBody: '교직원이 물건을 담임 교실로 전달할 예정입니다. 기다려 주세요!',
};

// ─── Vietnamese ───────────────────────────────────────────────────────────────
const vi: Translations = {
  langName: 'Tiếng Việt',
  heroSub: 'Bạn nhận ra đồ vật nào không? Nhấp vào Nhận lại đồ vật này và nhập chữ viết tắt tên con bạn và tên giáo viên — chúng tôi sẽ gửi về phòng học của các em.',
  itemsWaiting: (n) => `${n} đồ vật đang chờ nhận lại`,
  filterAll: (n) => `Tất cả (${n})`,
  filterUnclaimed: (n) => `Chưa nhận (${n})`,
  filterClaimed: (n) => `Đã nhận (${n})`,
  noItems: (_f) => 'Không có đồ vật nào ngay lúc này!',
  claimBtn: 'Nhận lại đồ vật này',
  claimedBadge: '✓ Đã nhận',
  footer: 'Các đồ vật sẽ được xóa khỏi thư viện này sau khi được trả lại cho chủ nhân.',
  galleryNotFound: 'Không tìm thấy thư viện',
  checkLink: 'Kiểm tra đường dẫn và thử lại.',
  claimTitle: 'Nhận lại đồ vật này',
  claimSubtitle: (d) => `"${d}" — nhập chữ viết tắt tên con bạn và tên giáo viên. Nhân viên sẽ chuyển đến phòng học của các em.`,
  initialsLabel: 'Chữ viết tắt tên con',
  initialsPlaceholder: 'vd: A.M.',
  initialsHint: 'Chỉ cần chữ cái đầu của tên và họ — không cần tên đầy đủ.',
  teacherLabel: 'Tên giáo viên',
  teacherPlaceholder: 'vd: Cô Nguyễn',
  cancel: 'Hủy',
  submit: 'Gửi yêu cầu',
  errorInitials: 'Vui lòng nhập chữ viết tắt tên con bạn.',
  errorTeacher: 'Vui lòng nhập tên giáo viên.',
  errorGeneric: 'Có lỗi xảy ra.',
  successTitle: 'Đã ghi nhận yêu cầu!',
  successBody: 'Nhân viên sẽ chuyển đồ vật đến phòng học. Hãy chú ý!',
};

// ─── Registry ─────────────────────────────────────────────────────────────────
export const LOCALES: Record<Locale, Translations> = { en, es, pt, am, uk, ro, zh, fr, ko, vi };

export const LOCALE_ORDER: Locale[] = ['en', 'es', 'pt', 'zh', 'fr', 'ko', 'vi', 'am', 'uk', 'ro'];

/** Detect preferred locale from browser, falling back to 'en'. */
export function detectLocale(): Locale {
  const prefs = navigator.languages ?? [navigator.language];
  for (const lang of prefs) {
    const code = lang.split('-')[0].toLowerCase() as Locale;
    if (code in LOCALES) return code;
  }
  return 'en';
}
