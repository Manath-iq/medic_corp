export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/clinic/${name}`

export const clinic = {
  name: 'Клиника семейной медицины',
  phone: '+7 (843) 276-95-35',
  phoneHref: 'tel:+78432769535',
  address: 'Казань, ул. Зур Урам, 33',
  website: 'https://ksm-eko.ru/',
  pricesUrl: 'https://ksm-eko.ru/index.php/ceny',
  omsUrl: 'https://ksm-eko.ru/index.php/pacientu/eko-po-oms',
  regionalOmsUrl: 'https://ksm-eko.ru/index.php/pacientu/nasi-uslugi/eko-po-oms-dlya-zhitelej-regionov-rf',
  firstVisitUrl: 'https://ksm-eko.ru/index.php/pacientu/pervicnyj-priem',
  preparationUrl: 'https://ksm-eko.ru/index.php/pacientu/podgotovka-i-issledovania',
  informationUrl: 'https://ksm-eko.ru/index.php/home/svedenia-o-klinike',
  patientUrl: 'https://ksm-eko.ru/index.php/pacientu/informatsiya-dlya-potrebitelya',
}

// Public clinic content, November 2026. Not yet approved for an official launch.
export const directions = [
  { id: 'reproduction', name: 'Репродуктология', image: 'genetics.webp', note: 'Когда путь к беременности требует внимания специалиста.', detail: 'Консультации репродуктологов, диагностика и лечение женского и мужского бесплодия.', tag: 'Планирование беременности' },
  { id: 'gynecology', name: 'Гинекология', image: 'kapitskaya.webp', note: 'Внимание к женскому репродуктивному здоровью.', detail: 'Приём акушера-гинеколога и обследования. Подходящий вид консультации помогут уточнить в регистратуре.', tag: 'Женское здоровье' },
  { id: 'embryology', name: 'Эмбриология', image: 'embryology.webp', note: 'Точная работа на самых ранних этапах.', detail: 'Консультации эмбриолога и эмбриологический этап программ вспомогательных репродуктивных технологий.', tag: 'Вспомогательные технологии' },
  { id: 'diagnostics', name: 'Диагностика и УЗИ', image: 'diagnostics.webp', note: 'Начать с понимания того, что происходит.', detail: 'Ультразвуковые и диагностические исследования. Подготовка зависит от исследования и уточняется при записи.', tag: 'Обследования' },
  { id: 'genetics', name: 'Генетические исследования', image: 'andrology.webp', note: 'Больше информации для дальнейших решений.', detail: 'Генетические исследования в составе диагностики и репродуктивных программ. Необходимость определяет врач.', tag: 'Исследования' },
  { id: 'andrology', name: 'Мужское здоровье', image: 'solovev.webp', note: 'Репродуктивное здоровье — общая история.', detail: 'Приём уролога и исследования мужского репродуктивного здоровья. Перечень обследований определяет специалист.', tag: 'Урология и диагностика' },
]

export const specialists = [
  { name: 'Соловьев', given: 'Анатолий Аркадьевич', image: 'solovev.webp', role: 'Акушер-гинеколог, репродуктолог, врач УЗД', detail: 'Заведующий отделением ВРТ', url: 'https://ksm-eko.ru/index.php/reproduktologi/akusher-ginekolog-reproduktolog-solovev-anatolij-arkadevich' },
  { name: 'Капицкая', given: 'Наталья Юрьевна', image: 'kapitskaya.webp', role: 'Акушер-гинеколог, репродуктолог, врач УЗД', detail: 'Репродуктивное здоровье', url: 'https://ksm-eko.ru/index.php/home/specialisty' },
  { name: 'Мотина', given: 'Наталья Владимировна', image: 'motina.webp', role: 'Главный эмбриолог, врач КДЛ', detail: 'Эмбриология', url: 'https://ksm-eko.ru/index.php/embriologii/glavnyj-embriolog-vrach-kdl-motina-natalya-vladimirovna' },
  { name: 'Жиряева', given: 'Елена Андреевна', image: 'zhiryaeva.webp', role: 'Ведущий эмбриолог', detail: 'Эмбриология', url: 'https://ksm-eko.ru/index.php/embriologii/zhiryaeva-elena-andreevna-vedushchij-embriolog' },
]

export const prices = [
  { name: 'Первичный приём репродуктолога', note: 'Консультация акушера-гинеколога с УЗИ', amount: 4500, category: 'Репродуктология' },
  { name: 'Повторный приём репродуктолога', note: 'Консультация с УЗИ · в течение 30 дней', amount: 3200, category: 'Репродуктология' },
  { name: 'Консультация эмбриолога', note: 'Индивидуальная консультация специалиста', amount: 2300, category: 'Эмбриология' },
  { name: 'Первичный приём уролога', note: 'Осмотр и консультация', amount: 3200, category: 'Другие специалисты' },
  { name: 'Первичный приём терапевта', note: 'Осмотр и консультация', amount: 2800, category: 'Другие специалисты' },
]

export const rubles = (amount: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)

// Organizational summaries of the clinic pages checked on 2026-11-11.
// Not a medical eligibility assessment or a guarantee of a quota.
export const omsRoutes = {
  tatarstan: {
    label: 'Татарстан',
    title: 'Для жителей Татарстана',
    source: clinic.omsUrl,
    steps: [
      { title: 'Приём репродуктолога', body: 'Запишитесь на консультацию в КСМ, чтобы обсудить участие в программе.' },
      { title: 'Обследования', body: 'Предоставьте результаты по перечню клиники для постановки в лист ожидания.' },
      { title: 'Лист ожидания', body: 'Специалист клиники сообщит по телефону номер в листе ожидания.' },
      { title: 'Приглашение', body: 'При получении квоты вас пригласят на приём для начала программы.' },
    ],
  },
  regions: {
    label: 'Другие регионы РФ',
    title: 'Для жителей других регионов России',
    source: clinic.regionalOmsUrl,
    steps: [
      { title: 'Направление', body: 'Получите у лечащего врача направление именно в ООО «Клиника семейной медицины».' },
      { title: 'Запись в КСМ', body: 'Свяжитесь с регистратурой и согласуйте приём и необходимые документы.' },
      { title: 'Документы и анализы', body: 'Подготовьте паспорт, полис ОМС, СНИЛС, направление и результаты обследований. Актуальный перечень уточните в клинике.' },
    ],
  },
} as const

export const firstSteps = [
  { id: 'call', number: '01', title: 'Начните с разговора', body: 'Позвоните в регистратуру и расскажите, на какой приём хотите записаться. Если пока не знаете — попросите помочь с выбором специалиста.', shortBody: 'Регистратура поможет выбрать специалиста и записаться.', label: 'Позвонить в клинику', href: clinic.phoneHref },
  { id: 'appointment', number: '02', title: 'Согласуйте приём', body: 'Уточните врача, дату, стоимость консультации и то, что нужно взять с собой. Первичный приём репродуктолога включает беседу, осмотр и УЗИ.', shortBody: 'Уточните дату, стоимость и документы для первого визита.', label: 'О первичном приёме', href: clinic.firstVisitUrl },
  { id: 'preparation', number: '03', title: 'Подготовьтесь к встрече', body: 'Уточните подготовку именно к вашему приёму или исследованию. Перечень обследований определяет врач — согласуйте его до сдачи анализов.', shortBody: 'Согласуйте подготовку при записи. Обследования назначает врач.', label: 'Подготовка к исследованиям', href: clinic.preparationUrl },
] as const

export const questions = [
  { id: 'first-visit', question: 'С чего начать, если я пока не знаю, какой приём нужен?', answer: 'Позвоните в регистратуру и опишите, по какому вопросу хотите обратиться. Администратор поможет уточнить подходящего специалиста и время. Диагноз и необходимость обследований определяет врач на консультации.', href: clinic.phoneHref, label: 'Позвонить в регистратуру' },
  { id: 'consultation', question: 'Как проходит первая консультация репродуктолога?', answer: 'По информации клиники, первичный приём включает беседу о здоровье и образе жизни, гинекологический осмотр, УЗИ малого таза и составление индивидуального плана обследования. Детали и подготовку уточните при записи.', href: clinic.firstVisitUrl, label: 'О первичном приёме на сайте КСМ' },
  { id: 'oms', question: 'Можно ли пройти ЭКО по ОМС, если я из другого региона?', answer: 'Клиника сообщает, что принимает по программе ОМС жителей Татарстана и других регионов РФ. Для пациентов из других регионов требуется направление именно в ООО «Клиника семейной медицины». Решение о направлении принимается по медицинским показаниям; порядок и доступность программы уточните в клинике.', href: clinic.regionalOmsUrl, label: 'Условия для других регионов' },
  { id: 'extra-costs', question: 'Все ли услуги входят в программу ОМС?', answer: 'Нет. На сайте клиники отдельно указаны услуги, не входящие в базовую программу: например, донорский материал, генетическое тестирование эмбрионов и хранение криоконсервированных эмбрионов. До начала программы уточните, что входит в её объём и что оплачивается отдельно.', href: clinic.omsUrl, label: 'Что входит в программу ОМС' },
  { id: 'tests', question: 'Нужно ли сдавать анализы до первого визита?', answer: 'Сначала уточните это при записи. Подготовка и перечень обследований зависят от вида приёма или исследования. Не назначайте себе анализы по общему списку на сайте: необходимый объём определяет специалист.', href: clinic.preparationUrl, label: 'Раздел подготовки к исследованиям' },
  { id: 'price', question: 'Где узнать актуальную стоимость?', answer: 'На этой странице показана подборка консультаций из открытого прайса. Полный перечень размещён на действующем сайте КСМ. Перед записью подтвердите у администратора стоимость и состав выбранной услуги.', href: clinic.pricesUrl, label: 'Открыть полный прайс клиники' },
] as const
