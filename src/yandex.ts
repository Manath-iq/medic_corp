// Public Yandex Maps snapshot checked on 2026-11-12.
// Matched to the clinic by ksm-eko.ru and +7 (843) 276-95-35.
// Quotes preserve original wording; this is not a live review feed or clinic endorsement.
export const yandexClinic = {
  url: 'https://yandex.ru/maps/org/klinika_semeynoy_meditsiny/1664726921/',
  reviewsUrl: 'https://yandex.ru/maps/org/klinika_semeynoy_meditsiny/1664726921/reviews/',
  // Clean embed: coordinate + pin only, no business card, no ads
  embedUrl: 'https://yandex.ru/map-widget/v1/?ll=49.194170%2C55.808999&z=17&pt=49.194170%2C55.808999%2Cpm2rdm&l=map&lang=ru_RU',
  // OpenStreetMap clean embed (no ads, no business card)
  osmEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=49.1881%2C55.8040%2C49.2003%2C55.8140&layer=mapnik&marker=55.808999%2C49.194170',
  osmUrl: 'https://www.openstreetmap.org/?mlat=55.808999&mlon=49.194170#map=17/55.808999/49.194170',
  routeUrl: 'https://yandex.ru/maps/?rtext=~%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%97%D1%83%D1%80%20%D0%A3%D1%80%D0%B0%D0%BC%2C%2033%2F22&rtt=auto',
  rating: '4,7',
  ratings: 126,
  reviews: 34,
  checkedAt: '2026-11-12',
  checkedLabel: '12 ноября 2026',
  mapAddress: 'Зур Урам, 33/22',
  lat: 55.808999,
  lng: 49.194170,
}

export const yandexReviews = [
  {
    author: 'Олеся Н.',
    dateLabel: '9 января', // Yandex did not display a year: do not infer one.
    excerpt: true,
    quote: 'Очень внимательный персонал, квалифицированные врачи.',
  },
  {
    author: 'Александр Ларин',
    dateLabel: '28 августа 2024',
    date: '2024-08-28',
    excerpt: false,
    quote: 'Очень отзывчивый персонал и специалисты. Вникают в суть ситуации и с учетом пожаланий составлют программу.',
  },
  {
    author: 'Татьяна Хайруллина',
    dateLabel: '30 августа 2024',
    date: '2024-08-30',
    excerpt: false,
    quote: 'Вежливый персонал, прекрасные врачи',
  },
] as const
