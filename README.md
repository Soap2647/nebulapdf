<div align="center">

# 🌌 Nebula PDF

**A private, in-browser PDF editor. Your files never leave your device.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)
![pdf.js](https://img.shields.io/badge/pdf.js-render-ef4444?style=flat-square)
![pdf-lib](https://img.shields.io/badge/pdf--lib-edit-f97316?style=flat-square)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-animations-0055FF?style=flat-square&logo=framer&logoColor=white)

[Features](#-features) · [How it works](#-how-it-works) · [Run it](#-run-it) · [Türkçe](#-türkçe)

</div>

---

Nebula PDF is a fast, glassmorphism-styled PDF toolkit that runs **entirely client-side**.
Drop a file in, select a region and edit. No uploads, no servers, no accounts.

## ✨ Features

| Tool | What it does |
|---|---|
| 👁️ **View** | Smooth page rendering with pdf.js (worker-based) |
| ✏️ **Edit text** | Select an area and replace or add text |
| 🧽 **Remove images** | Select and erase images or regions on a page |
| 🖼️ **Extract as image** | Export pages as **PNG / JPG** at a chosen quality |
| 📄 **Convert to Word** | Generate a `.docx` from the document's text |
| 📦 **Batch export** | Bundle multi-page exports into a ZIP |

Everything is processed in memory in your browser, so it's safe for confidential documents.

## 🧩 How it works

```mermaid
flowchart LR
    F[Drop PDF] --> R[pdfjs-dist<br/>render to canvas]
    R --> S[Selection overlay]
    S --> E[pdf-lib<br/>text / image edits]
    E --> X{Export}
    X --> P[PDF]
    X --> I[PNG · JPG]
    X --> W[DOCX · docx]
    X --> Z[ZIP · jszip]
```

## 🚀 Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

## 📁 Project structure

```
src/
├── components/   FileDropzone, PDFViewer, SelectionOverlay, TextEditTool,
│                 ImageRemovalTool, ExportTool, Sidebar, GlassCard, NeonButton
├── utils/        pdfHelper (load/render), pdfExporter (PDF/PNG/JPG), pdfToDocx
└── App.jsx
public/pdf.worker.min.mjs
```

## 🇹🇷 Türkçe

**Nebula PDF**, tamamen tarayıcıda çalışan, gizlilik odaklı bir PDF düzenleyicidir. Dosyalar hiçbir sunucuya
gönderilmez. PDF görüntüleme, metin düzenleme, görsel silme, sayfaları PNG/JPG olarak çıkarma ve Word'e (.docx)
dönüştürme özellikleri sunar. React, Vite, Tailwind, pdf.js ve pdf-lib ile geliştirilmiştir.

---

<div align="center"><sub>Built by <a href="https://github.com/Soap2647">Mert Yasin Yılmaz</a></sub></div>
