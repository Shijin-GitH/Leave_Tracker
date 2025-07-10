// Firebase Setup Instructions
//
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Enable Authentication and select Google as sign-in method
// 4. Enable Firestore Database
// 5. Get your Firebase config from Project Settings
// 6. Add the following environment variables to your .env.local:
//
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
//
// 7. Set up Firestore security rules:
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Users can only access their own leave records
//     match /leaves/{document} {
//       allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
//       allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
//     }
//
//     // Anyone can read subjects
//     match /subjects/{document} {
//       allow read: if request.auth != null;
//       allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
//     }
//
//     // Admin collection - only readable by the user themselves
//     match /admins/{userId} {
//       allow read: if request.auth != null && request.auth.uid == userId;
//     }
//   }
// }
//
// 8. To make a user admin, manually add a document in the 'admins' collection
//    with the user's UID as the document ID

console.log("Firebase setup instructions loaded. Please follow the comments above.")
