"use client";

import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { createInUserTimezone } from '@/lib/timezone';
dayjs.extend(timezone);

import { useEffect, useState } from 'react';
import { accountService } from '@/services/accountService';
import { groupService } from '@/services/groupService';
import { categoryService } from '@/services/categoryService';
import { subcategoryService } from '@/services/subcategoryService';
import { GroupMember } from '@/types';
import { Category, Subcategory } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import AccountForm, { AccountFormData } from '@/components/AccountForm';

export default function CreateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId') ? Number(searchParams.get('groupId')) : undefined;
  
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'CASH',
    initialBalance: '0,00',
    initialBalanceDateTime: createInUserTimezone(),
    userId: undefined,
    prepaidCategoryId: undefined,
    prepaidSubcategoryId: undefined,
    creditDueDay: 1,
    creditClosingDay: 1,
    debitMethod: 'INVOICE',
  });

  useEffect(() => {
    loadInitialData();
  }, [groupId]);

  const loadInitialData = async () => {
    try {
      // Load categories
      const cats = await categoryService.getAll(groupId);
      setCategories(cats);

      // Load subcategories
      const subs = await subcategoryService.getAll(groupId);
      setSubcategories(subs);

      // Load group members if it's a group account
      if (groupId) {
        const members = await groupService.getMembers(groupId);
        setGroupMembers(members);
        
        // Get current user (assuming from first member or similar logic)
        // You may need to adjust this based on your auth implementation
        if (members.length > 0) {
          setCurrentUserId(members[0].userId);
          setFormData(prev => ({ ...prev, userId: members[0].userId }));
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Build payload carefully (avoid sending Dayjs objects directly)
      const amountNumber = Number((formData.initialBalance || '0,00').replace(/\./g, '').replace(',', '.'));
      const basePayload: any = {
        name: formData.name,
        type: formData.type,
        initialBalance: amountNumber,
      };

      if (groupId) basePayload.groupId = groupId;
      if (groupId && formData.userId) basePayload.userId = formData.userId;

      // Include initial balance datetime if supported
      if (formData.initialBalanceDateTime && typeof formData.initialBalanceDateTime.toDate === 'function') {
        basePayload.initialBalanceDate = (formData.initialBalanceDateTime as Dayjs).toDate();
      }

      // PREPAID: include subcategory id
      if (formData.type === 'PREPAID' && formData.prepaidSubcategoryId) {
        basePayload.subcategoryId = formData.prepaidSubcategoryId;
      }

      // CREDIT: include due day and debit method
      if (formData.type === 'CREDIT') {
        if (formData.creditDueDay) {
          basePayload.creditDueDay = formData.creditDueDay;
        }
        if (formData.creditClosingDay) {
          basePayload.creditClosingDay = formData.creditClosingDay;
        }
        if (formData.debitMethod) {
          basePayload.debitMethod = formData.debitMethod;
        }
        // If invoice debit method, allow category/subcategory to be set for invoice accounting
        if (formData.debitMethod === 'INVOICE' && formData.prepaidSubcategoryId) {
          basePayload.subcategoryId = formData.prepaidSubcategoryId;
        }
      }

      await accountService.create(basePayload);
      toast.success('Conta criada com sucesso!');
      router.back();
    } catch (error) {
      console.error('Failed to create account:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

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
            Nova Conta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie uma nova conta para gerenciar suas finanças
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <AccountForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            loading={loading}
            isEditing={false}
            groupId={groupId}
            groupMembers={groupMembers}
            categories={categories}
            subcategories={subcategories}
            canManageAll={true}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}
