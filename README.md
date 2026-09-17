# 🛡️ PSCVault — OneNote-Style UPSC Preparation Workspace

**PSCVault** is a high-performance, local-first note-taking and syllabus workspace built specifically for UPSC (Union Public Service Commission) CSE preparation. Designed with a OneNote-inspired structure, it supports offline-first local SQLite storage with background cloud synchronization to MongoDB Atlas, rich media attachments, PowerPoint-style image manipulation, and structured UPSC syllabus organization.

---

## 🌟 Key Features

### 📚 1. UPSC-Optimized Hierarchical Organization
- **Notebooks**: Subject groups (GS I, GS II, GS III, GS IV, Essay, Optional).
- **Section Groups & Subject Sections**: Indian Polity, Modern History, Economy, Science & Tech, Environment, etc.
- **Chapter Containers**: Chapters act as container dashboards for sub-topics with automatic sequential numbering (`Chapter 1` -> `Topic 1.1`, `Topic 1.2`, `Topic 1.3`).
- **Topic Note Pages**: Dedicated rich-text note editor pages owned by individual topics.

### 🖼️ 2. PowerPoint-Style Image Manipulation
- **8-Handle Bounding Box**: Independent width & height resizing (`Middle-Left`/`Middle-Right` for width, `Top-Center`/`Bottom-Center` for height).
- **Top Circular Rotation Handle**: Rotate images freely (`0°` to `360°`).
- **Aspect Ratio Lock Toggle (🔒/🔓)**: Switch between proportional corner scaling and freeform image stretching.
- **Z-Index Layering**: Bring forward / send backward controls.
- **Image Annotations & Highlighting**: Canvas overlay for drawing, highlighter marking, and pen stylus input directly on images.

### 📄 3. Rich Text & Media Editor
- **TipTap Core**: Headings, bold/italic/underline, highlighters, bullet lists, numbered lists, task checklists, tables.
- **PDF Viewer & Annotations**: Built-in PDF reader with page navigation and persistent document metadata.
- **Voice / Audio Notes**: Record audio notes directly inside pages with waveform visualization via `wavesurfer.js`.
- **Full-Page Drawing Canvas**: Handwritten note-taking and stylus/pen drawing overlay.

### ⚡ 4. Offline-First Architecture & Cloud Sync
- **Local-First SQLite Engine**: 0ms latency local reads and writes using SQLite and local file storage.
- **Offline Sync Queue**: Operations (`CREATE`, `UPDATE`, `DELETE`, `RESTORE`) queue locally when offline (`☁ Offline • ✓ Saved locally`).
- **Auto-Reconnect Listener**: Automatically detects network connection, pushes queued mutations to MongoDB Atlas, and pulls incremental changes (`⟳ Syncing...` -> `✓ Synced`).
- **Multi-Device Synchronization**: Authenticate on new devices to pull cloud workspace without overwriting local changes.
- **Security & Data Isolation**: Strict user-level access controls and IDOR protection enforced at backend middleware (`req.user.userId`).

---

## 🏗️ Architecture Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, TipTap Editor, Zustand, Lucide Icons, Wavesurfer.js, React-PDF.
- **Local Storage & Database**: SQLite (via Drizzle ORM), Tauri Plugin FS / Local File System.
- **Backend API Server**: Express.js, JWT Authentication (`bcryptjs`), Mongoose / MongoDB Atlas.
- **Desktop Application Runtime**: Tauri v2.

---

## 📁 Repository Structure

```text
pscvault/
├── server/                           # Express backend API & MongoDB sync server
│   ├── index.ts                      # Server entrypoint
│   ├── middleware/authMiddleware.ts  # JWT Authentication middleware
│   ├── models/                       # MongoDB schemas & memory store fallback
│   └── routes/                       # Auth, Workspace, Sync, & Entity REST endpoints
├── src/                              # React frontend application
│   ├── components/                   # UI Layout components (TopBar, Sidebars, Breadcrumbs)
│   ├── domain/                       # Core TypeScript interfaces & domain types
│   ├── features/                     # Feature modules (Editor, Page, Attachments, Auth, Drawing)
│   ├── infrastructure/               # Local Repositories, SQLite Drizzle schema, SyncEngine
│   └── stores/                       # Zustand state stores (authStore, pageStore, uiStore)
├── scratch/                          # Automated end-to-end test scripts
├── public/                           # Static assets
└── package.json                      # Project manifest & dependencies
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB** *(Optional)*: Local daemon or MongoDB Atlas URI (In-memory engine fallback is built-in for offline execution).

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Jithu-prajith/pscvault.git
cd pscvault

# 2. Install dependencies
npm install

# 3. Start development server (Frontend + Express Backend API)
npm run dev
```

### Production Build

```bash
# Run TypeScript check & Vite production build
npm run build
```

---

## 🧪 Testing

Execute the automated test suites covering CRUD operations, multi-device synchronization, security isolation, and offline-first acceptance:

```bash
# Run complete functional audit test suite
npx tsx scratch/test_complete_audit.ts

# Run offline-first resiliency test suite
npx tsx scratch/test_offline_first.ts

# Run PowerPoint image & chapter container test suite
npx tsx scratch/test_powerpoint_and_chapter.ts
```

---

## 📄 License

Private repository designed for UPSC CSE study management and note synchronization.
