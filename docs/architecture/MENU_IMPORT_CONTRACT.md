# Menu Import Contract - CSV Schema

> **Propósito**: Define o formato oficial de CSV para importação de menu no ChefIApp.

---

## Schema

| Campo | Header CSV | Obrigatório | Tipo | Validação |
|-------|-----------|-------------|------|-----------|
| Categoria | `categoria` | ✅ | string | max 50 chars |
| Produto | `produto` | ✅ | string | max 100 chars |
| Preço | `preco` | ✅ | number | > 0, max 2 decimais |
| Descrição | `descricao` | ❌ | string | max 500 chars |
| Ativo | `ativo` | ❌ | boolean | default: true |
| IVA | `iva` | ❌ | number | 0-100, default: 23 |

---

## Exemplo Válido

```csv
categoria,produto,preco,descricao,ativo,iva
Entradas,Coxinha,3.50,Frango desfiado,true,23
Entradas,Pastel,4.00,Carne moída,true,23
Entradas,Rissol,3.50,,true,23
Bebidas,Coca-Cola 350ml,5.00,,true,23
Bebidas,Guaraná Lata,4.50,,true,23
Bebidas,Água 500ml,2.50,,true,6
Principais,X-Burger,18.90,Hambúrguer artesanal com bacon,true,23
Principais,X-Salada,16.90,Hambúrguer com salada fresca,true,23
Sobremesas,Pudim,6.00,Pudim de leite condensado,true,23
```

---

## Headers Alternativos Aceitos

O sistema aceita variações comuns:

| Campo | Headers aceitos |
|-------|----------------|
| categoria | `categoria`, `category`, `Categoria`, `Category` |
| produto | `produto`, `product`, `nome`, `name`, `Produto`, `Product` |
| preco | `preco`, `price`, `valor`, `Preco`, `Price`, `preço` |
| descricao | `descricao`, `description`, `desc`, `Descricao`, `Description` |
| ativo | `ativo`, `active`, `enabled`, `Ativo`, `Active` |
| iva | `iva`, `vat`, `tax`, `IVA`, `VAT` |

---

## Regras de Validação

### Erros (bloqueiam importação da linha)

| Código | Condição | Mensagem |
|--------|----------|----------|
| `E001` | categoria vazia | "Categoria é obrigatória" |
| `E002` | produto vazio | "Nome do produto é obrigatório" |
| `E003` | preço não numérico | "Preço deve ser um número" |
| `E004` | preço <= 0 | "Preço deve ser maior que zero" |
| `E005` | preço > 10000 | "Preço excede o limite (10000€)" |

### Warnings (não bloqueiam, mas alertam)

| Código | Condição | Mensagem |
|--------|----------|----------|
| `W001` | produto duplicado na categoria | "Produto duplicado (será ignorado)" |
| `W002` | descrição muito longa | "Descrição truncada para 500 caracteres" |
| `W003` | IVA não padrão | "IVA incomum: X%" |

---

## Encoding

- UTF-8 preferido
- Sistema tenta detectar encoding automaticamente
- Fallback: ISO-8859-1 (Latin-1)

---

## Separadores Aceitos

| Tipo | Caractere |
|------|-----------|
| Coluna | `,` (vírgula) ou `;` (ponto-vírgula) |
| Decimal | `.` (ponto) ou `,` (vírgula) |

---

## Comportamento de Importação

### Categorias

- Criadas automaticamente se não existirem
- Matching case-insensitive
- Trim de espaços

### Produtos

- Duplicados na mesma categoria são ignorados
- Produtos com mesmo nome em categorias diferentes são permitidos

---

## Template CSV

Download disponível em: `/assets/templates/menu-import-template.csv`

```csv
categoria,produto,preco,descricao,ativo,iva
Entradas,Nome do produto,0.00,Descrição opcional,true,23
```

---

## Limites

| Limite | Valor |
|--------|-------|
| Tamanho máximo do arquivo | 5MB |
| Linhas máximas | 1000 |
| Categorias máximas | 50 |
| Produtos por categoria | 200 |
