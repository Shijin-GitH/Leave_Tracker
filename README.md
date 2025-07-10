# Leave Manager

A modern web application for tracking student leaves, duty leaves, and attendance percentages. Built with Next.js, React, Firebase, and Tailwind CSS.

## Features
- User authentication (Firebase Auth)
- Add, edit, and delete leave records
- Subject-wise leave summary and statistics
- Duty leave tracking
- Attendance percentage calculator
- Admin dashboard for privileged users
- Responsive, modern UI with Tailwind CSS

## Tech Stack
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Firebase (Firestore, Auth)](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm, pnpm, or yarn

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd Leave-Manager
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```
3. **Configure Firebase:**
   - Copy your Firebase config to `lib/firebase.ts` or use the provided setup script in `scripts/firebase-setup.js`.
   - Ensure Firestore and Auth are enabled in your Firebase project.

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Folder Structure
```
Leave Manager/
  app/                # Next.js app directory (pages, layouts, routes)
  components/         # Reusable React components
  hooks/              # Custom React hooks
  lib/                # Firebase and utility libraries
  public/             # Static assets (images, icons)
  scripts/            # Setup and utility scripts
  styles/             # Global and Tailwind styles
```

## Usage
- **Sign in** with your credentials (Firebase Auth)
- **Add leave** records for different subjects and periods
- **View statistics** and attendance percentage
- **Admins** can access the admin dashboard for additional controls

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
[MIT](LICENSE) (or specify your license here) 