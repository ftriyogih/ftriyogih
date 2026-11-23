'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Separator } from '@/components/ui/Separator'
import { Switch } from '@/components/ui/Switch'
import { Tv2, User, Key, Bell, Shield, Palette, Save, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    autoDetectHighlights: true,
    minConfidence: 0.7,
    clipMaxDuration: 60,
    clipMinDuration: 10,
    publishToTwitch: false,
    notifyOnComplete: true,
    notifyOnError: true,
    theme: 'system',
  })

  if (!session) return null

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    // In a real app, this would call an API to save settings
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>
            Connected Twitch account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Tv2 className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{session.user?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{session.user?.twitchId}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Connected via Twitch OAuth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            <CardTitle>API Credentials</CardTitle>
          </div>
          <CardDescription>
            Configure your Twitch API credentials (requires app restart)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                type="password"
                placeholder="Enter your Twitch Client ID"
                value={process.env.TWITCH_CLIENT_ID || ''}
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Set via TWITCH_CLIENT_ID env variable</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Enter your Twitch Client Secret"
                value={process.env.TWITCH_CLIENT_SECRET || ''}
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Set via TWITCH_CLIENT_SECRET env variable</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            To change credentials, update your <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">.env</code> file and restart the application.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle>Processing Settings</CardTitle>
          </div>
          <CardDescription>
            Configure how VODs are processed and highlights are detected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-detect highlights</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically run highlight detection after VOD download</p>
            </div>
            <Switch
              checked={settings.autoDetectHighlights}
              onCheckedChange={(checked) => setSettings({ ...settings, autoDetectHighlights: checked })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Minimum confidence threshold</Label>
            <div className="flex items-center gap-4">
              <Input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={settings.minConfidence}
                onChange={(e) => setSettings({ ...settings, minConfidence: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-mono text-gray-900 dark:text-white w-16">
                {(settings.minConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only highlights with confidence above this threshold will be suggested
            </p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clipMinDuration">Minimum clip duration (seconds)</Label>
              <Input
                id="clipMinDuration"
                type="number"
                min="5"
                max="300"
                value={settings.clipMinDuration}
                onChange={(e) => setSettings({ ...settings, clipMinDuration: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clipMaxDuration">Maximum clip duration (seconds)</Label>
              <Input
                id="clipMaxDuration"
                type="number"
                min="10"
                max="300"
                value={settings.clipMaxDuration}
                onChange={(e) => setSettings({ ...settings, clipMaxDuration: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose when you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Job completed</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify when a processing job finishes successfully</p>
            </div>
            <Switch
              checked={settings.notifyOnComplete}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnComplete: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Job failed</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notify when a processing job fails</p>
            </div>
            <Switch
              checked={settings.notifyOnError}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnError: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full sm:w-[200px] h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose your preferred color theme
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle>Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Delete all data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Permanently delete all your VODs, highlights, clips, and jobs
            </p>
          </div>
          <Button variant="destructive">Delete All Data</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}