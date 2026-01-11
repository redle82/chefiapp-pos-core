import React, { useState } from 'react';
// Patched Imports to use local Design System
import { Card } from '../../ui/design-system/Card';
import { Button } from '../../ui/design-system/Button';
import { ScrollText, FileUp, Download, ShieldAlert, BadgeInfo } from 'lucide-react';

export const FiscalExport: React.FC = () => {
    // Patched: ThemeContext was missing in this specific branch context.
    // Using simple class detection or default to system preference if needed.
    const isDark = document.documentElement.classList.contains('dark');

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = (type: 'csv' | 'pdf' | 'json') => {
        setIsExporting(true);
        // Simulation of export
        setTimeout(() => {
            alert(`Exportação ${type.toUpperCase()} iniciada. (Simulação)`);
            setIsExporting(false);
        }, 1000);
    };

    return (
        <div className={`p-6 max-w-4xl mx-auto space-y-6 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>

            {/* HEADER: A VERDADE JURÍDICA */}
            <div className="flex flex-col gap-2 border-b pb-6 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <ScrollText size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Integração Fiscal (Externa)</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Central de exportação para cumprimento de obrigações legais.
                        </p>
                    </div>
                </div>
            </div>

            {/* 🛡️ THE SHIELD: DISCLAIMER */}
            <div className={`p-6 rounded-xl border-l-4 ${isDark ? 'bg-gray-800/50 border-amber-500' : 'bg-amber-50 border-amber-500'}`}>
                <div className="flex gap-4">
                    <ShieldAlert className="text-amber-500 shrink-0 mt-1" size={24} />
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg text-amber-600 dark:text-amber-400">
                            Aviso Legal Importante
                        </h3>
                        <p className="text-sm leading-relaxed opacity-90">
                            <strong>O ChefIApp não é um sistema de faturação fiscal.</strong>
                            <br />
                            Nossa plataforma apenas organiza e registra eventos económicos operacionais (vendas, pagamentos, cancelamentos).
                            Ele <strong>não</strong> calcula, valida, transmite ou declara impostos finais à autoridade tributária (AT/Hacienda).
                        </p>
                        <p className="text-sm mt-2 opacity-80">
                            Para efeitos fiscais, você deve exportar os documentos abaixo para o seu software de faturação certificado ou enviá-los para a sua gestoria autorizada.
                        </p>
                    </div>
                </div>
            </div>

            {/* EXPORT ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BLOCO 1: GESTORIA */}
                <Card className={`border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="p-0"> {/* Card wraps padding, but we might want explicit control or just use default */}
                        <div className="flex items-center gap-2 text-lg font-bold mb-4">
                            <FileUp size={20} className="text-emerald-500" />
                            Enviar para Gestoria
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gera um pacote consolidado (CSV + Resumo PDF) ideal para o seu contador lançar no sistema oficial.
                            </p>
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleExport('csv')}
                                disabled={isExporting}
                            >
                                {isExporting ? 'Gerando Pacote...' : 'Gerar Pacote Mensal'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* BLOCO 2: SOFTWARE EXTERNO */}
                <Card className={`border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="p-0">
                        <div className="flex items-center gap-2 text-lg font-bold mb-4">
                            <Download size={20} className="text-indigo-500" />
                            Exportar Dados Brutos
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Baixe os eventos de venda em formato padrão (JSON/xml) para importação em sistemas como Holded, Sage ou Quipu.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => handleExport('json')}
                                >
                                    JSON (API)
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => handleExport('pdf')}
                                >
                                    PDF (Simples)
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* EDUCATIONAL FOOTER */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 opacity-70">
                    <BadgeInfo size={16} />
                    Entenda a Diferença
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm opacity-80">
                    <div>
                        <span className="block font-medium mb-1 text-red-500">❌ O que NÃO fazemos:</span>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>Não geramos assinatura digital fiscal.</li>
                            <li>Não garantimos numeração sequencial certificada (Verifactu).</li>
                            <li>Não comunicamos diretamente com a AT.</li>
                        </ul>
                    </div>
                    <div>
                        <span className="block font-medium mb-1 text-green-500">✅ O que FAZEMOS:</span>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>Registramos o evento operacional (quem, o quê, quanto, quando).</li>
                            <li>Geramos "Documentos de Venda" internos.</li>
                            <li>Fornecemos a matéria-prima organizada para a sua legalidade.</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
};
