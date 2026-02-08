# Setup Linear vs System Tree — mapa vs estrada

**Status:** CONTRATO ATIVO (decisão de produto/UX)
**Última revisão:** 2026-01-28

---

## 1. O que se queria (e faz sentido)

Modelo **GloriaFood / backoffice clássico**:

- Uma coluna lateral esquerda
- Tudo linear, visível, um item abaixo do outro
- Cada item = um setor / configuração / passo de instalação
- Fluxo natural: **Cardápio → Mesas → Pagamentos → TPV → KDS → Equipe → Horários → Pronto**

Isso **não** é interno, não é “core”, não é diagnóstico.
É **UX de configuração**, fluida, quase onboarding contínuo — e é isso que instala restaurante rápido.

---

## 2. Para que o System Tree existe

O **System Tree / Restaurant OS** **não** nasceu para ser o instalador.

Ele existe como:

- **Mapa cognitivo + mapa arquitetural + auditoria de estado**

Responde a:

- O restaurante está operável ou não?
- O Core está íntegro?
- Quais módulos estão instalados vs ativos?
- Onde existe risco?
- O que é soberano, opcional, dependente?

Ou seja: é um **“mapa do sistema”**, não um instalador.

Quem usa:

- Engenheiros, auditores, dono técnico, suporte enterprise.

Por isso não aparece em produto pequeno; aparece em ERPs grandes, sistemas industriais, B2B sério, infra (AWS, Kubernetes, etc.).

---

## 3. Onde está o desalinhamento

- O System Tree **não** resolve onboarding.
- **Não** acelera setup.
- **Não** substitui um menu operacional.
- **Não** guia o usuário leigo no dia a dia.

Ele responde **“onde estou”**, mas não responde bem **“o que faço agora”**.

- Visualmente: bonito, claro, elegante.
- Para setup: frio, analítico demais, pouco acionável.

O erro não é técnico; é **de posição na experiência**: misturámos mapa com estrada.

---

## 4. Decisão: onde cada um deve existir

- **System Tree**

  - **Não** deve ser a interface principal de configuração.
  - Deve ser: **modo avançado** / **“Sistema / Diagnóstico / Estado”** / aba para entender, auditar, vender B2B, demonstrar robustez.
  - Não é o que o restaurante usa todo dia.

- **Setup Linear / Backoffice Operacional**
  - É **outra coisa**, separada.
  - Estilo GloriaFood: sidebar esquerda simples, cada item com estado (incompleto | parcial | pronto), clique → tela direta, sem abstração, sem árvore mental.
  - **Isso** instala restaurante em 20 minutos.

---

## 5. Princípio: mesmo estado, nenhum manda no outro

- **Ambos** (System Tree e Backoffice Linear) **leem o mesmo estado** (runtime, setup_status, módulos).
- **Nenhum manda no outro.** O Backoffice Linear não cria decisões de sistema; só mostra estado, permite completar e recomenda o próximo passo.
- As **regras** continuam no Core, no Runtime e no System Tree. O Backoffice Linear **organiza o acesso**, não inventa lógica nova.

Isso é arquitetura adulta: mapa e estrada separados, mesma verdade por baixo.

---

## 6. Próximo passo (sem retrabalho pesado)

- **Manter** o System Tree como **“Visão do Sistema”**.
- **Criar** um **Backoffice Linear** separado.
- **Compartilhar** os mesmos dados por baixo (runtime, setup_status, módulos).
- UX simples em cima, arquitetura forte por baixo.

A estrutura exata do menu estilo GloriaFood (nomes, estados, dependências) e o que reaproveitar está em **[BACKOFFICE_LINEAR_SPEC.md](BACKOFFICE_LINEAR_SPEC.md)**.
