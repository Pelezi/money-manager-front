'use client';

import { InvitationList } from '@/components/NotificationComponents';
import { useTranslations } from 'next-intl';

export default function InvitationsPage() {
  const t = useTranslations('invitations');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('description')}
        </p>
      </div>
      <InvitationList />
    </div>
  );
}
