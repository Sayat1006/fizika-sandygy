/* Белгішелер: бір стиль (24×24, 2 px сызық, дөңгелек ұштар) */
import type { SVGProps } from 'react';

const P = (d: string, extra?: SVGProps<SVGSVGElement>) => (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...extra} {...props}>
    <path d={d} />
  </svg>
);

export const IcKmzh = P('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4');
export const IcPres = P('M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 16v4M8 20h8');
export const IcWs = P('M9 4h6v3H9zM6 6h12v15H6zM9 13l2 2 4-4');
export const IcLock = P('M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4');
export const IcEye = P('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z');
export const IcBusy = P('M12 3a9 9 0 1 1-9 9');
export const IcDone = P('M5 12l5 5 9-10');
export const IcLab = P('M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 14h9');
export const IcBoard = P('M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 21h8M12 17v4M7 13l3-3 2 2 4-4');
export const IcCard = P('M3 7h18v12H3zM3 11h18');
export const IcList = P('M4 6h16M4 12h10M4 18h6');
export const IcSend = P('M21 4L3 11l6 2 2 6 3-4 5 4z');
export const IcUser = P('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6');
export const IcSearch = P('M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5');
export const IcClose = P('M6 6l12 12M18 6L6 18');
export const IcChevronL = P('M15 5l-7 7 7 7');
export const IcChevronR = P('M9 5l7 7-7 7');
export const IcChevronD = P('M6 9l6 6 6-6');
export const IcPlay = P('M8 5v14l11-7z', { fill: 'currentColor', stroke: 'none' });
export const IcPause = P('M7 5h3v14H7zM14 5h3v14h-3z', { fill: 'currentColor', stroke: 'none' });

export const KindIcon = { kmzh: IcKmzh, pres: IcPres, ws: IcWs } as const;

/** «Сабақтас» белгісі */
export function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="118 117.5 390 390" aria-hidden {...props}>
      <path d="M495 244 L313 155 L131 244 L131 277 L313 370 L313 345 L153 262 L313 183 L495 272 Z M131 381 L313 470 L495 381 L495 348 L313 255 L313 280 L473 363 L313 442 L131 353 Z" fill="currentColor" />
    </svg>
  );
}
