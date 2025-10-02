import React from 'react';
import { Card } from '../../components/ui/card';

/**
 * Admin Settings Page - ADMIN Role Only
 *
 * System configuration and settings (placeholder)
 */

export const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>
      <Card className="p-6">
        <p className="text-gray-600">System settings will be configured here</p>
      </Card>
    </div>
  );
};

export default SettingsPage;
