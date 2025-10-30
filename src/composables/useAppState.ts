export function useAppState() {
  const currentYear = useState('currentYear', () => new Date().getFullYear())
  const selectedMonth = useState('selectedMonth', () => new Date().getMonth() + 1)

  return {
    currentYear,
    selectedMonth
  }
}
