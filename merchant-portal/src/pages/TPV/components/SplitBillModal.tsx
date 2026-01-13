/**
 * SplitBillModal - Modal de Divisão de Conta por Partes Iguais
 * 
 * SEMANA 2 - Tarefa 3.3
 * 
 * Objetivo: Permitir dividir conta por partes iguais e registrar pagamento de uma pessoa por vez
 */

import React, { useState, useMemo } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

export type PaymentMethod = 'cash' | 'card' | 'pix';

interface SplitBillModalProps {
  orderId: string;
  restaurantId: string;
  orderTotal: number; // em centavos
  paidAmount: number; // em centavos (já pago até agora)
  onPayPartial: (amountCents: number, method: PaymentMethod) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  orderId,
  restaurantId,
  orderTotal,
  paidAmount,
  onPayPartial,
  onCancel,
  loading = false,
}) => {
  const [numberOfPeople, setNumberOfPeople] = useState<number>(2);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  // Calcular valores
  const remainingAmount = orderTotal - paidAmount;
  const amountPerPerson = useMemo(() => {
    if (numberOfPeople <= 0) return 0;
    // Dividir o valor restante igualmente
    const baseAmount = Math.floor(remainingAmount / numberOfPeople);
    const remainder = remainingAmount % numberOfPeople;
    // O último pagamento recebe o resto dos cêntimos
    return { base: baseAmount, remainder };
  }, [remainingAmount, numberOfPeople]);

  const formatAmount = (cents: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const handlePayPerson = async (personNumber: number) => {
    if (processing || loading) return;

    setProcessing(true);
    setResult(null);

    try {
      // Calcular valor desta pessoa (última pessoa recebe o resto dos cêntimos)
      const isLastPerson = personNumber === numberOfPeople;
      const amountToPay = isLastPerson
        ? amountPerPerson.base + amountPerPerson.remainder
        : amountPerPerson.base;

      await onPayPartial(amountToPay, selectedMethod);
      setResult('success');

      // Se foi o último pagamento, fechar modal após 1 segundo
      if (isLastPerson || (paidAmount + amountToPay >= orderTotal)) {
        setTimeout(() => {
          onCancel();
        }, 1000);
      } else {
        // Limpar resultado após 2 segundos para permitir próximo pagamento
        setTimeout(() => {
          setResult(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Split payment failed:', err);
      setResult('error');
      setTimeout(() => {
        setResult(null);
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  const totalFormatted = formatAmount(orderTotal);
  const paidFormatted = formatAmount(paidAmount);
  const remainingFormatted = formatAmount(remainingAmount);
  const perPersonFormatted = formatAmount(amountPerPerson.base + (amountPerPerson.remainder > 0 ? 1 : 0));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <Card surface="layer1" padding="xl" style={{ maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
          Dividir Conta
        </Text>

        {/* Total e Saldo */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.surface.layer2,
            borderRadius: 8,
            marginBottom: spacing[4],
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
            <Text size="sm" color="tertiary">Total da Conta:</Text>
            <Text size="lg" weight="bold" color="primary">{totalFormatted}</Text>
          </div>
          {paidAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
              <Text size="sm" color="tertiary">Já Pago:</Text>
              <Text size="base" weight="semibold" color="success">{paidFormatted}</Text>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: spacing[2],
              borderTop: `1px solid ${colors.border.subtle}`,
            }}
          >
            <Text size="base" weight="bold" color="primary">Saldo Restante:</Text>
            <Text size="xl" weight="bold" color={remainingAmount > 0 ? 'warning' : 'success'}>
              {remainingFormatted}
            </Text>
          </div>
        </div>

        {/* Número de Pessoas */}
        <div style={{ marginBottom: spacing[4] }}>
          <Text size="sm" weight="medium" color="primary" style={{ marginBottom: spacing[2] }}>
            Quantas pessoas vão dividir?
          </Text>
          <Input
            type="number"
            min="2"
            max="20"
            value={numberOfPeople.toString()}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 2 && value <= 20) {
                setNumberOfPeople(value);
              }
            }}
            style={{ width: '100%' }}
          />
          <Text size="xs" color="tertiary" style={{ marginTop: spacing[1] }}>
            Valor por pessoa: aproximadamente {perPersonFormatted}
            {amountPerPerson.remainder > 0 && (
              <span style={{ color: colors.warning.base }}>
                {' '}(última pessoa paga {formatAmount(amountPerPerson.base + amountPerPerson.remainder)})
              </span>
            )}
          </Text>
        </div>

        {/* Método de Pagamento */}
        <div style={{ marginBottom: spacing[4] }}>
          <Text size="sm" weight="medium" color="primary" style={{ marginBottom: spacing[2] }}>
            Método de Pagamento:
          </Text>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <Button
              variant={selectedMethod === 'cash' ? 'solid' : 'outline'}
              tone={selectedMethod === 'cash' ? 'action' : 'neutral'}
              size="sm"
              onClick={() => setSelectedMethod('cash')}
            >
              Dinheiro
            </Button>
            <Button
              variant={selectedMethod === 'card' ? 'solid' : 'outline'}
              tone={selectedMethod === 'card' ? 'action' : 'neutral'}
              size="sm"
              onClick={() => setSelectedMethod('card')}
            >
              Cartão
            </Button>
            <Button
              variant={selectedMethod === 'pix' ? 'solid' : 'outline'}
              tone={selectedMethod === 'pix' ? 'action' : 'neutral'}
              size="sm"
              onClick={() => setSelectedMethod('pix')}
            >
              PIX
            </Button>
          </div>
        </div>

        {/* Lista de Pessoas para Pagar */}
        {remainingAmount > 0 && (
          <div style={{ marginBottom: spacing[4] }}>
            <Text size="sm" weight="medium" color="primary" style={{ marginBottom: spacing[2] }}>
              Registrar Pagamento:
            </Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: spacing[2],
              }}
            >
              {Array.from({ length: numberOfPeople }, (_, i) => {
                const personNumber = i + 1;
                const isLastPerson = personNumber === numberOfPeople;
                const personAmount = isLastPerson
                  ? amountPerPerson.base + amountPerPerson.remainder
                  : amountPerPerson.base;
                const alreadyPaid = paidAmount >= (personNumber - 1) * amountPerPerson.base + (isLastPerson ? 0 : amountPerPerson.remainder);

                return (
                  <Button
                    key={personNumber}
                    variant="outline"
                    tone="action"
                    size="md"
                    onClick={() => handlePayPerson(personNumber)}
                    disabled={processing || loading || alreadyPaid || remainingAmount <= 0}
                    isLoading={processing}
                    style={{
                      opacity: alreadyPaid ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[1] }}>
                      <Text size="xs" color="secondary">
                        Pessoa {personNumber}
                      </Text>
                      <Text size="sm" weight="bold">
                        {formatAmount(personAmount)}
                      </Text>
                      {alreadyPaid && (
                        <Text size="xs" color="success">
                          ✓ Pago
                        </Text>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Resultado */}
        {result === 'success' && (
          <div
            style={{
              padding: spacing[3],
              backgroundColor: colors.success.base + '20',
              borderRadius: 8,
              marginBottom: spacing[4],
            }}
          >
            <Text size="sm" color="success" weight="bold">
              ✓ Pagamento registrado com sucesso!
            </Text>
          </div>
        )}

        {result === 'error' && (
          <div
            style={{
              padding: spacing[3],
              backgroundColor: colors.destructive.base + '20',
              borderRadius: 8,
              marginBottom: spacing[4],
            }}
          >
            <Text size="sm" color="destructive" weight="bold">
              ✗ Erro ao processar pagamento. Tente novamente.
            </Text>
          </div>
        )}

        {/* Ações */}
        <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[4] }}>
          <Button
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={processing}
            style={{ flex: 1 }}
          >
            {remainingAmount <= 0 ? 'Fechar' : 'Cancelar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
