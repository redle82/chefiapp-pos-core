# Mapa de Contratos Futuros (Future Contracts Map)

**Propósito:** Mapear as leis operacionais que ainda não foram escritas, mas que existem na realidade física de um restaurante.
**Objetivo:** Antecipar a "dor" antes que ela ocorra, transformando problemas implícitos em contratos explícitos.
**Status:** PROPOSTA para evolução do Pilot.

---

## 1. O Contrato da Imutabilidade do Turno (The Saturday Night Update Law)

**A Dor:**
É sábado, 20:30. O restaurante está cheio. Um update automático corre em background. O schema do banco muda. O App do garçom (v1) tenta falar com o Core (v2). Tudo quebra.
**A Lei Futura (CORE_IMMUTABLE_SHIFT_CONTRACT):**

- **Regra:** O Runtime Version é **travado** no momento da abertura do Caixa/Turno.
- **Enforcement:** O sistema rejeita qualquer update (hotfix, code push, docker pull) se `shift_status = OPEN`.
- **Exceção:** "Nuclear Fix" autorizado manualmente pelo Dono com senha de admin.

## 2. O Contrato de Vinculação de Hardware (The Hardware Binding Law)

**A Dor:**
Um garçom esperto descobre como copiar o `localStorage` ou o token de sessão para o telemóvel dele. Ele agora tem um "Terminal Fantasma" clonado. Ele lança pedidos, cancela itens e rouba o caixa. O sistema acha que foi o terminal oficial.
**A Lei Futura (CORE_HARDWARE_BINDING_CONTRACT):**

- **Regra:** A Identidade do Terminal não é apenas um ID lógico. É vinculada a uma impressão digital do hardware (GPU, Canvas, Serial, MAC Address).
- **Enforcement:** Se a assinatura de hardware mudar no meio da sessão, o token é revogado imediatamente e um alerta de segurança é disparado.

## 3. O Protocolo de Soberania Fiscal Offline (The Fiscal Printer Protocol)

**A Dor:**
A Internet cai. O cliente quer pagar e ir embora. A lei exige a emissão de fatura fiscal _na hora_. O Core está na Cloud (ou o Docker local travou). O garçom não consegue emitir. O cliente vai embora sem pagar ou o restaurante opera ilegalmente.
**A Lei Futura (CORE_FISCAL_CONTINGENCY_CONTRACT):**

- **Regra:** Se o Core Soberano estiver inacessível, o Terminal TPV entra em "Modo de Contingência Fiscal".
- **Mecanismo:** O TPV tem autoridade delegada limitada (ex: até 50 faturas ou 5.000€) para assinar off-line e sincronizar depois.
- **Risco:** Assume-se o risco de colisão de sequencial fiscal em troca de não parar a operação.

## 4. O Contrato de Roteamento Físico (The Kitchen Physics Law)

**A Dor:**
A Chapa (Burgers) está a arder com 50 pedidos. A Salada (Frios) está vazia. O KDS continua a mandar Burgers para a tela da Chapa e ignorar a capacidade humana. A cozinha colapsa não por falta de staff, mas por engarrafamento lógico.
**A Lei Futura (CORE_PHYSICAL_ROUTING_CONTRACT):**

- **Regra:** O roteamento para KDS não é apenas por "Categoria" (Bebida vai para Bar), mas por "Capacidade de Estação".
- **Mecanismo:** Load Balancing físico. Se a Chapa estourar SLA, o sistema avisa o gerente ou redireciona itens compatíveis para outra estação de apoio.

## 5. A Lei da Autoridade de Dados (The "My Menu" Problem)

**A Dor:**
O dono do restaurante passa 10 horas tirando fotos lindas e escrevendo descrições poéticas para o menu no ChefIApp. No dia seguinte, a integração com o ERP roda e sobrescreve tudo com "HAMBURGUER X1 - COD 993" e sem foto. O dono cancela o ChefIApp.
**A Lei Futura (CORE_DATA_AUTHORITY_LAYERS):**

- **Regra:** Cada campo de cada entidade tem um "Owner" definido.
- **Camadas:**
  - Preço/Stock -> ERP (Sincronizado)
  - Nome Comercial/Foto/Descrição -> ChefIApp (Local Sovereign)
- **Enforcement:** O SyncEngine rejeita updates externos em campos protegidos pela soberania local.

---

## Próximos Passos

Estes contratos não bloqueiam o Piloto inicial, mas bloquearão a escala.
Recomendação: Implementar #1 (Imutabilidade do Turno) e #5 (Autoridade de Dados) logo após a estabilização do piloto.
