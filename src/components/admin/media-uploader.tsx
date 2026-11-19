"use client";

import { useRef, useState } from "react";

export type UploadedMedia = { mediaType: "image" | "video"; url: string; posterUrl: string | null; hasAudio: boolean; aspect?: number | null };
type Phase = { kind: "idle" } | { kind: "uploading"; percent: number } | { kind: "processing" } | { kind: "error"; message: string };

/**
 * Wybór zdjęcia lub filmu z galerii telefonu (albo nagranie aparatem) i wysyłka z paskiem postępu.
 * Serwer zmniejsza zdjęcie / przerabia film na lekkie MP4 i zwraca adresy, które trafiają do formularza.
 */
export function MediaUploader({ value, onChange, allowVideo = true, error }: { value: UploadedMedia | null; onChange: (media: UploadedMedia | null) => void; allowVideo?: boolean; error?: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const input = useRef<HTMLInputElement>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);

  function upload(file: File) {
    const request = new XMLHttpRequest();
    xhr.current = request;
    request.open("POST", `/api/admin/upload?allow=${allowVideo ? "image,video" : "image"}`);
    request.setRequestHeader("Content-Type", "application/octet-stream");
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      setPhase(percent >= 100 ? { kind: "processing" } : { kind: "uploading", percent });
    };
    request.upload.onload = () => setPhase({ kind: "processing" });
    request.onload = () => {
      xhr.current = null;
      let data: (UploadedMedia & { error?: string }) | null = null;
      try { data = JSON.parse(request.responseText); } catch { /* odpowiedź nie-JSON */ }
      if (request.status === 201 && data) { onChange({ mediaType: data.mediaType, url: data.url, posterUrl: data.posterUrl, hasAudio: !!data.hasAudio, aspect: data.aspect ?? null }); setPhase({ kind: "idle" }); }
      else setPhase({ kind: "error", message: data?.error || "Nie udało się wysłać pliku. Spróbuj ponownie." });
    };
    request.onerror = () => { xhr.current = null; setPhase({ kind: "error", message: "Brak połączenia — sprawdź internet i spróbuj ponownie." }); };
    request.onabort = () => { xhr.current = null; setPhase({ kind: "idle" }); };
    setPhase({ kind: "uploading", percent: 0 });
    request.send(file);
  }

  const busy = phase.kind === "uploading" || phase.kind === "processing";
  const message = error || (phase.kind === "error" ? phase.message : "");

  return <div className={`adm-field adm-media ${message ? "has-error" : ""}`}>
    <span className="adm-label" id="media-label">{allowVideo ? "Zdjęcie lub film" : "Zdjęcie"}</span>
    <div className="adm-media-preview" aria-labelledby="media-label">
      {value ? (value.mediaType === "video"
        ? <video src={value.url} poster={value.posterUrl ?? undefined} muted loop playsInline autoPlay controls={value.hasAudio} aria-label="Podgląd filmu"/>
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={value.url} alt="Podgląd zdjęcia"/>) : <span>Brak zdjęcia ani filmu</span>}
      {busy && <div className="adm-media-busy" role="status" aria-live="polite">
        {phase.kind === "uploading" ? <><strong>Wysyłanie… {phase.percent}%</strong><span className="adm-progress"><i style={{ width: `${phase.percent}%` }}/></span></>
          : <><strong>Przetwarzanie…</strong><small>Film może potrwać do minuty. Nie zamykaj strony.</small></>}
      </div>}
    </div>
    <input ref={input} id="media-file" type="file" className="sr-only" accept={allowVideo ? "image/*,video/*" : "image/*"} disabled={busy}
      onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) upload(file); }}/>
    <div className="adm-row">
      <label htmlFor="media-file" className={`adm-btn ${busy ? "is-disabled" : ""}`} aria-disabled={busy}>{value ? "Zmień" : "Wybierz z galerii lub nagraj"}</label>
      {busy && <button type="button" className="adm-btn" onClick={() => xhr.current?.abort()}>Przerwij</button>}
      {value && !busy && <button type="button" className="adm-btn adm-btn-ghost-danger" onClick={() => onChange(null)}>Usuń</button>}
    </div>
    {message ? <small className="adm-error" role="alert">{message}</small>
      : <small className="adm-hint">{allowVideo ? "Film: najlepiej 5–20 s, odtwarzany w pętli; dłuższy zostanie przycięty do 20 s. Startuje wyciszony (wymóg przeglądarek) — klient może włączyć dźwięk przyciskiem. Zdjęcia i filmy zmniejszamy automatycznie." : "Zdjęcie zmniejszymy automatycznie."}</small>}
  </div>;
}
