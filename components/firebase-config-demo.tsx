"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle, AlertTriangle } from "lucide-react"
import { useState } from "react"

export function FirebaseConfigDemo() {
  const [copied, setCopied] = useState(false)

  const demoConfig = {
    apiKey: "AIzaSyDemo_API_Key_Replace_With_Your_Own",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678",
  }

  const envVars = `NEXT_PUBLIC_FIREBASE_API_KEY=${demoConfig.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${demoConfig.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${demoConfig.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${demoConfig.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${demoConfig.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${demoConfig.appId}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envVars)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Firebase Configuration Demo</h1>
          <p className="text-gray-600">This demo shows how to configure Firebase for the Leave Tracker app</p>
        </div>

        <div className="grid gap-6">
          {/* Configuration Status */}
          <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-0 shadow-[12px_12px_20px_#46464620,-12px_-12px_20px_#ffffff]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Configuration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Not Configured</Badge>
                <span className="text-gray-600">Firebase environment variables are missing</span>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-0 shadow-[12px_12px_20px_#46464620,-12px_-12px_20px_#ffffff]">
            <CardHeader>
              <CardTitle className="text-gray-800">Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to configure Firebase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 text-white min-w-[24px] h-6 flex items-center justify-center">1</Badge>
                  <div>
                    <p className="font-medium text-gray-800">Create Firebase Project</p>
                    <p className="text-sm text-gray-600">
                      Go to{" "}
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Firebase Console
                      </a>{" "}
                      and create a new project
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 text-white min-w-[24px] h-6 flex items-center justify-center">2</Badge>
                  <div>
                    <p className="font-medium text-gray-800">Enable Authentication</p>
                    <p className="text-sm text-gray-600">Enable Authentication and add Google as a sign-in provider</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 text-white min-w-[24px] h-6 flex items-center justify-center">3</Badge>
                  <div>
                    <p className="font-medium text-gray-800">Enable Firestore</p>
                    <p className="text-sm text-gray-600">Create a Firestore database in production mode</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 text-white min-w-[24px] h-6 flex items-center justify-center">4</Badge>
                  <div>
                    <p className="font-medium text-gray-800">Get Configuration</p>
                    <p className="text-sm text-gray-600">
                      Go to Project Settings → General → Your apps → Web app config
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 text-white min-w-[24px] h-6 flex items-center justify-center">5</Badge>
                  <div>
                    <p className="font-medium text-gray-800">Add Environment Variables</p>
                    <p className="text-sm text-gray-600">Create a .env.local file with your Firebase config</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables Template */}
          <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-0 shadow-[12px_12px_20px_#46464620,-12px_-12px_20px_#ffffff]">
            <CardHeader>
              <CardTitle className="text-gray-800">Environment Variables Template</CardTitle>
              <CardDescription>Copy this template and replace with your actual Firebase config values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{envVars}</code>
                </pre>
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Replace the demo values with your actual Firebase project configuration
              </p>
            </CardContent>
          </Card>

          {/* Demo Features */}
          <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-0 shadow-[12px_12px_20px_#46464620,-12px_-12px_20px_#ffffff]">
            <CardHeader>
              <CardTitle className="text-gray-800">Demo Features</CardTitle>
              <CardDescription>What you'll get once Firebase is configured</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">User Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Google Sign-in Authentication</li>
                    <li>• Personal Leave Dashboard</li>
                    <li>• Add Leave Records with Calendar</li>
                    <li>• Subject-wise Leave Tracking</li>
                    <li>• Leave History and Details</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Admin Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Admin Panel Access</li>
                    <li>• Manage Subjects</li>
                    <li>• Add/Remove Leave Categories</li>
                    <li>• System Configuration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
