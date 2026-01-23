/**
 * ProvisionRestaurantPage - UI para Provisioning de Restaurantes
 *
 * Permite criar novos restaurantes via interface administrativa
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import './ProvisionRestaurantPage.css';

interface ProvisionFormData {
  restaurantName: string;
  ownerEmail: string;
  password: string;
  country: string;
}

interface ProvisionResult {
  success: boolean;
  restaurantId?: string;
  message?: string;
  error?: string;
}

export function ProvisionRestaurantPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [formData, setFormData] = useState<ProvisionFormData>({
    restaurantName: '',
    ownerEmail: '',
    password: '',
    country: 'ES',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Validar formulário
      if (!formData.restaurantName || !formData.ownerEmail || !formData.password) {
        setResult({
          success: false,
          error: 'Por favor, preencha todos os campos obrigatórios',
        });
        setLoading(false);
        return;
      }

      // Chamar Edge Function create-tenant
      const { data, error } = await supabase.functions.invoke('create-tenant', {
        body: {
          restaurant_name: formData.restaurantName,
          owner_email: formData.ownerEmail,
          password: formData.password,
          country: formData.country,
        },
      });

      if (error) {
        console.error('[Provision] Error:', error);
        setResult({
          success: false,
          error: error.message || 'Erro ao criar restaurante',
        });
        setLoading(false);
        return;
      }

      if (data?.error) {
        setResult({
          success: false,
          error: data.error,
        });
        setLoading(false);
        return;
      }

      // Sucesso
      setResult({
        success: true,
        restaurantId: data.tenant_id,
        message: `Restaurante "${formData.restaurantName}" criado com sucesso!`,
      });

      // Limpar formulário
      setFormData({
        restaurantName: '',
        ownerEmail: '',
        password: '',
        country: 'ES',
      });

      // Opcional: Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 3000);
    } catch (err: any) {
      console.error('[Provision] Exception:', err);
      setResult({
        success: false,
        error: err.message || 'Erro inesperado ao criar restaurante',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="provision-restaurant-page">
      <div className="provision-container">
        <div className="provision-header">
          <h1>Provisionar Novo Restaurante</h1>
          <p className="provision-subtitle">
            Crie um novo restaurante e associe um owner. O restaurante será criado com dados seed básicos.
          </p>
        </div>

        {result && (
          <div className={`provision-result ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <>
                <div className="result-icon">✅</div>
                <div className="result-content">
                  <h3>Sucesso!</h3>
                  <p>{result.message}</p>
                  {result.restaurantId && (
                    <p className="result-id">Restaurant ID: <code>{result.restaurantId}</code></p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="result-icon">❌</div>
                <div className="result-content">
                  <h3>Erro</h3>
                  <p>{result.error}</p>
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="provision-form">
          <div className="form-group">
            <label htmlFor="restaurantName">
              Nome do Restaurante <span className="required">*</span>
            </label>
            <input
              id="restaurantName"
              type="text"
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              placeholder="Ex: Sofia Gastrobar"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ownerEmail">
              Email do Owner <span className="required">*</span>
            </label>
            <input
              id="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              placeholder="owner@restaurante.com"
              required
              disabled={loading}
            />
            <small className="form-hint">
              Se o usuário não existir, será criado automaticamente
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Senha <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Senha para o owner"
              required
              disabled={loading}
              minLength={6}
            />
            <small className="form-hint">
              Mínimo 6 caracteres. Se o usuário já existir, esta senha será ignorada.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="country">
              País
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              disabled={loading}
            >
              <option value="ES">España</option>
              <option value="PT">Portugal</option>
              <option value="BR">Brasil</option>
              <option value="US">United States</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/app/dashboard')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Restaurante'}
            </button>
          </div>
        </form>

        <div className="provision-info">
          <h3>O que será criado:</h3>
          <ul>
            <li>✅ Restaurante com nome e slug único</li>
            <li>✅ Usuário owner (se não existir)</li>
            <li>✅ Associação owner-restaurante</li>
            <li>✅ 12 mesas padrão (1-12)</li>
            <li>✅ 4 categorias de menu (Entradas, Pratos Principais, Bebidas, Sobremesas)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
