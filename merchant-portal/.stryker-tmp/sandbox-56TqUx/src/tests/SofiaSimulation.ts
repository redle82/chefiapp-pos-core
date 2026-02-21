// @ts-nocheck
import { generatePurchaseDraft } from "../core/inventory/PurchaseReflex";
import { SOFIA_INVENTORY } from "../core/inventory/SofiaModel";

// ------------------------------------------------------------------
// 🧪 SOFIA GASTROBAR - OPERATIONAL SIMULATION
// ------------------------------------------------------------------

const runSimulation = () => {
  console.log("🏟️ INICIANDO SIMULAÇÃO OPERACIONAL: SOFIA GASTROBAR\n");

  // ---------------------------------------------------
  // SCENARIO 1: TERÇA-FEIRA (Ansiedade de Bebidas)
  // ---------------------------------------------------
  console.log("📅 CENÁRIO 1: TERÇA-FEIRA (Ansiedade)");
  // Mock signal: None (Inventory is low but it's not Wednesday)
  const tuesdayDraft = generatePurchaseDraft(
    "staff-jose",
    [],
    [
      {
        item: SOFIA_INVENTORY.find((i) => i.id === "keg-super-bock")!,
        qty: 2,
        reason: "impulse_panic",
      },
    ],
  );

  console.log(`- Tentativa: Comprar 2 Barris na Terça.`);
  console.log(`- Resultado: ${tuesdayDraft.items[0].reason}`);
  console.log(`- Witness Required: ${tuesdayDraft.requiresWitness}`);
  console.log(
    `- Panic Value: €${(tuesdayDraft.panicWastePotentialEur / 100).toFixed(
      2,
    )}\n`,
  );

  // ---------------------------------------------------
  // SCENARIO 2: QUARTA-FEIRA (Ritual Sagrado)
  // ---------------------------------------------------
  console.log("📅 CENÁRIO 2: QUARTA-FEIRA (Ritual)");
  // Mock signal: System generates "Calendar Ritual" signal
  const wednesdaySignals = [
    {
      itemId: "keg-super-bock",
      currentLevel: 2,
      parLevel: 4,
      unit: "un",
      reason: "calendar",
      timestamp: Date.now(),
    },
  ];

  const wednesdayDraft = generatePurchaseDraft(
    "staff-maria",
    wednesdaySignals,
    [],
  );

  console.log(`- Situação: Quarta-feira 10:00.`);
  console.log(`- Sistema Sugere: ${wednesdayDraft.items[0].quantity}x Barris.`);
  console.log(`- Motivo: ${wednesdayDraft.items[0].reason}`); // Should be calendar_ritual
  console.log(
    `- Status: ${
      wednesdayDraft.requiresWitness ? "TRAVADO" : "LIBERADO (Verde)"
    }\n`,
  );

  // ---------------------------------------------------
  // SCENARIO 3: PIZZA (Biologia vs Medo)
  // ---------------------------------------------------
  console.log("🍕 CENÁRIO 3: PIZZA (O Freio Metabólico)");
  const pizzaItem = SOFIA_INVENTORY.find(
    (i) => i.id === "base-pizza-artesanal",
  )!;

  // Sub-case A: Necesidade Real (Stock 15, Critical 20)
  console.log(
    `- Estoque Atual: ${pizzaItem.currentStock} (Crítico: ${pizzaItem.lifecycle.criticalLevel})`,
  );

  // Sub-case B: Tentativa de Excesso (Buy +50, MaxSafe 60)
  // Current 15 + Buy 50 = 65. Max Safe is 60.
  const hoardingDraft = generatePurchaseDraft(
    "staff-jose",
    [],
    [
      { item: pizzaItem, qty: 50, reason: "event_prep" }, // Intent: "Event"
    ],
  );

  console.log(`- Tentativa: Comprar 50 pizzas (Justificativa: 'Evento')`);
  console.log(
    `- Estoque Projetado: ${15 + 50} (Teto Seguro: ${
      pizzaItem.lifecycle.maxSafeStock
    })`,
  );
  console.log(`- Veredito do Sistema: ${hoardingDraft.items[0].reason}`); // Should be overridden to impulse_panic?
  console.log(
    `- Aviso: "Estoque acima do teto de segurança. Risco de validade."\n`,
  );

  // ---------------------------------------------------
  // SCENARIO 4: AUDITORIA (A Verdade Física)
  // ---------------------------------------------------
  console.log("🕵️ CENÁRIO 4: RITUAL DE CONTAGEM");

  // Mock date to Wednesday for the test context if possible, or just rely on logic
  const missions = generateCountMissions(SOFIA_INVENTORY);
  console.log(`- Missões Geradas Hoje: ${missions.length}`);
  missions.forEach((m) => {
    console.log(
      `  > [${m.role.toUpperCase()}] Contar ${m.itemName} (${m.reason})`,
    );
  });
  console.log("");
};

runSimulation();
