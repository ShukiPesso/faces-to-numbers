/**
 * FROZEN KEY SET — copied verbatim to `src/i18n/he.ts` by task P0-02.
 * Keys are frozen. Only task D-07 (microcopy) may change VALUES.
 * Rules (Conventions §1.8): calm plain Hebrew, plural address, no "!", no emoji,
 * nothing celebratory. Placeholders use {name} and are filled by t().
 */
export const he = {
  'app.name': 'פנים למספרים',
  'app.tagline': 'סיור עצמאי בעוטף עזה, בעקבות 7 באוקטובר',
  'app.skipToContent': 'לדלג לתוכן',
  'app.titleSuffix': ' · פנים למספרים',

  'nav.label': 'ניווט ראשי',
  'nav.home': 'בית',
  'nav.tour': 'המסלול',
  'nav.whereAmI': 'איפה אני',
  'nav.about': 'אודות',
  'nav.sources': 'מקורות',

  'home.start': 'להתחיל את הסיור',
  'home.resume': 'להמשיך מתחנה {n}',
  'home.resetProgress': 'להתחיל מחדש',
  'home.stationsCount': '{n} תחנות',
  'home.totalDuration': 'כ-{duration}',
  'home.messageTitle': 'על מה הסיור הזה',
  'home.safetyTitle': 'לפני שיוצאים לדרך',
  'home.howToTitle': 'איך משתמשים',

  'tour.title': 'המסלול',
  'tour.kind.stop': 'עצירה',
  'tour.kind.drive': 'נסיעה',
  'tour.stationOf': 'תחנה {n} מתוך {total}',
  'tour.visited': 'ביקרתם כאן',
  'tour.mapTitle': 'מפת המסלול',
  'tour.mapAlt': 'מפת המסלול על רקע היישובים והכבישים הראשיים באזור, עם התחנות ממוספרות. רשימת התחנות המלאה מופיעה מתחת למפה.',
  'map.gaza': 'רצועת עזה',
  'map.sea': 'הים התיכון',
  'map.north': 'צפון',
  'map.scale5km': '5 ק״מ',
  'map.legendStops': 'נסיעה בין עצירות',
  'map.legendDrive': 'קטע נסיעה בלי עצירה',
  'map.unverifiedNote': 'מיקומי התחנות על המפה משוערים ועדיין לא אומתו בשטח.',
  'map.attributionPrefix': 'נתוני המפה:',

  'station.background': 'מה קרה כאן',
  'station.talkingPoints': 'כדאי לשים לב',
  'station.people': 'האנשים של המקום הזה',
  'station.companions': 'סיפורים נלווים',
  'station.access': 'גישה ושעות',
  'station.lastVerified': 'המידע נבדק לאחרונה ב-{date}',
  'station.navigate': 'ניווט לתחנה',
  'station.navigateWaze': 'לנווט ב-Waze',
  'station.navigateGoogle': 'לנווט ב-Google Maps',
  'station.navigateApple': 'לנווט ב-Apple Maps',
  'station.locationUnverified':
    'המיקום בבדיקה, ולכן אין כאן קישורי ניווט. אפשר להיעזר בתיאור התחנה.',
  'station.markVisited': 'לסמן שביקרתם כאן',
  'station.unmarkVisited': 'לבטל את הסימון',
  'station.next': 'לתחנה הבאה',
  'station.prev': 'לתחנה הקודמת',
  'station.end': 'סוף המסלול',
  'station.sources': 'מקורות לתחנה',

  'drive.warning': 'מי שנוהג לא משתמש באפליקציה בזמן הנסיעה. מי שיושב לידו מקריא.',

  'person.toStory': 'לסיפור של {name}',
  'person.oct7': 'ב-7 באוקטובר',
  'person.personality.he': 'מי הוא היה',
  'person.personality.she': 'מי היא הייתה',
  'person.past': 'סיפור מהעבר',
  'person.after': 'מה קרה אחר כך',
  'person.quote': 'ציטוט',
  'person.sources': 'מקורות',
  'person.guideNote': 'הערה',
  'person.companion': 'סיפור נלווה',
  'person.backToStation': 'לחזור לתחנה: {title}',

  'depth.label': 'כמה זמן יש לכם',
  'depth.s30': '30 שניות',
  'depth.m2': '2 דקות',
  'depth.m5': '5 דקות',
  'depth.s30.hint': 'טקסט קצר להקראה בקול',

  'warning.title': 'לפני שממשיכים',
  'warning.body': 'הקטע הבא כולל תיאורים קשים. אפשר לקרוא אותו, ואפשר לדלג עליו.',
  'warning.show': 'להציג את הקטע',
  'warning.skip': 'לדלג על הקטע',
  'warning.skipped': 'הקטע לא מוצג. אפשר להציג אותו בכל רגע.',

  'silence.title': 'רגע של שקט',
  'silence.start': 'להתחיל {seconds} שניות של שקט',
  'silence.remaining': 'נותרו {seconds} שניות',
  'silence.ended': 'רגע השקט הסתיים. אפשר להמשיך כשתרצו.',
  'silence.stop': 'לסיים',

  'photo.pending': 'תמונה תתווסף רק באישור המשפחה',
  'photo.credit': 'צילום: {credit}',

  'nearby.button': 'איפה אני',
  'nearby.privacy': 'המיקום נבדק רק במכשיר שלכם, לא נשמר ולא נשלח לשום מקום.',
  'nearby.locating': 'מאתרים מיקום…',
  'nearby.at': 'נראה שאתם בתחנה: {title}',
  'nearby.near': 'התחנה הקרובה: {title}, במרחק {distance}',
  'nearby.none': 'לא נמצאה תחנה בקרבת מקום. אפשר לבחור תחנה מהרשימה.',
  'nearby.denied': 'לא ניתנה הרשאה לשימוש במיקום. אפשר לבחור תחנה מהרשימה.',
  'nearby.unavailable': 'לא ניתן לאתר מיקום כרגע. אפשר לבחור תחנה מהרשימה.',
  'nearby.open': 'לפתוח את התחנה',

  'offline.ready': 'הסיור שמור במכשיר וזמין גם בלי קליטה.',
  'offline.now': 'אין כרגע חיבור. התוכן שנשמר במכשיר זמין גם עכשיו.',
  'update.available': 'יש גרסה מעודכנת של הסיור.',
  'update.reload': 'לעדכן',

  'readAloud.label': 'מצב הקראה',
  'readAloud.on': 'מצב הקראה פעיל',
  'readAloud.off': 'מצב הקראה כבוי',

  'share.button': 'לשתף',
  'share.copied': 'הקישור הועתק',
  'share.failed': 'לא ניתן לשתף. אפשר להעתיק את הכתובת מהדפדפן.',

  'sources.title': 'מקורות',
  'sources.intro': 'כל העובדות באתר מבוססות על המקורות הבאים.',
  'sources.byPerson': 'לפי אדם',
  'sources.byStation': 'לפי תחנה',

  'about.title': 'אודות',
  'about.rights': 'זכויות והסכמות',
  'about.lastReview': 'התוכן נבדק לאחרונה ב-{date}',
  'about.contact': 'לתיקונים ופניות: {email}',

  'notFound.title': 'הדף לא נמצא',
  'notFound.body': 'ייתכן שהקישור שגוי או שהדף הועבר.',
  'notFound.home': 'לחזור לדף הבית',

  'error.title': 'משהו השתבש',
  'error.body': 'אפשר לנסות לטעון את הדף מחדש.',
  'error.reload': 'לטעון מחדש',

  'common.close': 'לסגור',
  'common.externalLink': '(נפתח בחלון חדש)',
} as const;

export type StringKey = keyof typeof he;
