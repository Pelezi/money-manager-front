export interface DefaultCategory {
  name: string;
  type: 'EXPENSE' | 'INCOME';
  subcategories: string[];
}

export const defaultCategories: DefaultCategory[] = [
  {
    name: 'Moradia',
    type: 'EXPENSE',
    subcategories: ['Aluguel', 'Condomínio', 'Móveis', 'Faxina', 'Manutenção', 'Outros']
  },
  {
    name: 'Contas & Serviços',
    type: 'EXPENSE',
    subcategories: ['Energia', 'Água', 'Gás', 'Internet', 'Celular', 'Outros']
  },
  {
    name: 'Alimentação',
    type: 'EXPENSE',
    subcategories: ['Mercado', 'Feira', 'Carne', 'Lanches', 'Comer fora', 'Outros']
  },
  {
    name: 'Transporte',
    type: 'EXPENSE',
    subcategories: ['Ônibus', 'Uber / Apps', 'Combustível', 'Outros']
  },
  {
    name: 'Saúde',
    type: 'EXPENSE',
    subcategories: ['Plano de saúde', 'Consulta', 'Farmácia', 'Emergência', 'Outros']
  },
  {
    name: 'Educação',
    type: 'EXPENSE',
    subcategories: ['Livros', 'Cursos', 'Outros']
  },
  {
    name: 'Lazer & Entretenimento',
    type: 'EXPENSE',
    subcategories: ['Cinema', 'Jogos', 'Música', 'Eventos', 'Outros']
  },
  {
    name: 'Pessoal',
    type: 'EXPENSE',
    subcategories: ['Roupas', 'Auto cuidado', 'Outros']
  },
  {
    name: 'Presentes & Doações',
    type: 'EXPENSE',
    subcategories: ['Presentes', 'Dízimo', 'Oferta', 'Igreja', 'Outros']
  },
  {
    name: 'Viagem',
    type: 'EXPENSE',
    subcategories: ['Passagem', 'Hospedagem', 'Alimentação', 'Transporte', 'Lazer', 'Outros']
  },
  {
    name: 'Dívidas & Obrigações',
    type: 'EXPENSE',
    subcategories: ['Impostos', 'Taxas', 'Empréstimos', 'Juros', 'Outros']
  },
  {
    name: 'Outros',
    type: 'EXPENSE',
    subcategories: ['Outros']
  },
  {
    name: 'Salários',
    type: 'INCOME',
    subcategories: ['Salário principal', 'Hora extra', 'Bônus', 'Outros']
  },
  {
    name: 'Entradas Eventuais',
    type: 'INCOME',
    subcategories: ['Presentes', 'Reembolso', 'Empréstimos recebidos', 'Ofertas', 'Outros']
  },
  {
    name: 'Outros',
    type: 'INCOME',
    subcategories: ['Outros']
  }
];
