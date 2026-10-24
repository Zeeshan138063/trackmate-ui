// Text-based, ATS-friendly PDF from a tailored resume (selectable text, no images).
// pdf-lib is loaded on demand so it never weighs down the main bundle.

import type { MasterProfile } from "@/types/resume";

const PAGE = { width: 612, height: 792 }; // US Letter, points
const MARGIN = 50;
const LINE = 1.3;

/** Standard PDF fonts only cover WinAnsi; map common typography and drop what can't render. */
export function pdfSafe(text: string | undefined | null): string {
  return (text ?? "")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•●▪‣⁃]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[\t\r]/g, " ")
    .replace(/[^\x20-\x7E\n¡-ÿ]/g, "");
}

export function resumeFileName(p: MasterProfile, company: string): string {
  const who = `${p.contact.firstName} ${p.contact.lastName}`.trim() || "Resume";
  const base = `${who} - ${company}`.replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 100);
  return `${base || "Resume"}.pdf`;
}

function bullets(description: string): string[] {
  return description
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-*•●]\s*/, "").trim())
    .filter(Boolean);
}

function dates(start?: string, end?: string, current?: boolean): string {
  const to = current ? "Present" : end || "";
  return [start, to].filter(Boolean).join(" - ");
}

export async function generateResumePdf(p: MasterProfile): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const name = pdfSafe(`${p.contact.firstName} ${p.contact.lastName}`.trim());
  doc.setTitle(name ? `${name} Resume` : "Resume");
  doc.setAuthor(name);
  doc.setCreator("JobOS");
  doc.setProducer("JobOS");

  let page = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - MARGIN;
  const maxWidth = PAGE.width - MARGIN * 2;
  type Font = typeof regular;

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - MARGIN;
    }
  };

  const wrap = (text: string, font: Font, size: number, width: number): string[] => {
    const out: string[] = [];
    for (const para of pdfSafe(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= width) {
          line = next;
        } else {
          if (line) out.push(line);
          line = word;
          while (font.widthOfTextAtSize(line, size) > width && line.length > 1) {
            // A single word longer than the line (e.g. a URL): hard-break it.
            let cut = line.length - 1;
            while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
            out.push(line.slice(0, cut));
            line = line.slice(cut);
          }
        }
      }
      if (line) out.push(line);
    }
    return out;
  };

  const text = (t: string, opts: { font?: Font; size?: number; x?: number; width?: number; color?: number } = {}) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 10;
    const x = opts.x ?? MARGIN;
    for (const line of wrap(t, font, size, opts.width ?? maxWidth - (x - MARGIN))) {
      ensure(size * LINE);
      page.drawText(line, { x, y: y - size, size, font, color: rgb(opts.color ?? 0, opts.color ?? 0, opts.color ?? 0) });
      y -= size * LINE;
    }
  };

  const rightAligned = (left: string, right: string, font: Font, size: number) => {
    const r = pdfSafe(right);
    const rw = r ? regular.widthOfTextAtSize(r, size) : 0;
    ensure(size * LINE);
    const lines = wrap(left, font, size, maxWidth - rw - 12);
    lines.forEach((line, i) => {
      if (i > 0) ensure(size * LINE);
      page.drawText(line, { x: MARGIN, y: y - size, size, font });
      if (i === 0 && r) page.drawText(r, { x: PAGE.width - MARGIN - rw, y: y - size, size, font: regular });
      y -= size * LINE;
    });
  };

  const heading = (t: string) => {
    ensure(28);
    y -= 8;
    page.drawText(pdfSafe(t.toUpperCase()), { x: MARGIN, y: y - 11, size: 11, font: bold });
    y -= 14;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE.width - MARGIN, y }, thickness: 0.7, color: rgb(0, 0, 0) });
    y -= 6;
  };

  const bulletList = (items: string[]) => {
    for (const item of items) {
      const lines = wrap(item, regular, 10, maxWidth - 14);
      lines.forEach((line, i) => {
        ensure(10 * LINE);
        if (i === 0) page.drawText("-", { x: MARGIN + 3, y: y - 10, size: 10, font: regular });
        page.drawText(line, { x: MARGIN + 14, y: y - 10, size: 10, font: regular });
        y -= 10 * LINE;
      });
    }
  };

  // Header
  if (name) {
    const w = bold.widthOfTextAtSize(name, 20);
    page.drawText(name, { x: (PAGE.width - w) / 2, y: y - 20, size: 20, font: bold });
    y -= 26;
  }
  if (p.targetTitle) {
    const t = pdfSafe(p.targetTitle);
    const w = regular.widthOfTextAtSize(t, 11);
    page.drawText(t, { x: Math.max(MARGIN, (PAGE.width - w) / 2), y: y - 11, size: 11, font: regular });
    y -= 16;
  }
  const contact = [p.contact.location, p.contact.phone, p.contact.email, p.contact.linkedin, p.contact.github, p.contact.portfolio]
    .map(pdfSafe).filter(Boolean).join(" | ");
  for (const line of wrap(contact, regular, 9, maxWidth)) {
    const w = regular.widthOfTextAtSize(line, 9);
    page.drawText(line, { x: (PAGE.width - w) / 2, y: y - 9, size: 9, font: regular });
    y -= 9 * LINE;
  }

  if (p.summary) {
    heading("Professional Summary");
    text(p.summary);
  }

  if (p.skills.length || p.interests) {
    heading("Technical Skills");
    for (const s of p.skills) {
      const label = `${pdfSafe(s.category)}: `;
      const lw = bold.widthOfTextAtSize(label, 10);
      const lines = wrap(s.items, regular, 10, maxWidth - lw);
      ensure(10 * LINE);
      page.drawText(label, { x: MARGIN, y: y - 10, size: 10, font: bold });
      lines.forEach((line, i) => {
        if (i > 0) ensure(10 * LINE);
        page.drawText(line, { x: MARGIN + (i === 0 ? lw : 0), y: y - 10, size: 10, font: regular });
        y -= 10 * LINE;
      });
    }
    if (p.interests) text(`Interests: ${p.interests}`);
  }

  if (p.experience.length) {
    heading("Experience");
    for (const e of p.experience) {
      rightAligned(e.position, dates(e.startDate, e.endDate, e.current), bold, 10.5);
      text([e.company, e.location].filter(Boolean).join(", "), { color: 0.25 });
      bulletList(bullets(e.description));
      y -= 4;
    }
  }

  if (p.projects.length) {
    heading("Projects");
    for (const pr of p.projects) {
      rightAligned([pr.name, pr.role].filter(Boolean).join(" - "), "", bold, 10.5);
      if (pr.technologies) text(pr.technologies, { size: 9, color: 0.25 });
      if (pr.link) text(pr.link, { size: 9, color: 0.25 });
      bulletList(bullets(pr.description));
      y -= 4;
    }
  }

  if (p.education.length) {
    heading("Education");
    for (const ed of p.education) {
      rightAligned([ed.degree, ed.field].filter(Boolean).join(", "), dates(ed.startDate, ed.endDate), bold, 10.5);
      text([ed.school, ed.location, ed.gpa ? `GPA ${ed.gpa}` : ""].filter(Boolean).join(", "), { color: 0.25 });
      y -= 2;
    }
  }

  if (p.certifications.length) {
    heading("Certifications");
    bulletList(p.certifications.map((c) => [c.name, c.issuer, c.date].filter(Boolean).join(", ")));
  }

  if (p.awards.length) {
    heading("Awards");
    bulletList(p.awards.map((a) => [a.title, a.issuer, a.date].filter(Boolean).join(", ")));
  }

  if (p.volunteering.length) {
    heading("Volunteering");
    for (const v of p.volunteering) {
      rightAligned(`${v.role}, ${v.organization}`, dates(v.startDate, v.endDate, v.current), bold, 10.5);
      bulletList(bullets(v.description));
    }
  }

  if (p.publications.length) {
    heading("Publications");
    bulletList(p.publications.map((pub) => [pub.title, pub.publisher, pub.date].filter(Boolean).join(", ")));
  }

  return await doc.save();
}
