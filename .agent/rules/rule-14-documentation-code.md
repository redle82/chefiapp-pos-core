# LEI 14: Documentacao como Codigo

## MOTIVO

Codigo nao documentado e codigo que sera reescrito (ou abandonado).
Documentacao viva reduz onboarding e bugs.

## GATILHO

Ativado ao criar funcoes, classes, modulos ou endpoints.

## REGRAS OBRIGATORIAS

1. **Nomes descritivos:** `calculate_order_total()` > `calc()` > `x()`
2. **Funcoes pequenas:** Uma funcao, uma responsabilidade (max ~30 linhas)
3. **Docstrings obrigatorias:** Toda funcao publica DEVE ter docstring com:
   descricao, parametros, retorno, excecoes, exemplo
4. **README vivo:** Atualizar README.md sempre que a arquitetura mudar
5. **Sem codigo comentado:** Codigo morto vai pro git history, nao fica
   comentado poluindo o arquivo
6. **Sem TODO sem ticket:** Todo `TODO` deve referenciar um ticket/issue

## EXEMPLO ERRADO

```python
def calc(o, c=None):
    # TODO: fix later
    t = 0
    for i in o:
        t += i["p"] * i["q"]
    if c:
        t = t * 0.9  # 10% off
    return t

# def old_calc(o):
#     total = 0
#     for item in o:
#         total += item["price"]
#     return total
```

## EXEMPLO CORRETO

```python
def calculate_order_total(
    items: list[OrderItem],
    coupon: Coupon | None = None,
) -> Decimal:
    """Calcula o total de um pedido aplicando cupom opcional.

    Args:
        items: Lista de itens do pedido com preco e quantidade.
        coupon: Cupom de desconto opcional a ser aplicado.

    Returns:
        Total do pedido como Decimal com 2 casas.

    Raises:
        EmptyOrderError: Se a lista de itens estiver vazia.
        ExpiredCouponError: Se o cupom estiver expirado.

    Example:
        >>> items = [OrderItem(price=10.0, quantity=2)]
        >>> calculate_order_total(items)
        Decimal('20.00')
    """
    if not items:
        raise EmptyOrderError("Pedido deve ter ao menos 1 item")

    subtotal = sum(
        Decimal(str(item.price)) * item.quantity
        for item in items
    )

    if coupon:
        subtotal = coupon.apply(subtotal)

    return subtotal.quantize(Decimal("0.01"))
```
