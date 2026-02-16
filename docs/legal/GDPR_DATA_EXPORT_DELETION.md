# Exportação e eliminação de dados (GDPR)

Processo para exercício dos direitos de acesso/portabilidade e de eliminação pelos titulares dos dados.

---

## Exportar os meus dados (direito de acesso / portabilidade)

**Como solicitar:** O utilizador pode usar o botão "Exportar os meus dados" na área de conta da aplicação (Config > Dados e privacidade) ou contactar o responsável pelo tratamento através do endereço indicado na aplicação ou no site.

**O que é devolvido:** Um pacote de dados que inclui, consoante o contexto (restaurante/utilizador):

- Dados da conta e do perfil (email, nome, restaurante associado)
- Dados do restaurante (identidade, localização, configuração)
- Pedidos e transações no período de retenção
- Ementa e produtos
- Membros da equipa e respetivos papéis

O formato pode ser JSON ou ZIP com ficheiros estruturados. O prazo de resposta é de 30 dias (máximo legal em contexto GDPR).

**Implementação técnica (futura):** Endpoint autenticado (ex.: `GET /api/me/export` ou `GET /api/restaurants/:id/export`) que gera o pacote e devolve link de download ou anexo. Enquanto não existir endpoint, a equipa processa o pedido manualmente após contacto.

---

## Eliminar conta / dados (direito ao esquecimento)

**Como solicitar:** O utilizador pode usar o botão "Eliminar conta / dados" na área de conta (Config > Dados e privacidade), confirmar a ação no modal, e o pedido é registado. Alternativamente, pode contactar o responsável pelo tratamento.

**O que é eliminado:** Após confirmação e verificação de identidade:

- Conta de utilizador e sessões
- Associação utilizador–restaurante
- Se for o único owner do restaurante e solicitar eliminação do restaurante: dados do restaurante, pedidos, ementa, membros (cascade conforme schema da base de dados)

**Retenção legal:** Dados que a lei obrigue a reter (ex.: faturação, fiscais) podem ser mantidos pelo tempo mínimo legal; o resto é apagado.

**Implementação técnica (futura):** Endpoint autenticado (ex.: `POST /api/me/delete-account` ou `POST /api/restaurants/:id/delete`) com confirmação (ex.: token ou password). Enquanto não existir, o processo é manual: registo do pedido e execução de scripts de eliminação com cascade documentados.

---

## Contacto

O endereço de contacto do responsável pelo tratamento deve estar indicado na aplicação (ex.: Config, rodapé) e na Política de Privacidade (`/legal/privacy`).
