"use client";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

import { useEffect, useState } from 'react';
import { accountService } from '@/services/accountService';
import { groupService } from '@/services/groupService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { Account } from '@/types';
import { GroupMember } from '@/types';
import { Category, Subcategory } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import AccountForm, { AccountFormData } from '@/components/AccountForm';

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = Number(params.id);
  
  const [account, setAccount] = useState<Account | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'CASH',
    userId: undefined,
    prepaidCategoryId: undefined,
    prepaidSubcategoryId: undefined,
    creditDueDay: 1,
    creditClosingDay: 1,
    debitMethod: 'INVOICE',
  });

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await accountService.getById(accountId);
      setAccount(data);

      // Load group members if it's a group account
      if (data.groupId) {
        const members = await groupService.getMembers(data.groupId);
        setGroupMembers(members);
      }

      // Load categories
      const cats = await categoryService.getAll(data.groupId ? data.groupId : undefined);
      setCategories(cats);

      // Load subcategories
      const subs = await subcategoryService.getAll(data.groupId ? data.groupId : undefined);
      setSubcategories(subs);

      // Determine prepaid category from account.subcategoryId
      let prepaidCategoryId: number | undefined = undefined;
      if (data.subcategoryId) {
        const found = subs.find(s => s.id === data.subcategoryId);
        if (found) prepaidCategoryId = found.categoryId;
      }

      setFormData({
        name: data.name,
        type: data.type,
        userId: data.userId,
        prepaidCategoryId: prepaidCategoryId,
        prepaidSubcategoryId: data.subcategoryId ?? undefined,
        creditDueDay: data.creditDueDay ?? 1,
        creditClosingDay: data.creditClosingDay ?? 1,
        debitMethod: data.debitMethod ?? 'INVOICE',
      });
    } catch (error) {
      console.error('Failed to load account:', error);
      toast.error('Erro ao carregar conta');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updatePayload: any = {
        name: formData.name,
        type: formData.type,
      };

      // If PREPAID, send selected subcategory id (or null to disconnect)
      if (formData.type === 'PREPAID') {
        updatePayload.subcategoryId = formData.prepaidSubcategoryId ?? null;
        updatePayload.creditDueDay = null;
        updatePayload.creditClosingDay = null;
        updatePayload.debitMethod = null;
      }

      // If CREDIT, send creditDueDay and debitMethod (if present)
      if (formData.type === 'CREDIT') {
        if (formData.creditDueDay !== undefined) updatePayload.creditDueDay = formData.creditDueDay;
        if (formData.creditClosingDay !== undefined) updatePayload.creditClosingDay = formData.creditClosingDay;
        if (formData.debitMethod !== undefined) updatePayload.debitMethod = formData.debitMethod;
        // If debit method is INVOICE, allow assigning a subcategory (invoice categorization)
        if (formData.debitMethod === 'INVOICE') {
          updatePayload.subcategoryId = formData.prepaidSubcategoryId ?? null;
        } else {
          updatePayload.subcategoryId = null;
        }
      }

      await accountService.update(accountId, updatePayload);
      toast.success('Conta atualizada com sucesso!');
      router.back();
    } catch (error) {
      console.error('Failed to update account:', error);
      toast.error('Erro ao atualizar conta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Conta não encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Conta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Atualize as informações da sua conta
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <AccountForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            loading={saving}
            isEditing={true}
            groupId={account.groupId}
            groupMembers={groupMembers}
            categories={categories}
            subcategories={subcategories}
            canManageAll={false}
            currentUserId={account.userId}
          />
        </div>
      </div>
    </div>
  );
}
