// Campus photos from public/, with a drawn SVG fallback. campus is "hero", "LAU Beirut" or "LAU Byblos".
import { useState } from "react";

const PHOTOS = {
  "LAU Beirut": { src: "campus-beirut.jpg", alt: "LAU Beirut campus: a stone building with arched windows behind a garden staircase" },
  "LAU Byblos": { src: "campus-byblos.jpg", alt: "LAU Byblos campus: students on the steps of the Frem Civic Center" },
};

export default function CampusPhoto({ campus = "hero", className = "" }) {
  const [failed, setFailed] = useState(false);
  const cls = `absolute inset-0 h-full w-full ${className}`;
  const photo = PHOTOS[campus];
  if (photo && !failed)
    return <img src={`${import.meta.env.BASE_URL}${photo.src}`} alt={photo.alt} loading="lazy" onError={() => setFailed(true)} className={`${cls} object-cover`} />;
  if (campus === "LAU Beirut")
    return (
      <svg aria-hidden="true" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" className={cls}>
        <defs><linearGradient id="bs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b4a38" /><stop offset="1" stopColor="#1f8a96" /></linearGradient></defs>
        <rect width="400" height="180" fill="url(#bs)" />
        <circle cx="305" cy="62" r="26" fill="#f5b83d" /><circle cx="305" cy="62" r="44" fill="#f5b83d" opacity=".18" />
        <g fill="#06241b" opacity=".92"><path d="M0 180V118h22V92h26v26h14V76h30v42h18v-30h24v30h20V64h34v54h16V98h26v20h22V84h30v34h20v-22h36v84z" /></g>
        <g fill="#f5b83d" opacity=".75"><rect x="30" y="100" width="4" height="5" /><rect x="86" y="88" width="4" height="5" /><rect x="152" y="76" width="4" height="5" /><rect x="214" y="72" width="4" height="5" /><rect x="296" y="104" width="4" height="5" /></g>
        <path d="M0 160c40-10 70 8 110 0s70-10 110 0 70 10 110 0 50-8 70 0v20H0z" fill="#fff" opacity=".12" />
      </svg>
    );
  if (campus === "LAU Byblos")
    return (
      <svg aria-hidden="true" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" className={cls}>
        <defs><linearGradient id="yb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b4a38" /><stop offset="1" stopColor="#c18a2c" /></linearGradient></defs>
        <rect width="400" height="180" fill="url(#yb)" />
        <circle cx="90" cy="64" r="24" fill="#f5b83d" /><circle cx="90" cy="64" r="42" fill="#f5b83d" opacity=".2" />
        <path d="M0 120c60-30 110-20 170 0s140 10 230-30v90H0z" fill="#07352a" />
        <g fill="#f3e3b8" opacity=".92"><rect x="228" y="92" width="10" height="56" rx="2" /><rect x="258" y="86" width="10" height="62" rx="2" /><rect x="288" y="96" width="10" height="52" rx="2" /><rect x="222" y="86" width="82" height="8" rx="2" /></g>
        <path d="M0 150c60-12 100 10 170 0s120-12 230 0v30H0z" fill="#052a21" />
        <path d="M0 168c50-8 90 6 150 0s110-8 160 0 60 4 90 0v12H0z" fill="#fff" opacity=".14" />
      </svg>
    );
  return (
    <svg aria-hidden="true" viewBox="0 0 1200 640" preserveAspectRatio="xMaxYMax slice" className={cls}>
      <defs>
        <linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#06231a" /><stop offset=".55" stopColor="#0b4a38" /><stop offset="1" stopColor="#14735a" /></linearGradient>
        <radialGradient id="hg" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#f5b83d" stopOpacity=".55" /><stop offset="1" stopColor="#f5b83d" stopOpacity="0" /></radialGradient>
        <path id="road" d="M-40 560 C 180 470, 330 590, 520 500 S 840 330, 1000 380 S 1180 330, 1260 250" />
      </defs>
      <rect width="1200" height="640" fill="url(#hs)" />
      <circle cx="930" cy="190" r="190" fill="url(#hg)" /><circle cx="930" cy="190" r="64" fill="#f5b83d" />
      <g fill="#fff" opacity=".5"><circle cx="640" cy="70" r="2" /><circle cx="760" cy="120" r="1.6" /><circle cx="520" cy="150" r="1.6" /><circle cx="1090" cy="80" r="2" /><circle cx="360" cy="90" r="1.5" /></g>
      <path d="M0 400C150 320 280 360 420 300S700 250 820 310s240 20 380-50V640H0z" fill="#0d5b45" opacity=".75" />
      <path d="M0 470C180 400 300 450 470 400s300-70 460-10 190 20 270-20V640H0z" fill="#083a2d" />
      <use href="#road" fill="none" stroke="#041a14" strokeWidth="58" strokeLinecap="round" />
      <use href="#road" fill="none" stroke="#f5b83d" strokeWidth="3" strokeDasharray="16 18" />
      <g transform="translate(250 505)"><circle r="26" fill="#f5b83d" opacity=".25" /><circle r="9" fill="#fff" stroke="#f5b83d" strokeWidth="4" /></g>
      <g transform="translate(1000 300)"><path d="M0 0c-22-26-30-40-30-58a30 30 0 0 1 60 0c0 18-8 32-30 58z" fill="#f5b83d" /><circle cy="-58" r="12" fill="#07281f" /></g>
      <g className="drive-car"><g transform="translate(0 -14)"><rect x="-32" y="-10" width="64" height="20" rx="8" fill="#fff" /><path d="M-16-10 -8-22H12L20-10z" fill="#fff" /><rect x="-7" y="-19" width="9" height="8" fill="#0b4a38" opacity=".5" /><circle cx="-18" cy="10" r="6.5" fill="#041a14" stroke="#fff" strokeWidth="2" /><circle cx="18" cy="10" r="6.5" fill="#041a14" stroke="#fff" strokeWidth="2" /></g>
        <animateMotion dur="18s" repeatCount="indefinite" rotate="auto"><mpath href="#road" /></animateMotion></g>
      <g transform="translate(520 486) rotate(-14)"><g transform="translate(0 -14)"><rect x="-32" y="-10" width="64" height="20" rx="8" fill="#f5b83d" /><path d="M-16-10 -8-22H12L20-10z" fill="#f5b83d" /><circle cx="-18" cy="10" r="6.5" fill="#041a14" stroke="#fff" strokeWidth="2" /><circle cx="18" cy="10" r="6.5" fill="#041a14" stroke="#fff" strokeWidth="2" /></g></g>
    </svg>
  );
}
