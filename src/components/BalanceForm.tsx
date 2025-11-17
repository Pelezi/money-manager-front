"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import dayjs from 'dayjs';
import { createInUserTimezone } from '@/lib/timezone';

type Props = {
    accountId?: number;
    initialAmount?: string | number;
    initialDateTime?: Dayjs;
    onCancel?: () => void;
    onSave: (data: { amount: number; date?: string; time?: string }) => void;
    submitting?: boolean;
};

export default function BalanceForm({
    accountId,
    initialAmount = '0,00',
    initialDateTime,
    onCancel,
    onSave,
    submitting = false,
}: Props) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [amount, setAmount] = useState(() => typeof initialAmount === 'number' ? (initialAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (initialAmount || '0,00'));
    const [dateTime, setDateTime] = useState<Dayjs>(initialDateTime ?? createInUserTimezone());

    useEffect(() => {
        const updateDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        updateDarkMode();
        const observer = new MutationObserver(updateDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setAmount(typeof initialAmount === 'number' ? (initialAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (initialAmount || '0,00'));
    }, [initialAmount]);

    const formatBRLfromCents = (cents: number) => (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const normalizeToBRL = (value: string) => {
        const digits = value.replace(/\D/g, '');
        const cents = Number(digits || '0');
        return formatBRLfromCents(cents);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = normalizeToBRL(e.target.value);
        setAmount(formatted);
    };

    const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
        if (allowed.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
    };

    const muiTheme = createTheme({
        palette: { mode: isDarkMode ? 'dark' : 'light' },
    });

    const submit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const amountNumber = Number((amount || '0,00').replace(/\./g, '').replace(',', '.'));
        const dateInUtc = (dateTime as any).utc();
        const dateStr = dateInUtc.format('YYYY-MM-DD');
        const timeStr = dateInUtc.format('HH:mm:ss');
        onSave({ amount: amountNumber, date: dateStr, time: timeStr });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <ThemeProvider theme={muiTheme}>
                <FormControl focused fullWidth required margin="normal">
                    <TextField
                        label="Novo Saldo"
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={handleAmountChange}
                        onKeyDown={handleAmountKeyDown}
                        required
                        fullWidth
                        margin="normal"
                        placeholder="0,00"
                        focused
                    />
                </FormControl>

                <FormControl fullWidth required margin="normal">
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                        <DateTimePicker
                            label="Data e Hora"
                            value={dateTime as any}
                            onChange={(newValue: Dayjs | null) => {
                                if (newValue) setDateTime(newValue);
                            }}
                            format="DD/MM/YYYY HH:mm"
                            ampm={false}
                            slotProps={{ textField: { focused: true, required: true, fullWidth: true } }}
                        />
                    </LocalizationProvider>
                </FormControl>
                <div
                    className="sticky bottom-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur"
                    style={{
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)'
                    }}
                >
                    <div className="flex gap-2">
                        <button type="button" onClick={() => onCancel && onCancel()} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{submitting ? 'Salvando…' : 'Atualizar'}</button>
                    </div>
                </div>
            </ThemeProvider>
        </form>
    );
}
