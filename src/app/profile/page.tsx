'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAthleteProfile } from '@/lib/api/athlete.api';
import { updateAthleteProfile, uploadAthletePhoto } from '@/lib/api/athlete.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { StatisticsCard } from '@/components/ui/StatisticsCard';
import { MobileNav } from '@/components/ui/MobileNav';
import type { AthleteDTO, AthleteStatisticsDTO, Position } from '@/types/athlete';

export default function AthleteProfile() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [athlete, setAthlete] = useState<AthleteDTO | null>(null);
  const [statistics, setStatistics] = useState<AthleteStatisticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    position: '' as Position,
    jerseyNumber: 0,
    bio: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'ATHLETE') {
      router.push('/');
      return;
    }

    if (user) {
      loadProfileData();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const athleteId = user.id;
      const profileData = await getAthleteProfile(athleteId);
      
      setAthlete(profileData.athlete);
      setStatistics(profileData.statistics);
      
      // Initialize form data
      setFormData({
        name: profileData.athlete.name,
        position: profileData.athlete.position,
        jerseyNumber: profileData.athlete.jerseyNumber,
        bio: profileData.athlete.bio || '',
      });
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Falha ao carregar dados do perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jerseyNumber' ? parseInt(value) || 0 : value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.position) {
      errors.position = 'Position is required';
    }

    if (formData.jerseyNumber < 1 || formData.jerseyNumber > 99) {
      errors.jerseyNumber = 'Jersey number must be between 1 and 99';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !athlete) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      // Upload photo if changed
      let photoUrl = athlete.photoUrl;
      if (photoFile) {
        photoUrl = await uploadAthletePhoto(athlete.id, photoFile);
      }

      // Update profile
      const updatedAthlete = await updateAthleteProfile(athlete.id, {
        name: formData.name,
        position: formData.position,
        jerseyNumber: formData.jerseyNumber,
        bio: formData.bio,
        photoUrl,
      });

      setAthlete(updatedAthlete);
      setIsEditing(false);
      setSaveSuccess(true);
      setPhotoFile(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Falha ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (athlete) {
      setFormData({
        name: athlete.name,
        position: athlete.position,
        jerseyNumber: athlete.jerseyNumber,
        bio: athlete.bio || '',
      });
    }
    setPhotoFile(null);
    setFormErrors({});
    setIsEditing(false);
  };

  const formatPosition = (position: string): string => {
    return position.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const positionOptions = [
    { value: 'SETTER', label: 'Setter' },
    { value: 'OUTSIDE_HITTER', label: 'Outside Hitter' },
    { value: 'OPPOSITE', label: 'Opposite' },
    { value: 'MIDDLE_BLOCKER', label: 'Middle Blocker' },
    { value: 'LIBERO', label: 'Libero' },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error && !athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadProfileData}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!athlete || !statistics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                ← Voltar para Painel
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 md:pb-8">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              Profile updated successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Profile Information Card */}
        <Card className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Photo Section */}
            <div className="md:col-span-1">
              <div className="flex flex-col items-center">
                {isEditing ? (
                  <FileUpload
                    label="Profile Photo"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    preview={true}
                    onChange={setPhotoFile}
                    helperText="Max size: 5MB. Formats: JPG, PNG"
                  />
                ) : (
                  <>
                    {athlete.photoUrl ? (
                      <img
                        src={athlete.photoUrl}
                        alt={athlete.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                        <span className="text-4xl font-bold text-blue-600">
                          {athlete.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="md:col-span-2 space-y-4">
              {isEditing ? (
                <>
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={formErrors.name}
                    fullWidth
                    required
                  />

                  <Select
                    label="Position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    options={positionOptions}
                    error={formErrors.position}
                    fullWidth
                    required
                  />

                  <Input
                    label="Jersey Number"
                    name="jerseyNumber"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.jerseyNumber}
                    onChange={handleInputChange}
                    error={formErrors.jerseyNumber}
                    fullWidth
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-lg text-gray-900">{athlete.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Position</label>
                    <p className="mt-1 text-lg text-gray-900">{formatPosition(athlete.position)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Jersey Number</label>
                    <p className="mt-1 text-lg text-gray-900">#{athlete.jerseyNumber}</p>
                  </div>

                  {athlete.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Bio</label>
                      <p className="mt-1 text-gray-900">{athlete.bio}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Career Statistics */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Career Statistics</h2>
          
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatisticsCard
              title="Total Matches"
              value={statistics.totalMatches}
              subtitle="Career matches played"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Total Sets"
              value={statistics.totalSets}
              subtitle="Sets played"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatisticsCard
              title="Total Points"
              value={statistics.totalPoints}
              subtitle={`${statistics.averagePointsPerSet.toFixed(1)} per set`}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </div>

          {/* Performance Metrics */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-600 mb-1">Attack Efficiency</p>
                <p className="text-2xl font-bold text-blue-900">
                  {(statistics.attackEfficiency * 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-600 mb-1">Serve Efficiency</p>
                <p className="text-2xl font-bold text-green-900">
                  {(statistics.serveEfficiency * 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-600 mb-1">Reception Quality</p>
                <p className="text-2xl font-bold text-purple-900">
                  {statistics.receptionQuality.toFixed(2)}
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-600 mb-1">Block Efficiency</p>
                <p className="text-2xl font-bold text-orange-900">
                  {(statistics.blockEfficiency * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Total Errors</p>
                  <p className="text-xl font-semibold text-gray-900">{statistics.totalErrors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Points/Set</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {statistics.averagePointsPerSet.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {statistics.totalSets > 0 
                      ? (statistics.totalErrors / statistics.totalSets).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Point/Error Ratio</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {statistics.totalErrors > 0 
                      ? (statistics.totalPoints / statistics.totalErrors).toFixed(2)
                      : statistics.totalPoints.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
