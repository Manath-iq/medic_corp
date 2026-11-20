import { StrictMode, useLayoutEffect, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, Phone } from '@phosphor-icons/react'
import '@fontsource-variable/manrope'
import './styles.css'
import './information.css'
import SiteHeader from './SiteHeader'
import Footer from './Footer'
import { clinic } from './data'
import { yandexClinic } from './yandex'
import { services } from './services-data'
import { serviceHref } from './services-links'

const home = import.meta.env.BASE_URL
const pdf = home + 'documents/'
const program = 'https://pravo.tatarstan.ru/file/npa/2026-03/1808585/npa_1808586.pdf'
const scan = (n: number) => home + 'assets/license/extract-' + n + '.jpg'

function Links({ items }: { items: string[][] }) {
  return <ul className="info-links">{items.map(([name, href]) => <li key={href}><a href={href}>{name}<ArrowUpRight aria-hidden="true" /></a></li>)}</ul>
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return <dl className="info-facts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

const phone = <a href={clinic.phoneHref}>{clinic.phone}</a>
const mail = <a href="mailto:ksm-eko.kazan@mail.ru">ksm-eko.kazan@mail.ru</a>
type Section = [id: string, title: string, body: ReactNode]
const contactFacts = <Facts rows={[
    ['Адрес', '420029, Республика Татарстан, Казань, ул. Зур Урам, д. 33'],
    ['Регистратура', <>{phone} · <a href="tel:+79625593989">+7 (962) 559-39-89</a></>],
    ['Электронная почта', mail], ['Часы работы', 'Пн–пт 08:00–16:00 · Сб 08:00–14:00 · Вс выходной'],
  ]} />
const about: Section[] = [
  ['contacts', 'Контакты и режим работы', <>{contactFacts}<Links items={[['Как добраться', clinic.contactsUrl + '#route']]} /></>],
  ['reception', 'Приём граждан', <p>Руководитель подразделения № 2 Борис Владимирович Капицкий принимает по понедельникам и средам с 10:00 до 12:00. Записаться заранее можно по телефону {phone} или по почте {mail}.</p>],
  ['license', 'Медицинская лицензия', <><p>Лицензия № Л041-01181-16/00327408 предоставлена 14 мая 2019 года Министерством здравоохранения Республики Татарстан.</p><div className="info-extract"><a href={scan(1)}><img src={scan(1)} width="1240" height="1754" loading="lazy" alt="Открыть первую страницу выписки с реестровым QR-кодом в полном размере" /></a><div><h3>Выписка из реестра лицензий</h3><p>Сведения на 28 апреля 2026 года. На первой странице расположен QR-код для проверки записи.</p><Links items={[[ 'Первая страница с QR-кодом', scan(1)], ['Перечень работ и услуг, стр. 2', scan(2)], ['Продолжение выписки, стр. 3', scan(3)]]} /></div></div></>],
  ['organization', 'Организация и руководство', <><p>Общество с ограниченной ответственностью «Клиника семейной медицины» (ООО «КСМ»).</p><Facts rows={[
    ['ОГРН / ИНН', '1051629014128 / 1657052423'], ['Учредители', 'Елена Борисовна Капицкая и Владимир Викторович Капицкий'], ['Генеральный директор', 'Елена Борисовна Капицкая'], ['Главный врач', 'Роза Рустямовна Биккинеева'], ['Подразделение № 2', 'Руководитель — Борис Владимирович Капицкий'], ['Отделение ВРТ', 'Заведующий — Анатолий Аркадьевич Соловьев'], ['Главная медицинская сестра', 'Алсу Усмановна Кадырова'],
  ]} /></>],
  ['team', 'Сотрудники клиники', <><Facts rows={[
    ['Главный врач', 'Роза Рустямовна Биккинеева'],
    ['Репродуктологи', 'Анатолий Аркадьевич Соловьев, Наталья Юрьевна Капицкая, Эльвира Рафаилевна Хамзина'],
    ['Эмбриологи', 'Наталья Владимировна Мотина, Елена Андреевна Жиряева'],
    ['Анестезиолог-реаниматолог', 'Альфия Гариповна Хазиева'],
    ['Главная медицинская сестра', 'Алсу Усмановна Кадырова'],
    ['Медицинская сестра-анестезист', 'Полина Николаевна Соловьева'],
    ['Медицинские сёстры', 'Саида Мирсаетовна Ибрагимова, Нурдида Ильдаровна Смекалина, Диана Анваровна Сабирзянова'],
    ['Специалист по ОМС', 'Резеда Махмудовна Талипова'],
    ['Администратор', 'Анна Елисеева'], ['Санитарка', 'Елена Александровна Мурашева'],
  ]} /><Links items={[['Профили специалистов', home + 'specialists/']]} /></>],
]
const patients: Section[] = [
  ['first-visit', 'Первый приём', <><p>Позвоните в регистратуру по номеру {phone}. Назовите нужного специалиста или исследование. Администратор согласует время, стоимость и подскажет, какие документы взять.</p><p>На первой консультации репродуктолог обсуждает историю здоровья, проводит осмотр и составляет план обследования. Если у вас есть заключения и результаты прошлых исследований, уточните при записи, какие принести.</p><Links items={[['Как проходит консультация репродуктолога', serviceHref('reproductologist-first')], ['Выбрать специалиста', home + 'specialists/']]} /></>],
  ['preparation', 'Подготовка к исследованиям', <><p>Подготовка зависит от назначенного исследования. Выберите исследование ниже и откройте раздел «Перед визитом». Если название в направлении отличается, уточните его в регистратуре до визита.</p><Links items={services.filter(service => service.categoryId === 'diagnostics').map(service => [service.title, serviceHref(service.id) + '#preparation'])} /></>],
  ['rights', 'Права и обязанности', <><p>Пациент вправе получить информацию о своём здоровье и предложенном лечении, задать врачу вопросы и рассчитывать на сохранение врачебной тайны. При посещении клиники соблюдайте её правила внутреннего распорядка.</p><Links items={[['Права и обязанности пациентов', pdf+'prava-i-obazonosti-2021.pdf'], ['Правила внутреннего распорядка КСМ', pdf+'pravila-dla-pacientov-19.pdf']]} /></>],
  ['hospital', 'Госпитализация и доступность', <><p>В лицензии КСМ указаны амбулаторная помощь и дневной стационар. При плановом лечении врач согласует показания и подготовку. Дату поступления, время прибытия и перечень документов уточните по телефону {phone}.</p><p>Если нужна помощь при входе или передвижении по клинике, сообщите об этом администратору при записи.</p><Links items={[['Виды медицинской помощи в КСМ', pdf+'vidu-med-pomoshi-21.pdf'], ['Помощь маломобильным пациентам', pdf+'19-politika-invalidov.pdf'], ['Лист ожидания ЭКО', clinic.omsUrl+'#waiting']]} /></>],
  ['appeals', 'Как подать обращение', <><p>Передайте письменное обращение администрации по адресу Казань, ул. Зур Урам, д. 33, оставьте запись в книге отзывов у регистратуры или запишитесь на личный приём по телефону {phone}.</p><Links items={[['Порядок рассмотрения претензий в КСМ', pdf+'pologenie-o-pritenziah-19.pdf'], ['Часы приёма руководителя', clinic.informationUrl+'#reception']]} /><h3>Контролирующие органы</h3><Facts rows={[
    ['Минздрав Татарстана', <><a href="https://minzdrav.tatarstan.ru/">Казань, ул. Бутлерова, 40/11</a><br/><a href="tel:+78432227020">+7 (843) 222-70-20</a></>],
    ['Росздравнадзор по РТ', <><a href="https://roszdravnadzor.tatarstan.ru/">Казань, ул. Нариманова, 63</a><br/><a href="tel:+78432925437">+7 (843) 292-54-37</a></>],
    ['Роспотребнадзор по РТ', <><a href="https://rpn.tatarstan.ru/">Казань, ул. Большая Красная, 30</a><br/><a href="tel:+78432389854">+7 (843) 238-98-54</a></>],
  ]} /></>],
  ['documents', 'Документы и перечни лекарств', <Links items={[
    ['Положение КСМ о платных услугах', pdf+'pologenie-o-med-uslugah.pdf'], ['Политика обработки персональных данных', pdf+'pol-bezapasnosti-ksm.pdf'],
    ['Перечни лекарств, включая жизненно необходимые и препараты для высокозатратных нозологий', pdf+'n3867-p-ot18-12-25-lekastven-preparati.pdf'],
    ['Бесплатное и льготное обеспечение лекарствами', pdf+'poston-rf-30-06-1994-890.pdf'], ['Региональные условия лекарственного обеспечения', program],
  ]} />],
]
const oms: Section[] = [
  ['tatarstan', 'Если вы живёте в Татарстане', <ol><li>Запишитесь к репродуктологу КСМ. Врач определит, какие обследования нужны для оформления направления.</li><li>Передайте результаты обследований для рассмотрения комиссией. Направление выдают по медицинским показаниям.</li><li>После постановки в лист ожидания сотрудник клиники сообщит ваш номер. Когда подойдёт очередь, вас пригласят на приём.</li></ol>],
  ['regions', 'Если вы из другого региона', <><p>Обратитесь к лечащему врачу по месту жительства за направлением в ООО «Клиника семейной медицины», г. Казань. До поездки согласуйте приём по телефону {phone}.</p><h3>Что взять с собой</h3><p>Паспорт, полис ОМС, СНИЛС, направление и результаты назначенных обследований. Уточните у врача сроки действия результатов.</p></>],
  ['coverage', 'Что оплачивает ОМС', <><p>Базовая программа включает стимуляцию, получение яйцеклеток, оплодотворение, выращивание и перенос эмбрионов. По показаниям проводят криоконсервацию. В КСМ также выполняют перенос размороженных эмбрионов по ОМС.</p><h3>Что может оплачиваться отдельно</h3><p>КСМ относит к дополнительным услугам донорский материал, генетическое тестирование, вспомогательный хетчинг и хранение эмбрионов. До начала программы попросите врача пояснить, какие этапы входят в ваше направление.</p></>],
  ['waiting', 'Лист ожидания и доступность помощи', <><p>Очередность планового ЭКО определяется по листу ожидания. Чтобы узнать свой номер и ожидаемую дату приглашения, свяжитесь с регистратурой по телефону {phone}.</p><h3>Показатели программы Татарстана</h3><p>На 2026 год в программе установлены целевые показатели: обследование перед ВРТ по критериям качества — 100%, доля случаев ЭКО с наступлением беременности — 35%. Это плановые показатели республики. Индивидуальный прогноз обсуждается с врачом.</p><Links items={[['Сроки ожидания и критерии качества в программе РТ на 2026 год', program], ['Документы и изменения программы', 'https://minzdrav.tatarstan.ru/prog_gosgarnt.htm']]} /></>],
  ['insurance', 'Страховые организации', <><p>По вопросам оплаты помощи и защиты прав обращайтесь в свою страховую компанию. КСМ публикует следующие горячие линии:</p><Facts rows={[
    ['АК БАРС-Мед', <a href="tel:88005000303">8 800 500-03-03</a>], ['СМО «Спасение»', <a href="tel:88001000717">8 800 100-07-17</a>], ['Чулпан-Мед', <a href="tel:88002001065">8 800 200-10-65</a>],
  ]}/><p>Участие вашей страховой организации по действующему договору можно уточнить в КСМ по телефону {phone}.</p></>],
]
const offers: Section[] = [
  ['discounts', 'Скидки на услуги', <><p>Уточните в регистратуре, действует ли скидка на нужную услугу в день вашего визита.</p><Links items={[[clinic.phone, clinic.phoneHref], ['Посмотреть цены на услуги', clinic.priceListUrl]]} /></>],
  ['announcements', 'Приглашаем доноров ооцитов', <><p>По вопросам участия в донорской программе можно обратиться к ведущему эмбриологу Елене Андреевне Жиряевой.</p><Links items={[['Позвонить по вопросам донорства · +7 (987) 415-53-80', 'tel:+79874155380']]} /></>],
]
const contacts: Section[] = [
  ['reception', 'Регистратура', contactFacts],
  ['route', 'Как добраться', <><p>В Яндекс Картах здание обозначено как {yandexClinic.mapAddress}.</p><Links items={[['Построить маршрут', yandexClinic.routeUrl], ['Открыть клинику на карте', yandexClinic.url]]} /></>],
]
const pages = {
  offers: { title: 'Акции', lead: 'Информация о скидках и объявления Клиники семейной медицины.', sections: offers },
  contacts: { title: 'Контакты', lead: 'Телефоны для записи, часы работы и маршрут до клиники в Казани.', sections: contacts },
  about: { title: 'О клинике и лицензия', lead: 'Контакты клиники, приём у руководителя и документы на медицинскую деятельность.', sections: about },
  patients: { title: 'Пациентам', lead: 'Как подготовиться к визиту, получить помощь в клинике и обратиться к администрации.', sections: patients },
  oms: { title: 'ЭКО по ОМС', lead: 'Как получить направление в Казань, подготовить документы и узнать свою очередь.', sections: oms },
}
function Information({ page }: { page: typeof pages.about }) {
  useLayoutEffect(() => {
    const reveal = () => {
      const target = document.getElementById(location.hash.slice(1))
      if (target instanceof HTMLDetailsElement) target.open = true
      target?.scrollIntoView({ behavior: 'instant' })
    }
    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [])
  return <><a className="skip-link" href="#main">Перейти к содержимому</a><SiteHeader home={home} /><main className={'info-page container' + (page === pages.offers ? ' info-offers' : '')} id="main">
    <header className={'info-intro' + (page === pages.about ? ' about-intro' : '')}><div><a href={home}>← Главная</a><h1>{page.title}</h1><p>{page.lead}</p></div>{page === pages.about && <figure><img src={home + 'assets/clinic/reception.webp'} width="675" height="900" alt="Стойка регистратуры с вывеской Клиники семейной медицины" /><figcaption>Регистратура КСМ · Казань, Зур Урам, 33</figcaption></figure>}</header>
    {page === pages.patients ? <div className="patient-guide info-content">
      {patients.map(([id, title, body], index) => <details key={id} id={id} open={index === 0 || undefined}>
        <summary><h2>{title}</h2><span aria-hidden="true">+</span></summary><div className="patient-answer">{body}</div>
      </details>)}
    </div> : <div className="info-layout"><aside><nav aria-label="На этой странице">{page.sections.map(([id, title]) => <a key={id} href={'#'+id}>{title}</a>)}</nav><a className="button button-primary" href={clinic.phoneHref}><Phone />Регистратура</a></aside>
    <div className="info-content">{page.sections.map(([id, title, body]) => <section key={id} id={id}><h2>{title}</h2>{body}</section>)}</div></div>}
  </main><Footer /></>
}
const root = document.getElementById('root')!
createRoot(root).render(<StrictMode><Information page={pages[root.dataset.page as keyof typeof pages]} /></StrictMode>)
