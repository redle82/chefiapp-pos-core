# LEI 11: Consistencia de API

## MOTIVO

APIs inconsistentes confundem o frontend, dificultam documentacao e geram
bugs de integracao.

## GATILHO

Ativado quando criar ou alterar qualquer rota/endpoint.

## CONVENCAO OBRIGATORIA

| Verbo  | Acao      | Rota exemplo        | Status |
| ------ | --------- | ------------------- | ------ |
| GET    | Listar    | /api/v1/products    | 200    |
| GET    | Detalhe   | /api/v1/products/42 | 200    |
| POST   | Criar     | /api/v1/products    | 201    |
| PATCH  | Atualizar | /api/v1/products/42 | 200    |
| DELETE | Remover   | /api/v1/products/42 | 204    |

## FORMATO DE ERRO PADRAO

Toda API DEVE retornar erros no formato:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Produto com ID 42 nao encontrado.",
    "field": null,
    "request_id": "req_abc123"
  }
}
```

## EXEMPLO ERRADO

```python
@router.get("/getProducts")
async def get_products():
    prods = await db.fetch_all("SELECT * FROM product")
    return prods  # lista crua, sem envelope

@router.post("/product/new")
async def new_product(data: dict):
    # POST retornando 200 em vez de 201
    result = await db.execute(...)
    return {"ok": True}
```

## EXEMPLO CORRETO

```python
@router.get("/api/v1/products")
async def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    products = await ProductService.list(page, per_page)
    return {
        "data": products,
        "meta": {"page": page, "per_page": per_page}
    }

@router.post("/api/v1/products", status_code=201)
async def create_product(payload: ProductCreate):
    product = await ProductService.create(payload)
    return {"data": product}
```
