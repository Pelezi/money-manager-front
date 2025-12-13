"use client";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { AccountType } from '@/types';
import { GroupMember, Category, Subcategory } from '@/types';

export interface AccountFormData {
  name: string;
  type: AccountType;
  initialBalance?: string;
  initialBalanceDateTime?: Dayjs;
  userId?: number;
  prepaidCategoryId?: number;
  prepaidSubcategoryId?: number;
  creditDueDay?: number;
  creditClosingDay?: number;
  debitMethod?: string;
  budgetMonthBasis?: 'PURCHASE_DATE' | 'DUE_DATE';
}

interface AccountFormProps {
  formData: AccountFormData;
  setFormData: (data: AccountFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading?: boolean;
  isEditing?: boolean;
  groupId?: number;
  groupMembers?: GroupMember[];
  categories: Category[];
  subcategories: Subcategory[];
  canManageAll?: boolean;
  currentUserId?: number;
}

export default function AccountForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading = false,
  isEditing = false,
  groupId,
  groupMembers = [],
  categories,
  subcategories,
  canManageAll = false,
  currentUserId,
}: AccountFormProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const muiTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  useEffect(() => {
    const updateDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    updateDarkMode();
    window.addEventListener('storage', updateDarkMode);
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('storage', updateDarkMode);
      observer.disconnect();
    };
  }, []);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ThemeProvider theme={muiTheme}>
        <FormControl fullWidth required margin="normal">
          <TextField
            label="Nome da Conta"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Carteira, Nubank, Conta Corrente"
            required
            focused
          />
        </FormControl>

        <FormControl focused fullWidth required margin="normal">
          <InputLabel id="account-type-label">Tipo de Conta</InputLabel>
          <Select
            labelId="account-type-label"
            value={formData.type}
            label="Tipo de Conta"
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
          >
            <MenuItem value="CASH">💵 Dinheiro</MenuItem>
            <MenuItem value="CREDIT">💳 Crédito</MenuItem>
            <MenuItem value="PREPAID">💰 Pré-pago</MenuItem>
          </Select>
        </FormControl>

        {formData.type === 'CREDIT' && (
          <>
            <FormControl focused fullWidth required margin="normal">
              <InputLabel id="debit-method-label">Forma de débito</InputLabel>
              <Select
                labelId="debit-method-label"
                value={formData.debitMethod}
                label="Forma de débito"
                onChange={e => setFormData({ ...formData, debitMethod: String(e.target.value) })}
              >
                <MenuItem value="INVOICE">Débito no pagamento da fatura</MenuItem>
                <MenuItem value="PER_PURCHASE">Débito em cada compra</MenuItem>
              </Select>
            </FormControl>

            <div className="grid grid-cols-2 gap-3">
              <FormControl fullWidth required margin="normal">
                <TextField
                  label="Dia de Fechamento da Fatura"
                  type="number"
                  slotProps={{ htmlInput: { min: 1, max: 31 } }}
                  value={formData.creditClosingDay ?? ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    const clamped = v ? Math.max(1, Math.min(31, v)) : undefined;
                    setFormData({ ...formData, creditClosingDay: clamped });
                  }}
                  placeholder="1"
                  required
                  focused
                />
              </FormControl>

              <FormControl fullWidth required margin="normal">
                <TextField
                  label="Dia de Vencimento da Fatura"
                  type="number"
                  slotProps={{ htmlInput: { min: 1, max: 31 } }}
                  value={formData.creditDueDay ?? ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    const clamped = v ? Math.max(1, Math.min(31, v)) : undefined;
                    setFormData({ ...formData, creditDueDay: clamped });
                  }}
                  placeholder="1"
                  required
                  focused
                />
              </FormControl>
            </div>

            {formData.debitMethod === 'PER_PURCHASE' && (
              <FormControl focused fullWidth required margin="normal">
                <InputLabel id="budget-month-basis-label">Mês de referência no orçamento</InputLabel>
                <Select
                  labelId="budget-month-basis-label"
                  value={formData.budgetMonthBasis ?? 'PURCHASE_DATE'}
                  label="Mês de referência no orçamento"
                  onChange={e => setFormData({ ...formData, budgetMonthBasis: e.target.value as 'PURCHASE_DATE' | 'DUE_DATE' })}
                >
                  <MenuItem value="PURCHASE_DATE">Mês da compra</MenuItem>
                  <MenuItem value="DUE_DATE">Mês do vencimento</MenuItem>
                </Select>
              </FormControl>
            )}
          </>
        )}

        {/* Conditional fields based on account type */}
        {(formData.type === 'PREPAID' || (formData.type === 'CREDIT' && formData.debitMethod === 'INVOICE')) && (
          <div className="grid grid-cols-2 gap-2">
            <FormControl focused fullWidth required margin="normal">
              <InputLabel id="prepaid-category-label">{formData.type === 'PREPAID' ? 'Categoria (Pré-pago)' : 'Categoria (Fatura)'}</InputLabel>
              <Select
                labelId="prepaid-category-label"
                value={formData.prepaidCategoryId ?? ''}
                label={formData.type === 'PREPAID' ? 'Categoria (Pré-pago)' : 'Categoria (Fatura)'}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setFormData({ ...formData, prepaidCategoryId: val, prepaidSubcategoryId: undefined });
                }}
              >
                <MenuItem value="">-- Escolha uma categoria --</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl focused fullWidth required margin="normal" disabled={!formData.prepaidCategoryId}>
              <InputLabel id="prepaid-subcategory-label">{formData.type === 'PREPAID' ? 'Subcategoria (Pré-pago)' : 'Subcategoria (Fatura)'}</InputLabel>
              <Select
                labelId="prepaid-subcategory-label"
                value={formData.prepaidSubcategoryId ?? ''}
                label={formData.type === 'PREPAID' ? 'Subcategoria (Pré-pago)' : 'Subcategoria (Fatura)'}
                onChange={(e) => setFormData({ ...formData, prepaidSubcategoryId: e.target.value ? Number(e.target.value) : undefined })}
              >
                <MenuItem value="">-- Escolha uma subcategoria --</MenuItem>
                {subcategories
                  .filter(s => s.categoryId === (formData.prepaidCategoryId ?? 0))
                  .map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>
        )}

        {groupId && (
          <FormControl focused fullWidth required margin="normal">
            <InputLabel id="account-owner-label">Dono da Conta</InputLabel>
            {canManageAll && !isEditing ? (
              <Select
                labelId="account-owner-label"
                value={formData.userId ?? ''}
                label="Dono da Conta"
                onChange={e => setFormData({ ...formData, userId: Number(e.target.value) })}
              >
                {groupMembers.map(member => (
                  <MenuItem key={member.userId} value={member.userId}>
                    {member.user?.firstName ? `${member.user.firstName} ${member.user.lastName}` : member.user?.email}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <TextField
                label="Dono da Conta"
                value={groupMembers.find(m => m.userId === (isEditing ? formData.userId : currentUserId))?.user?.firstName 
                  ? `${groupMembers.find(m => m.userId === (isEditing ? formData.userId : currentUserId))?.user?.firstName} ${groupMembers.find(m => m.userId === (isEditing ? formData.userId : currentUserId))?.user?.lastName}`
                  : groupMembers.find(m => m.userId === (isEditing ? formData.userId : currentUserId))?.user?.email || ''}
                disabled
                fullWidth
                focused
              />
            )}
          </FormControl>
        )}

        {!isEditing && (
          <>
            <FormControl focused fullWidth required margin="normal">
              <div className="relative">
                <TextField
                  label="Saldo Inicial"
                  type="text"
                  inputMode="numeric"
                  value={formData.initialBalance}
                  onChange={(e) => {
                    const raw = e.target.value || '';
                    const negative = raw.trim().startsWith('-');
                    const digits = raw.replace(/\D/g, '');
                    const cents = Number(digits || '0');
                    const formattedNumber = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const formatted = negative ? `-${formattedNumber}` : formattedNumber;
                    setFormData({ ...formData, initialBalance: formatted });
                  }}
                  onKeyDown={(e) => {
                    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                    if (allowed.includes(e.key)) return;
                    if (e.key === '-' || e.key === 'Subtract') return;
                    if (!/^\d$/.test(e.key)) e.preventDefault();
                  }}
                  placeholder="0,00"
                  required
                  focused
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = formData.initialBalance || '0,00';
                    const isNegative = current.startsWith('-');
                    const newValue = isNegative ? current.substring(1) : `-${current}`;
                    setFormData({ ...formData, initialBalance: newValue });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Alternar sinal"
                >
                  {(formData.initialBalance || '0,00').startsWith('-') ? (
                    <MinusCircle size={20} className="text-red-600 dark:text-red-400" />
                  ) : (
                    <PlusCircle size={20} className="text-green-600 dark:text-green-400" />
                  )}
                </button>
              </div>
            </FormControl>

            <FormControl fullWidth required margin="normal">
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DateTimePicker
                  label="Data e Hora do Saldo Inicial"
                  value={formData.initialBalanceDateTime}
                  onChange={(newValue: Dayjs | null) => {
                    if (newValue) {
                      setFormData({ ...formData, initialBalanceDateTime: newValue });
                    }
                  }}
                  format="DD/MM/YYYY HH:mm"
                  ampm={false}
                  slotProps={{
                    textField: {
                      focused: true,
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </FormControl>
          </>
        )}
      </ThemeProvider>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Conta')}
        </button>
      </div>
    </form>
  );
}
