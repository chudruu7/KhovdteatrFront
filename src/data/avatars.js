// src/data/avatars.js

export const SYSTEM_AVATARS = [
  {
    id: 'avatar_1',
    url: 'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?semt=ais_hybrid&w=740&q=80',
    label: 'Аватар 1'
  },
  {
    id: 'avatar_2',
    url: 'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671140.jpg?semt=ais_hybrid&w=740&q=80',
    label: 'Аватар 2'
  },
  {
    id: 'avatar_3',
    url: 'https://img.freepik.com/free-psd/3d-illustration-with-online-avatar_23-2151303097.jpg?semt=ais_hybrid&w=740&q=80',
    label: 'Аватар 3'
  },
  {
    id: 'avatar_4',
    url: 'https://img.freepik.com/free-psd/3d-rendering-avatar_23-2150833572.jpg?semt=ais_hybrid&w=740&q=80',
    label: 'Аватар 4'
  }
];

export const ADMIN_DEFAULT_AVATAR = 'https://cdn3d.iconscout.com/3d/premium/thumb/profile-privacy-3d-icon-png-download-8081901.png';

export const DEFAULT_AVATAR = SYSTEM_AVATARS[0].url;

// Profile.jsx болон бусад файлд ашиглагдаж байгаа нэр — адилхан URL
export const defaultProfileUrl = SYSTEM_AVATARS[0].url;