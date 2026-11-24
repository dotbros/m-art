"use client";

import { MediaUploader } from "./media-uploader";

/**
 * Lista zdjęć z kolejnością (←/→), usuwaniem i dodawaniem z galerii telefonu.
 * Każde zdjęcie trafia do formularza jako ukryte pole `name`. Etykiety pierwszego zdjęcia — `firstLabel`.
 */
export function ImageListEditor({ images, onChange, max, name = "images", firstLabel = "Główne", inputId, error, hint }: {
  images: string[]; onChange: (images: string[]) => void; max: number; name?: string; firstLabel?: string; inputId: string; error?: string; hint?: string;
}) {
  const move = (index: number, dir: -1 | 1) => { const next = [...images]; const [item] = next.splice(index, 1); next.splice(index + dir, 0, item); onChange(next); };
  return <div>
    {images.map((url) => <input key={url} type="hidden" name={name} value={url}/>)}
    {hint && <p className="adm-hint">{hint}</p>}
    {images.length > 0 && <ul className="adm-gallery">{images.map((url, i) => <li key={url}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Zdjęcie ${i + 1}`}/>
      {i === 0 && <span className="adm-badge adm-gallery-main">{firstLabel}</span>}
      <div className="adm-gallery-actions">
        <button type="button" className="adm-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Przesuń zdjęcie ${i + 1} wcześniej`}>←</button>
        <button type="button" className="adm-icon-btn" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Przesuń zdjęcie ${i + 1} dalej`}>→</button>
        <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => onChange(images.filter((u) => u !== url))} aria-label={`Usuń zdjęcie ${i + 1}`}>×</button>
      </div>
    </li>)}</ul>}
    {images.length < max
      ? <MediaUploader value={null} allowVideo={false} inputId={inputId} label="Dodaj zdjęcie" buttonLabel="Wybierz z galerii lub zrób zdjęcie" onChange={(media) => { if (media && !images.includes(media.url)) onChange([...images, media.url]); }} error={error}/>
      : <p className="adm-hint">Osiągnięto limit {max} zdjęć — usuń któreś, aby dodać nowe.</p>}
  </div>;
}
