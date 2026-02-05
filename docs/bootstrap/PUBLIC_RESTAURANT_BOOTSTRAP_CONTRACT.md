# Contrato de Bootstrap da Página Web Pública do Restaurante

**Âmbito:** Página web do restaurante (restaurant.com, QR público, link de campanha). Bootstrap **informativo/comercial**, subordinado e mais curto que o bootstrap operacional do Restaurant OS.

**Regra de segurança:** A web pública nunca pode desbloquear operação real. Toda operação real passa pelo Restaurant OS bootstrap.

---

## 1. Quem e o quê

- **Visitante** (não operador): alguém abre a página por URL, QR ou campanha.
- **Não existe operador** neste contexto.
- O bootstrap da página web **não governa** TPV, KDS ou Core; governa apenas o que o público pode **ver** ou **iniciar**.

---

## 2. Onde começa o bootstrap da página web

No **primeiro contacto** com o identificador público do restaurante.

**Exemplos de identificador:**

- slug (ex.: `/sofia-gastrobar`)
- `restaurant_id` público
- domínio dedicado

**Ponto técnico:** `PublicRestaurantContext.init()` (ou equivalente) antes de:

- mostrar menu
- mostrar horário
- mostrar CTA
- mostrar botões de pedido

---

## 3. O que este bootstrap decide (e só isso)

O bootstrap da página web responde **apenas** perguntas públicas:

1. Restaurante existe?
2. Está ativo ou suspenso?
3. Está aberto agora?
4. Que módulos públicos estão ativos?
5. Qual o modo permitido ao visitante?

**Nada além disso.**

---

## 4. Estado canónico: PublicRestaurantBootstrapState

```ts
type PublicRestaurantBootstrapState = {
  exists: boolean;
  visibility: "publico" | "privado" | "suspenso";
  openStatus: "aberto" | "fechado";
  publicModules: {
    menu: boolean;
    reservas: boolean;
    pedidos: boolean;
    jogo: boolean;
  };
  orderMode: "web-only" | "external" | "disabled";
};
```

- **exists:** Restaurante existe no sistema.
- **visibility:** Visível ao público, privado ou suspenso.
- **openStatus:** Aberto ou fechado (ex.: horário).
- **publicModules:** Quais módulos públicos estão ativos (menu, reservas, pedidos, jogo).
- **orderMode:** Pedidos só pela web; externos (delivery); ou desativados.

Este estado **governa toda a página** pública.

---

## 5. Onde termina o bootstrap da página web

Termina quando a página passa a **renderizar conteúdo estável**.

Depois disso:

- navegação
- scroll
- interações
- animações

**Não alteram** o bootstrap e **não reavaliam** o estado (até reconexão ou refresh explícito, conforme política).

---

## 6. O que NÃO é bootstrap na página web

- Mostrar promoções
- Jogar mini-game
- Clicar no menu
- Abrir modal
- Fazer pedido (isso já é fluxo)

Tudo isso **consome** o bootstrap; não o define.

---

## 7. Relação com o bootstrap do Restaurant OS

Os dois bootstraps **nunca se misturam**.

|                  | Web Pública | Restaurant OS |
| ---------------- | ----------- | ------------- |
| Quem             | Visitante   | Operador      |
| Tipo             | Informativo | Operacional   |
| Escreve Core?    | Não         | Sim           |
| Risco financeiro | Não         | Sim           |
| Bootstrap        | Leve        | Soberano      |

---

## 8. Regra de segurança (obrigatória)

- **Nenhuma decisão operacional** pode ser tomada na página web pública.
- **Toda operação real** passa pelo Restaurant OS bootstrap.

---

## 9. Referências

- Bootstrap operacional (soberano): [RESTAURANT_BOOTSTRAP_CONTRACT.md](RESTAURANT_BOOTSTRAP_CONTRACT.md)
- Mapa de todos os bootstraps: [BOOTSTRAP_MAP.md](BOOTSTRAP_MAP.md)
