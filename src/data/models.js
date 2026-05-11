/**
 * models.js — Registro central de modelos com suporte a Portfólio (Pipeline)
 */

export const MODELS_REGISTRY = [
  {
    id: 'iasmin-reis',
    name: 'Iasmin Reis',
    gender: 'female',
    category: 'Fashion / Runway',
    image: '/public/images/models/img-efeito-backgroung/13.jpg',
    status: 'validated',
    instagram: '@iasminreis',
    email: 'iasmin@homemodel.com',
    stats: {
      height: '178cm',
      bust: '82cm',
      waist: '60cm',
      hips: '89cm',
      shoes: '39',
      eyes: 'Brown',
      hair: 'Dark Brown'
    },
    gallery: [
      '/public/images/models/img-efeito-backgroung/charth_ss26_lb_041.JPG',
      '/public/images/models/img-efeito-backgroung/IMG_9604.PNG',
      '/public/images/models/img-efeito-backgroung/imgi_11_FIO00370.PNG',
      '/public/images/models/img-efeito-backgroung/13.jpg'
    ],
    works: [
      '/public/images/models/img-efeito-backgroung/charth_ss26_lb_041.JPG',
      '/public/images/models/img-efeito-backgroung/IMG_9604.PNG'
    ],
    polaroids: [
      '/public/images/models/img-efeito-backgroung/imgi_11_FIO00370.PNG',
      '/public/images/models/img-efeito-backgroung/13.jpg'
    ],
    video: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    id: 'alexandre-souza',
    name: 'Alexandre Souza',
    gender: 'male',
    category: 'Commercial',
    image: '/public/images/models/img-efeito-backgroung/IMG_6458.JPG',
    status: 'validated',
    instagram: '@alexandre_s',
    email: 'alexandre@homemodel.com',
    stats: {
      height: '188cm',
      chest: '98cm',
      waist: '80cm',
      shoes: '43',
      eyes: 'Green',
      hair: 'Black'
    },
    gallery: [
      '/public/images/models/img-efeito-backgroung/IMG_6458.JPG',
      '/public/images/models/img-efeito-backgroung/IMG_7644.JPG'
    ],
    works: [
      '/public/images/models/img-efeito-backgroung/IMG_6458.JPG'
    ],
    polaroids: [
      '/public/images/models/img-efeito-backgroung/IMG_7644.JPG'
    ],
    video: null
  }
];

export function getValidatedModels(gender) {
  return MODELS_REGISTRY.filter(m => m.gender === gender && m.status === 'validated');
}

export function getModelById(id) {
  return MODELS_REGISTRY.find(m => m.id === id);
}
