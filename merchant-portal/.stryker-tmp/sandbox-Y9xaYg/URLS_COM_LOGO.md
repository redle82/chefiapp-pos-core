# URLs onde o logo do restaurante aparece

Com o servidor a correr (`pnpm --filter merchant-portal run dev`, porta **5175**), abre no browser:

| Página | URL | Onde ver o logo |
|-------|-----|------------------|
| **TPV (mínimo)** | http://localhost:5175/op/tpv | Canto superior esquerdo: círculo (logo ou fallback) + "TPV Mínimo — [nome]". **Nota:** pode ser preciso passar pelo ShiftGate (abrir turno) para ver o conteúdo. |
| **KDS (mínimo)** | http://localhost:5175/op/kds | Cabeçalho: círculo (logo ou fallback) + "KDS — Pedidos ativos". |
| **TPV (completo, dentro do AppStaff)** | http://localhost:5175/app/staff/home → modo TPV | Barra superior: logo + nome do restaurante (TPVHeader). |
| **KDS (dentro do AppStaff)** | http://localhost:5175/app/staff/home → modo KDS | Header do KitchenDisplay: logo + estado (Idle/Production). |
| **AppStaff (launcher)** | http://localhost:5175/app/staff/home | Top bar: logo + nome do modo. Boot screen (primeira vez): logo grande + nome. |
| **Web pública** | http://localhost:5175/public/sofia-gastrobar | Header: logo + nome do restaurante. (Slug pode variar: ver Config ou seed do Core.) |
| **Configuração → Identidade** | http://localhost:5175/config (ou Admin → Geral) | Campo "URL do logo" + pré-visualização. Aqui defines o logo; depois aparece no TPV, KDS, AppStaff e web pública. |

## Para ver a imagem do logo (e não só o fallback)

1. Em **Configuração → Identidade** (ou Admin → Geral), no campo **URL do logo**, coloca por exemplo:
   - **`/logo-restaurant-demo.png`** (logo de demonstração que está em `public/`)
   - ou qualquer URL pública de imagem (https://…).
2. Guarda. O logo passa a aparecer em todas as páginas da tabela acima (após refresh se necessário).

## Se não vires o logo no TPV ou KDS

- **TPV /op/tpv:** Confirma que passaste o ShiftGate (ex.: "Abrir Turno"). O logo fica junto ao título "TPV Mínimo — [nome]".
- **KDS /op/kds:** O logo fica à esquerda do título "KDS — Pedidos ativos". Se vires um círculo com a primeira letra do nome ou um ícone, é o **fallback** (normal quando ainda não há `logo_url` definido na Config).
