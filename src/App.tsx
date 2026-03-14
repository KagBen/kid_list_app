import React, { useEffect, useMemo, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, set } from 'firebase/database';
import { motion } from 'framer-motion';
import {
  Baby,
  Calculator,
  CalendarDays,
  Copy,
  Gift,
  Heart,
  Link as LinkIcon,
  ListChecks,
  Plane,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react';
import './app-responsive.css';

const REGISTRY_PATH = 'registries/main';

const firebaseConfig = {
  apiKey: 'AIzaSyCFtQH7xeBU3-w0YGkVSx8rRk1Ci3gMgFw',
  authDomain: 'baby-registry-7f2a8.firebaseapp.com',
  databaseURL:
    'https://baby-registry-7f2a8-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'baby-registry-7f2a8',
  storageBucket: 'baby-registry-7f2a8.firebasestorage.app',
  messagingSenderId: '48159044656',
  appId: '1:48159044656:web:323557406b2a785981a9f5',
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const categoryOrder = [
  'החדר שלי',
  'יוצאים לטייל',
  'שמרו עלי ברכב',
  'הביגוד הראשוני שלי',
  'האמבטיה שלי',
  'איך לטפל בי',
  'הפסקת אוכל',
  'לאמא שלי',
  'משחק והתפתחות',
] as const;

type Category = (typeof categoryOrder)[number];
type TabKey = 'list' | 'bundles' | 'summary';

type OptionItem = {
  id: string;
  name: string;
  price: number;
  link: string;
};

type RegistryItem = {
  id: string;
  category: Category;
  name: string;
  needed: boolean;
  quantity: number;
  note: string;
  options: OptionItem[];
};

type BundleItem = {
  id: string;
  name: string;
  price: number;
  link: string;
  note: string;
};

type RegistryData = {
  meta: {
    title: string;
    subtitle: string;
  };
  items: RegistryItem[];
  bundles: BundleItem[];
};

const baseCategories: Record<Category, string[]> = {
  'החדר שלי': [
    'מיטת תינוק',
    'מזרן מיטה',
    'שידת החתלה',
    'משטח החתלה לשידה',
    'עריסה',
    'סדינים לעריסה',
    'סט לעריסה',
    'מגן ראש',
    'סדינים למיטה',
    'סדיניות',
    'שעוונית',
    'מנורת לילה',
    'מצלמה לחדר',
    'פח חיתולים',
    'מוניטור נשימה',
    'מדחום לחדר',
  ],
  'יוצאים לטייל': [
    'עגלה',
    'תיק החתלה',
    'שמיכה לעגלה',
    'קופסה למוצצים',
    'צלון לעגלה',
    'שאקל לעגלה',
    'מנשא',
  ],
  'שמרו עלי ברכב': [
    'מושב בטיחות לרכב',
    'בסיס לסל קל',
    'מגן ראש לכסא בטיחות',
    'כיסוי מגן למושב בטיחות',
    'מראה לרכב',
    'שמרו עלי ברכב (שלט)',
  ],
  'הביגוד הראשוני שלי': [
    'בגדי גוף מעטפת',
    'רגליות לתינוק',
    'חליפה ראשונה',
    'אוברולים ראשונים',
    'כובע',
    'זוג כפפות',
    'גרביים',
    'סט בגדים ליציאה מבית החולים',
  ],
  'האמבטיה שלי': [
    'אמבטיה כולל מעמד',
    'מושב לאמבטיה (דפני)',
    'אל סבון עדין לתינוק',
    'שמפו ללא דמע לתינוקות',
    'שמן אמבט לתינוק',
    'מדחום למי האמבטיה',
    'מגבות רחצה',
    'פוף צוף',
    'תחליב גוף לתינוק',
    'ספוג רחצה',
    'שמן לעיסוי תינוקות',
  ],
  'איך לטפל בי': [
    'חיתולים חד פעמיים',
    'משחת החתלה',
    'מגבונים לחים',
    'אלכוהול 70%',
    'משטח החתלה חד פעמי',
    'חיתולי טטרא',
    'מספריים בטיחותיים לציפורניים',
    'מקלוני אוזניים בטיחותיים',
    'מדחום דיגיטלי גמיש',
    'מברשת ומסרק',
    'מחמם מגבונים',
    "אבקת / ג'ל כביסה",
    'מרכך כביסה',
  ],
  'הפסקת אוכל': [
    'בקבוקים ממותגים שונים',
    'מברשת לניקוי בקבוקים ופטמות',
    'מתקן לייבוש בקבוקים',
    'מחלק מנות',
    'חיתולי טטרא נוספים',
    'חיתולי פלנל',
    'סטריליזטור',
    'מוצצים ממותגים שונים',
    'מחמם בקבוקים',
    'בר להכנת תמ"ל Baby Brezza',
    'תרמוס למים רתוחים',
  ],
  'לאמא שלי': [
    'חזיות הריון והנקה',
    'חבילות פדים להנקה',
    'משחה לפטמות',
    'תחתונים חד פעמיים',
    'כרית הנקה',
    'סינר הנקה',
    'משאבת הנקה',
    'שקיות אחסון לחלב',
    'שמן עיסוי לאיזור הבטן',
  ],
  'משחק והתפתחות': [
    'ספר התפתחותי שחור לבן',
    'מובייל עם מוסיקה מרגיעה',
    'משטח פעילות',
    'טרמפולינה',
    'נדנדה',
  ],
};

const quantityDefaults: Record<string, number> = {
  'בגדי גוף מעטפת': 6,
  'רגליות לתינוק': 6,
  'אוברולים ראשונים': 3,
  'מגבות רחצה': 2,
  'חזיות הריון והנקה': 2,
  'חבילות פדים להנקה': 2,
  'בקבוקים ממותגים שונים': 2,
  'מוצצים ממותגים שונים': 2,
  'חיתולי פלנל': 3,
  'חיתולי טטרא': 6,
  'חיתולי טטרא נוספים': 6,
};

function makeId(...parts: string[]) {
  return parts.join('-').replace(/\s+/g, '-');
}

function createDefaultItems(): RegistryItem[] {
  return categoryOrder.flatMap((category) =>
    baseCategories[category].map((name) => ({
      id: makeId(category, name),
      category,
      name,
      needed: true,
      quantity: quantityDefaults[name] || 1,
      note: '',
      options: [
        {
          id: makeId(category, name, '1'),
          name: 'אופציה 1',
          price: 0,
          link: '',
        },
      ],
    }))
  );
}

const defaultData: RegistryData = {
  meta: {
    title: 'חבילת לידה - הרשימה המלאה',
    subtitle: 'כל מה שצריך כדי להיערך למסע מלא באהבה',
  },
  items: createDefaultItems(),
  bundles: [
    {
      id: 'bundle-1',
      name: 'סט לידה בסיסי',
      price: 0,
      link: '',
      note: 'אפשר להוסיף כאן הצעת סט שלמה מחנות',
    },
    {
      id: 'bundle-2',
      name: 'סט פרימיום מלא',
      price: 0,
      link: '',
      note: 'אפשר להשוות מול רכישה לפי פריטים',
    },
  ],
};

function isRegistryData(value: unknown): value is RegistryData {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Partial<RegistryData>;
  return (
    Array.isArray(maybe.items) && Array.isArray(maybe.bundles) && !!maybe.meta
  );
}

function numberOrZero(value: unknown) {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatILS(value: unknown) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(numberOrZero(value));
}

function cheapestOption(options: OptionItem[]) {
  if (!options.length) return null;
  return [...options].sort(
    (a, b) => numberOrZero(a.price) - numberOrZero(b.price)
  )[0];
}

function getItemEstimatedTotal(item: RegistryItem) {
  const cheapest = cheapestOption(item.options);
  return numberOrZero(cheapest?.price) * numberOrZero(item.quantity || 1);
}

function formatDateDisplay(value: Date | string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(date: Date | string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffInDays(from: Date | string, to: Date | string) {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function calculatePregnancyFromLmp(lmpValue: string) {
  if (!lmpValue) return null;
  const lmp = new Date(lmpValue);
  if (Number.isNaN(lmp.getTime())) return null;
  const today = new Date();
  const dueDate = addDays(lmp, 280);
  const passedDays = Math.max(0, diffInDays(lmp, today));
  const weeks = Math.floor(passedDays / 7);
  const days = passedDays % 7;
  const daysLeft = diffInDays(today, dueDate);
  const shoppingStartDate = addDays(dueDate, -60);
  return { lmp, dueDate, weeks, days, daysLeft, shoppingStartDate };
}

function calculatePregnancyFromDueDate(dueValue: string) {
  if (!dueValue) return null;
  const dueDate = new Date(dueValue);
  if (Number.isNaN(dueDate.getTime())) return null;
  const today = new Date();
  const lmp = addDays(dueDate, -280);
  const passedDays = Math.max(0, diffInDays(lmp, today));
  const weeks = Math.floor(passedDays / 7);
  const days = passedDays % 7;
  const daysLeft = diffInDays(today, dueDate);
  const shoppingStartDate = addDays(dueDate, -60);
  return { lmp, dueDate, weeks, days, daysLeft, shoppingStartDate };
}

function getPregnancyRecommendation(
  calc:
    | ReturnType<typeof calculatePregnancyFromLmp>
    | ReturnType<typeof calculatePregnancyFromDueDate>
) {
  if (!calc) {
    return {
      tone: 'neutral',
      title: 'מחשבון לידה',
      message:
        'מזינים תאריך וסת אחרון או תאריך לידה משוער כדי לקבל גיל הריון, תאריך לידה משוער והמלצה מתי להתחיל קניות.',
    };
  }
  if (calc.daysLeft <= 0) {
    return {
      tone: 'urgent',
      title: 'כבר הגעתם לתאריך הלידה המשוער',
      message:
        'זה שלב של השלמות אחרונות בלבד. הרשימה צריכה להיות כמעט סגורה ומוכנה.',
    };
  }
  if (calc.daysLeft <= 60) {
    return {
      tone: 'urgent',
      title: 'כבר חייבים להתחיל קניות',
      message:
        'נשארו פחות מחודשיים ללידה. זה הזמן לסגור את הפריטים החשובים ולהתמקד בהיערכות ולא בטיולים מיותרים.',
    };
  }
  if (calc.daysLeft <= 90) {
    return {
      tone: 'warm',
      title: 'זה הזמן להתחיל להיסגר על הרשימה',
      message:
        'כדאי כבר עכשיו להשוות מחירים, לסמן מה חובה ולהתחיל לבנות את הסל הסופי.',
    };
  }
  return {
    tone: 'soft',
    title: 'יש עוד זמן, אבל כדאי להתחיל לתכנן',
    message:
      'אפשר לבנות תקציב רגוע, להוסיף אופציות ולמנוע לחץ בחודשים האחרונים.',
  };
}

function toneColor(tone: string) {
  if (tone === 'urgent') return { background: '#ffe4e6', color: '#9f1239' };
  if (tone === 'warm') return { background: '#fef3c7', color: '#92400e' };
  if (tone === 'soft') return { background: '#e0f2fe', color: '#075985' };
  return { background: '#f1f5f9', color: '#334155' };
}

const sanityChecks = [
  numberOrZero('1,250') === 1250,
  formatDateDisplay('2026-03-14') !== '-',
  createDefaultItems().length > 0,
  cheapestOption([
    { id: '1', name: 'a', price: 100, link: '' },
    { id: '2', name: 'b', price: 50, link: '' },
  ])?.price === 50,
].every(Boolean);

export default function App() {
  const [data, setData] = useState<RegistryData>(defaultData);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>(
    categoryOrder[0]
  );
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [search, setSearch] = useState('');
  const [lmpDate, setLmpDate] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const isInitialSyncDone = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    const registryRef = ref(db, REGISTRY_PATH);
    const unsubscribe = onValue(registryRef, (snapshot) => {
      const value = snapshot.val();
      if (isRegistryData(value)) {
        setData(value);
      } else {
        void set(registryRef, defaultData);
      }
      isInitialSyncDone.current = true;
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialSyncDone.current) return;
    const registryRef = ref(db, REGISTRY_PATH);
    void set(registryRef, data);
  }, [data]);

  const pregnancyCalc = useMemo(() => {
    if (lmpDate) return calculatePregnancyFromLmp(lmpDate);
    if (dueDateInput) return calculatePregnancyFromDueDate(dueDateInput);
    return null;
  }, [lmpDate, dueDateInput]);

  const pregnancyRecommendation = useMemo(
    () => getPregnancyRecommendation(pregnancyCalc),
    [pregnancyCalc]
  );

  const filteredItems = useMemo(() => {
    return data.items.filter((item) => {
      const matchesCategory = item.category === activeCategory;
      const q = search.trim();
      const optionNames = item.options.map((o) => o.name).join(' ');
      const haystack = `${item.name} ${item.note} ${optionNames}`;
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [data.items, activeCategory, search]);

  const groupedCounts = useMemo(() => {
    return Object.fromEntries(
      categoryOrder.map((category) => [
        category,
        data.items.filter((item) => item.category === category && item.needed)
          .length,
      ])
    ) as Record<Category, number>;
  }, [data.items]);

  const totals = useMemo(() => {
    const activeItems = data.items.filter((item) => item.needed);
    const itemBreakdown = activeItems.map((item) => ({
      ...item,
      cheapest: cheapestOption(item.options),
      estimatedTotal: getItemEstimatedTotal(item),
    }));
    const itemsTotal = itemBreakdown.reduce(
      (sum, item) => sum + item.estimatedTotal,
      0
    );
    const bundlesTotal = data.bundles.reduce(
      (sum, bundle) => sum + numberOrZero(bundle.price),
      0
    );
    return {
      activeItems,
      itemBreakdown,
      itemsTotal,
      bundlesTotal,
      overallTotal: itemsTotal + bundlesTotal,
    };
  }, [data]);

  const updateItem = (itemId: string, patch: Partial<RegistryItem>) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      ),
    }));
  };

  const addOption = (itemId: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id !== itemId
          ? item
          : {
              ...item,
              options: [
                ...item.options,
                {
                  id: `${item.id}-${item.options.length + 1}-${Date.now()}`,
                  name: `אופציה ${item.options.length + 1}`,
                  price: 0,
                  link: '',
                },
              ],
            }
      ),
    }));
  };

  const updateOption = (
    itemId: string,
    optionId: string,
    patch: Partial<OptionItem>
  ) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id !== itemId
          ? item
          : {
              ...item,
              options: item.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option
              ),
            }
      ),
    }));
  };

  const removeOption = (itemId: string, optionId: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const nextOptions = item.options.filter(
          (option) => option.id !== optionId
        );
        return {
          ...item,
          options: nextOptions.length
            ? nextOptions
            : [
                {
                  id: `${item.id}-reset`,
                  name: 'אופציה 1',
                  price: 0,
                  link: '',
                },
              ],
        };
      }),
    }));
  };

  const updateBundle = (bundleId: string, patch: Partial<BundleItem>) => {
    setData((prev) => ({
      ...prev,
      bundles: prev.bundles.map((bundle) =>
        bundle.id === bundleId ? { ...bundle, ...patch } : bundle
      ),
    }));
  };

  const addBundle = () => {
    setData((prev) => ({
      ...prev,
      bundles: [
        ...prev.bundles,
        {
          id: `bundle-${Date.now()}`,
          name: 'סט חדש',
          price: 0,
          link: '',
          note: '',
        },
      ],
    }));
  };

  const removeBundle = (bundleId: string) => {
    setData((prev) => ({
      ...prev,
      bundles: prev.bundles.filter((bundle) => bundle.id !== bundleId),
    }));
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const markAllInCategory = (value: boolean) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.category === activeCategory ? { ...item, needed: value } : item
      ),
    }));
  };

  const recommendationStyle = toneColor(pregnancyRecommendation.tone);

  return (
    <div className="app-page">
      <div className="app-shell">
        {!sanityChecks && (
          <div
            className="app-card"
            style={{ background: '#fee2e2', color: '#991b1b' }}
          >
            Internal sanity check failed.
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="app-card hero-card">
            <div className="hero-grid">
              <div className="hero-left">
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    color: '#e11d48',
                    marginBottom: 8,
                  }}
                >
                  <Sparkles size={18} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    מדריך קנייה נעים, שמח וקל לשיתוף
                  </span>
                </div>

                <div className="hero-title-row">
                  <Baby size={30} color="#ec4899" />
                  <span>{data.meta.title}</span>
                </div>

                <p style={{ marginTop: 10, color: '#475569' }}>
                  {data.meta.subtitle}
                </p>

                <div className="hero-badges">
                  <span className="badge-base">רשימה מלאה מראש</span>
                  <span className="badge-base">מוסיפים רק אופציות וכמויות</span>
                  <span className="badge-base">לינק שיתוף לכל אחד</span>
                </div>
              </div>

              <div className="hero-right">
                <div className="app-card" style={{ padding: 16 }}>
                  <div className="small-muted">מוצרים מסומנים</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 28,
                      fontWeight: 900,
                      color: '#1e293b',
                    }}
                  >
                    {totals.activeItems.length}
                  </div>
                </div>

                <div className="app-card" style={{ padding: 16 }}>
                  <div className="small-muted">עלות משוערת</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 28,
                      fontWeight: 900,
                      color: '#1e293b',
                    }}
                  >
                    {formatILS(totals.overallTotal)}
                  </div>
                </div>

                <button onClick={copyShare} className="button-base">
                  <span
                    style={{
                      display: 'inline-flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Share2 size={16} />
                    העתק קישור שיתוף
                  </span>
                </button>

                <div
                  className="app-card hero-url-box"
                  style={{ padding: 14, fontSize: 12, color: '#475569' }}
                  title={shareUrl}
                >
                  {shareUrl}
                </div>
              </div>
            </div>

            {copied && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: '#059669',
                  fontWeight: 700,
                }}
              >
                קישור השיתוף הועתק
              </p>
            )}
          </div>
        </motion.div>

        <div className="app-card">
          <div className="section-title">
            <CalendarDays color="#e11d48" />
            <span>מחשבון לידה</span>
          </div>

          <div className="pregnancy-inputs">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: '#64748b',
                  marginBottom: 6,
                }}
              >
                תאריך וסת אחרון
              </label>
              <input
                className="input-base"
                type="date"
                value={lmpDate}
                onChange={(e) => {
                  setLmpDate(e.target.value);
                  if (e.target.value) setDueDateInput('');
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: '#64748b',
                  marginBottom: 6,
                }}
              >
                תאריך לידה משוער
              </label>
              <input
                className="input-base"
                type="date"
                value={dueDateInput}
                onChange={(e) => {
                  setDueDateInput(e.target.value);
                  if (e.target.value) setLmpDate('');
                }}
              />
            </div>
          </div>

          <div className="pregnancy-stats">
            <div className="app-card" style={{ padding: 16 }}>
              <div className="small-muted">גיל הריון</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
                {pregnancyCalc
                  ? `${pregnancyCalc.weeks}+${pregnancyCalc.days}`
                  : '-'}
              </div>
            </div>

            <div className="app-card" style={{ padding: 16 }}>
              <div className="small-muted">לידה משוערת</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
                {pregnancyCalc ? formatDateDisplay(pregnancyCalc.dueDate) : '-'}
              </div>
            </div>

            <div className="app-card" style={{ padding: 16 }}>
              <div className="small-muted">להתחיל קניות עד</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900 }}>
                {pregnancyCalc
                  ? formatDateDisplay(pregnancyCalc.shoppingStartDate)
                  : '-'}
              </div>
            </div>
          </div>

          <div
            className="app-card"
            style={{
              ...recommendationStyle,
              marginTop: 16,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              {pregnancyRecommendation.title}
            </div>
            <div>{pregnancyRecommendation.message}</div>
          </div>

          <div className="app-card pregnancy-note">
            <Plane size={16} color="#e11d48" style={{ marginTop: 2 }} />
            <span>
              ההמלצה כאן היא להתחיל קניות לפחות חודשיים לפני הלידה, ובחלון הזה
              עדיף להתמקד בהיערכות ופחות בטיולים מיותרים.
            </span>
          </div>
        </div>

        <div className="tabs-row">
          {(
            [
              ['list', 'הרשימה החכמה'],
              ['bundles', 'סטים מלאים'],
              ['summary', 'סיכום'],
            ] as [TabKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={key === activeTab ? 'button-base' : 'button-light'}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'list' && (
          <div className="main-grid">
            <div className="app-card sidebar-card">
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 16,
                }}
              >
                <ListChecks color="#ec4899" />
                <span>קטגוריות</span>
              </div>

              <div className="category-list">
                {categoryOrder.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`button-light category-button ${
                      activeCategory === category ? 'active' : ''
                    }`}
                  >
                    <span>{category}</span>
                    <span className="category-count">
                      {groupedCounts[category] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="content-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="app-card">
                <div className="toolbar-top">
                  <div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: '#1e293b',
                      }}
                    >
                      {activeCategory}
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>
                      בחר מה צריך, הוסף אופציות עם שם, מחיר וקישור.
                    </div>
                  </div>

                  <div className="toolbar-actions">
                    <button
                      className="button-light"
                      onClick={() => markAllInCategory(true)}
                    >
                      סמן הכל
                    </button>
                    <button
                      className="button-light"
                      onClick={() => markAllInCategory(false)}
                    >
                      בטל הכל
                    </button>
                  </div>
                </div>

                <div className="toolbar-search">
                  <div className="input-icon-wrap">
                    <Search size={16} color="#94a3b8" className="icon-left" />
                    <input
                      className="input-base input-with-icon"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="חפש מוצר או שם אופציה"
                    />
                  </div>

                  <select
                    className="select-base"
                    value={activeCategory}
                    onChange={(e) =>
                      setActiveCategory(e.target.value as Category)
                    }
                  >
                    {categoryOrder.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredItems.map((item) => {
                const cheapest = cheapestOption(item.options);
                const estimatedTotal = getItemEstimatedTotal(item);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="app-card item-card">
                      <div className="item-top">
                        <div className="item-top-left">
                          <input
                            type="checkbox"
                            checked={item.needed}
                            onChange={(e) =>
                              updateItem(item.id, { needed: e.target.checked })
                            }
                          />

                          <div>
                            <div
                              style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: '#1e293b',
                              }}
                            >
                              {item.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              כמות מומלצת: {quantityDefaults[item.name] || 1}
                            </div>
                          </div>

                          {item.needed && cheapest && (
                            <span
                              className="badge-base"
                              style={{
                                background: '#d1fae5',
                                color: '#047857',
                              }}
                            >
                              הזול ביותר: {formatILS(cheapest.price)}
                            </span>
                          )}
                        </div>

                        <div className="item-top-right">
                          <input
                            className="input-base quantity-input"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, {
                                quantity: Math.max(
                                  1,
                                  numberOrZero(e.target.value) || 1
                                ),
                              })
                            }
                          />

                          <span
                            className="badge-base"
                            style={{
                              background: '#ffe4e6',
                              color: '#be123c',
                            }}
                          >
                            {formatILS(estimatedTotal)}
                          </span>
                        </div>
                      </div>

                      <div className="item-note">
                        <input
                          className="input-base"
                          value={item.note}
                          onChange={(e) =>
                            updateItem(item.id, { note: e.target.value })
                          }
                          placeholder="הערה אישית, מידה, צבע, העדפה או מותג"
                        />
                      </div>

                      <div className="options-list">
                        {item.options.map((option, index) => (
                          <div key={option.id} className="option-row">
                            <input
                              className="input-base"
                              value={option.name}
                              onChange={(e) =>
                                updateOption(item.id, option.id, {
                                  name: e.target.value,
                                })
                              }
                              placeholder={`שם אופציה ${index + 1}`}
                            />

                            <input
                              className="input-base"
                              type="number"
                              value={option.price}
                              onChange={(e) =>
                                updateOption(item.id, option.id, {
                                  price: numberOrZero(e.target.value),
                                })
                              }
                              placeholder="מחיר"
                            />

                            <div className="input-icon-wrap">
                              <LinkIcon
                                size={16}
                                color="#94a3b8"
                                className="icon-left"
                              />
                              <input
                                className="input-base input-with-icon"
                                value={option.link}
                                onChange={(e) =>
                                  updateOption(item.id, option.id, {
                                    link: e.target.value,
                                  })
                                }
                                placeholder="קישור למוצר"
                              />
                            </div>

                            <button
                              className="button-light option-delete-btn"
                              onClick={() => removeOption(item.id, option.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="add-option-wrap">
                        <button
                          className="button-light"
                          onClick={() => addOption(item.id)}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <Plus size={16} />
                            הוסף אופציה
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="summary-card">
              <div className="app-card quick-summary-sticky">
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 16,
                  }}
                >
                  <Calculator color="#0ea5e9" />
                  <span>מחשבון מהיר</span>
                </div>

                <div className="quick-summary-boxes">
                  <div className="app-card quick-summary-row">
                    <span>פריטים מסומנים</span>
                    <strong>{totals.activeItems.length}</strong>
                  </div>

                  <div className="app-card quick-summary-row">
                    <span>סכום פריטים</span>
                    <strong>{formatILS(totals.itemsTotal)}</strong>
                  </div>

                  <div className="app-card quick-summary-row">
                    <span>סכום סטים</span>
                    <strong>{formatILS(totals.bundlesTotal)}</strong>
                  </div>

                  <div className="app-card quick-summary-row total">
                    <span>סה״כ כללי</span>
                    <strong>{formatILS(totals.overallTotal)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bundles' && (
          <div className="app-card">
            <div className="toolbar-top" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 28,
                  fontWeight: 900,
                }}
              >
                <Gift color="#ec4899" />
                <span>סטים מלאים להשוואה</span>
              </div>

              <button className="button-base" onClick={addBundle}>
                <span
                  style={{
                    display: 'inline-flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <Plus size={16} />
                  הוסף סט
                </span>
              </button>
            </div>

            <div className="bundles-list">
              {data.bundles.map((bundle) => (
                <div key={bundle.id} className="bundle-row">
                  <div className="bundle-col">
                    <input
                      className="input-base"
                      value={bundle.name}
                      onChange={(e) =>
                        updateBundle(bundle.id, { name: e.target.value })
                      }
                      placeholder="שם הסט"
                    />
                    <input
                      className="input-base"
                      value={bundle.note}
                      onChange={(e) =>
                        updateBundle(bundle.id, { note: e.target.value })
                      }
                      placeholder="מה כלול בסט"
                    />
                  </div>

                  <input
                    className="input-base"
                    type="number"
                    value={bundle.price}
                    onChange={(e) =>
                      updateBundle(bundle.id, {
                        price: numberOrZero(e.target.value),
                      })
                    }
                    placeholder="מחיר"
                  />

                  <input
                    className="input-base"
                    value={bundle.link}
                    onChange={(e) =>
                      updateBundle(bundle.id, { link: e.target.value })
                    }
                    placeholder="קישור לסט"
                  />

                  <button
                    className="button-light option-delete-btn"
                    onClick={() => removeBundle(bundle.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="summary-grid">
            <div className="app-card">
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 16,
                }}
              >
                <ShoppingBag color="#0ea5e9" />
                <span>סיכום מלא של הבחירות</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {categoryOrder.map((category) => {
                  const categoryItems = totals.itemBreakdown.filter(
                    (item) => item.category === category
                  );

                  if (!categoryItems.length) return null;

                  return (
                    <div key={category} className="summary-category-box">
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          marginBottom: 12,
                        }}
                      >
                        {category}
                      </div>

                      <div className="summary-items-list">
                        {categoryItems.map((item) => (
                          <div key={item.id} className="app-card summary-item-row">
                            <div>
                              <div style={{ fontWeight: 700 }}>{item.name}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>
                                {item.cheapest?.name || 'אין אופציה'} · כמות{' '}
                                {item.quantity}
                              </div>
                            </div>
                            <div style={{ fontWeight: 800 }}>
                              {formatILS(item.estimatedTotal)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div style={{ height: 1, background: '#e2e8f0' }} />

                <div>
                  <div
                    style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}
                  >
                    סטים מלאים
                  </div>

                  <div className="summary-bundles-list">
                    {data.bundles.map((bundle) => (
                      <div key={bundle.id} className="summary-bundle-row">
                        <div>
                          <div style={{ fontWeight: 700 }}>{bundle.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {bundle.note}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800 }}>
                          {formatILS(bundle.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="summary-side">
              <div className="app-card">
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 14,
                  }}
                >
                  <Share2 color="#ec4899" />
                  <span>שיתוף אונליין</span>
                </div>

                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  זה מיועד לרשימה משותפת אחת. אתה ואשתך יכולים לפתוח את אותו
                  הלינק, וכל שינוי יתעדכן אצל שניכם בזמן אמת.
                </p>

                <div
                  className="app-card hero-url-box"
                  style={{
                    padding: 14,
                    marginTop: 12,
                    fontSize: 12,
                    color: '#475569',
                  }}
                  title={shareUrl}
                >
                  {shareUrl}
                </div>

                <button className="button-base share-box" onClick={copyShare}>
                  <span
                    style={{
                      display: 'inline-flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Copy size={16} />
                    העתק לינק לשיתוף
                  </span>
                </button>
              </div>

              <div
                className="app-card"
                style={{
                  background: 'linear-gradient(135deg,#fdf2f8 0%,#f0f9ff 100%)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 14,
                  }}
                >
                  <Heart color="#e11d48" />
                  <span>איך זה עובד</span>
                </div>

                {[
                  '1. בוחרים קטגוריה מהתפריט הצדדי או מהדרופדאון.',
                  '2. מסמנים מה באמת צריך.',
                  '3. מוסיפים אופציות עם שם, מחיר וקישור לכל מוצר.',
                  '4. האפליקציה מחשבת אוטומטית לפי האופציה הזולה ביותר.',
                  '5. אתה ואשתך עובדים על אותה רשימה בדיוק, וכל שינוי מתעדכן בזמן אמת.',
                ].map((line) => (
                  <div key={line} className="how-it-works-line">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}