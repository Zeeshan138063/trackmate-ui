import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, Shield, CreditCard, Download, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings();
  const { 
    subscription, 
    paymentMethods, 
    loading: subscriptionLoading, 
    isCreatingCheckout,
    createCheckoutSession,
    isSubscriptionActive,
    getSubscriptionStatusText,
    formatPrice
  } = useSubscription();
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    timezone: 'America/Los_Angeles'
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        timezone: settings?.timezone || 'America/Los_Angeles'
      });
    }
  }, [profile, settings]);

  const handleProfileSave = async () => {
    await updateProfile({
      fullName: profileForm.fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      location: profileForm.location,
      bio: profileForm.bio,
    });
    
    if (settings) {
      await updateSettings({
        timezone: profileForm.timezone
      });
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    if (!settings) return;
    
    const updates: any = {};
    switch (key) {
      case 'email':
        updates.emailNotifications = value;
        break;
      case 'push':
        updates.pushNotifications = value;
        break;
      case 'jobAlerts':
        updates.jobAlerts = value;
        break;
      case 'weeklyDigest':
        updates.weeklyDigest = value;
        break;
    }
    
    await updateSettings(updates);
  };

  const handlePrivacyChange = async (visibility: 'public' | 'limited' | 'private') => {
    if (!settings) return;
    await updateSettings({ profileVisibility: visibility });
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        toast.error('Failed to update password: ' + error.message);
        return;
      }

      toast.success('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!user) {
      toast.error('You must be logged in to export data');
      return;
    }

    setIsExportingData(true);

    try {
      // Fetch all user data from different tables
      const [
        profileData,
        settingsData,
        jobsData,
        contactsData,
        careerGoalsData,
        prioritiesData,
        applicationGoalsData,
        interviewFeedbackData,
        resumesData,
        interviewPracticesData,
        workStylesData
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id),
        supabase.from('jobs').select('*').eq('user_id', user.id),
        supabase.from('contacts').select('*').eq('user_id', user.id),
        supabase.from('career_goals').select('*').eq('user_id', user.id),
        supabase.from('priorities').select('*').eq('user_id', user.id),
        supabase.from('application_goals').select('*').eq('user_id', user.id),
        supabase.from('interview_feedback').select('*').eq('user_id', user.id),
        supabase.from('resumes').select('*').eq('user_id', user.id),
        supabase.from('interview_practices').select('*').eq('user_id', user.id),
        supabase.from('work_styles').select('*').eq('user_id', user.id)
      ]);

      // Create export object
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          userId: user.id,
          userEmail: user.email,
          version: '1.0'
        },
        profile: profileData.data || [],
        settings: settingsData.data || [],
        jobs: jobsData.data || [],
        contacts: contactsData.data || [],
        careerGoals: careerGoalsData.data || [],
        priorities: prioritiesData.data || [],
        applicationGoals: applicationGoalsData.data || [],
        interviewFeedback: interviewFeedbackData.data || [],
        resumes: resumesData.data || [],
        interviewPractices: interviewPracticesData.data || [],
        workStyles: workStylesData.data || [],
        statistics: {
          totalJobs: jobsData.data?.length || 0,
          totalContacts: contactsData.data?.length || 0,
          totalInterviewFeedback: interviewFeedbackData.data?.length || 0,
          totalResumes: resumesData.data?.length || 0,
          totalInterviewPractices: interviewPracticesData.data?.length || 0
        }
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trackmate-data-export-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully! Check your downloads folder.');

    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleUpgradePlan = async (planId: string, interval: 'monthly' | 'yearly') => {
    const checkoutData = await createCheckoutSession(planId, interval);
    if (checkoutData?.url) {
      window.location.href = checkoutData.url;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (profileLoading || settingsLoading || subscriptionLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatarUrl || "/placeholder-avatar.jpg"} />
                  <AvatarFallback>
                    {profile?.fullName ? getInitials(profile.fullName) : user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">Change Photo</Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

                <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={profileForm.location}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter your location"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={profileForm.timezone}
                  onValueChange={(value) => setProfileForm(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PST)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MST)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CST)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (EST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleProfileSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings?.emailNotifications || false}
                    onCheckedChange={(value) => handleNotificationChange('email', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings?.pushNotifications || false}
                    onCheckedChange={(value) => handleNotificationChange('push', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Job Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new job opportunities
                    </p>
                  </div>
                  <Switch
                    checked={settings?.jobAlerts || false}
                    onCheckedChange={(value) => handleNotificationChange('jobAlerts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Digest</h4>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your job search activity
                    </p>
                  </div>
                  <Switch
                    checked={settings?.weeklyDigest || false}
                    onCheckedChange={(value) => handleNotificationChange('weeklyDigest', value)}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Notification preferences are saved automatically when changed.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Password</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password (minimum 6 characters)"
                      disabled={isChangingPassword}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      disabled={isChangingPassword}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    >
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                    {passwordForm.newPassword && passwordForm.confirmPassword && (
                      <Button 
                        variant="outline" 
                        onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 6 characters long. You will remain logged in after changing your password.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Setup</Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Profile Visibility</h4>
                <Select 
                  value={settings?.profileVisibility || 'private'}
                  onValueChange={(value) => handlePrivacyChange(value as 'public' | 'limited' | 'private')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to everyone</SelectItem>
                    <SelectItem value="limited">Limited - Visible to recruiters only</SelectItem>
                    <SelectItem value="private">Private - Not visible to others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Current Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      {subscription ? subscription.planName : 'Free Plan'}
                    </p>
                  </div>
                  <Badge variant={isSubscriptionActive() ? 'default' : 'secondary'}>
                    {subscription ? getSubscriptionStatusText() : 'Free'}
                  </Badge>
                </div>
                
                {subscription ? (
                  <>
                    <div className="space-y-2 text-sm mb-4">
                      <p>• Unlimited job tracking</p>
                      <p>• Advanced resume builder</p>
                      <p>• Interview preparation</p>
                      <p>• Priority support</p>
                      {subscription.planId === 'premium' && (
                        <>
                          <p>• AI-powered insights</p>
                          <p>• Advanced analytics</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
                        {formatPrice(subscription.amount)}/{subscription.intervalType === 'month' ? 'month' : 'year'}
                      </span>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">
                          Change Plan
                        </Button>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                    {subscription.cancelAtPeriodEnd && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Your subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2 text-sm mb-4">
                      <p>• Basic job tracking (up to 10 jobs)</p>
                      <p>• Basic resume builder</p>
                      <p>• Community support</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">$0/month</span>
                      <Button 
                        onClick={() => handleUpgradePlan('pro', 'monthly')}
                        disabled={isCreatingCheckout}
                      >
                        {isCreatingCheckout ? 'Loading...' : 'Upgrade to Pro'}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Available Plans - Show if no subscription */}
              {!subscription && (
                <div>
                  <h4 className="font-medium mb-4">Available Plans</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pro Plan */}
                    <div className="p-4 border rounded-lg">
                      <div className="mb-4">
                        <h5 className="font-medium">Pro Plan</h5>
                        <p className="text-sm text-muted-foreground">Perfect for active job seekers</p>
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                  <p>• Unlimited job tracking</p>
                  <p>• Advanced resume builder</p>
                  <p>• Interview preparation</p>
                  <p>• Priority support</p>
                </div>
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          onClick={() => handleUpgradePlan('pro', 'monthly')}
                          disabled={isCreatingCheckout}
                        >
                          $29.99/month
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleUpgradePlan('pro', 'yearly')}
                          disabled={isCreatingCheckout}
                        >
                          $299.99/year (Save $60)
                        </Button>
                </div>
              </div>

                    {/* Premium Plan */}
                <div className="p-4 border rounded-lg">
                      <div className="mb-4">
                        <h5 className="font-medium">Premium Plan</h5>
                        <p className="text-sm text-muted-foreground">For serious professionals</p>
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                        <p>• Everything in Pro</p>
                        <p>• AI-powered insights</p>
                        <p>• Advanced analytics</p>
                        <p>• 1-on-1 career coaching</p>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          onClick={() => handleUpgradePlan('premium', 'monthly')}
                          disabled={isCreatingCheckout}
                        >
                          $49.99/month
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => handleUpgradePlan('premium', 'yearly')}
                          disabled={isCreatingCheckout}
                        >
                          $499.99/year (Save $100)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {paymentMethods.length > 0 && (
              <div>
                  <h4 className="font-medium mb-4">Payment Method</h4>
                <div className="space-y-2">
                    {paymentMethods.map((pm) => (
                      <div key={pm.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center">
                              {pm.cardBrand?.toUpperCase() || 'CARD'}
                            </div>
                            <span>**** **** **** {pm.cardLast4}</span>
                            {pm.cardExpMonth && pm.cardExpYear && (
                              <span className="text-sm text-muted-foreground">
                                {pm.cardExpMonth.toString().padStart(2, '0')}/{pm.cardExpYear}
                              </span>
                            )}
                            {pm.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          </div>
                          <Button variant="outline" size="sm">Update</Button>
                        </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Billing */}
              {subscription && isSubscriptionActive() && (
                <div>
                  <h4 className="font-medium mb-4">Next Billing</h4>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">
                          {subscription.planName} - {subscription.intervalType === 'month' ? 'Monthly' : 'Yearly'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Next payment on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-medium">{formatPrice(subscription.amount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or delete your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a copy of all your data including job applications, contacts, resumes, interview feedback, and settings in JSON format.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={isExportingData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExportingData ? 'Exporting...' : 'Export All Data'}
                </Button>
                {isExportingData && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Gathering your data... This may take a moment.
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-4">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}