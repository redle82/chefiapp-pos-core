/**
 * SuppliersList - Lista de Fornecedores
 */
// @ts-nocheck


import React from 'react';
import type { Supplier } from '../../core/purchases/PurchaseEngine';

interface Props {
  suppliers: Supplier[];
}

export function SuppliersList({ suppliers }: Props) {
  if (suppliers.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
        <p>Nenhum fornecedor cadastrado</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {suppliers.map((supplier) => (
        <div
          key={supplier.id}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
            {supplier.name}
          </h3>
          {supplier.contactName && (
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
              Contato: {supplier.contactName}
            </p>
          )}
          {supplier.email && (
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
              Email: {supplier.email}
            </p>
          )}
          {supplier.phone && (
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
              Telefone: {supplier.phone}
            </p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#666' }}>
            Lead time: {supplier.leadTimeDays} dias
          </p>
        </div>
      ))}
    </div>
  );
}
