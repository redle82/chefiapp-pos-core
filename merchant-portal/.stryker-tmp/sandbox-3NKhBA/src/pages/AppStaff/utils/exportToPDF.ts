/**
 * P3-6: PDF Export Utility
 * 
 * Exporta relatórios de turno em PDF usando browser print API
 * (Alternativa leve sem dependências externas)
 */
// @ts-nocheck


export interface ShiftReportData {
    shiftDate: string;
    workerName: string;
    role: string;
    tasksCompleted: number;
    tasksTotal: number;
    shiftDuration: string;
    metrics?: {
        pressure?: number;
        riskLevel?: number;
        healthStatus?: string;
    };
}

export function exportShiftReportToPDF(data: ShiftReportData): void {
    // Create a printable HTML document
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório de Turno - ${data.shiftDate}</title>
    <style>
        @media print {
            @page {
                margin: 20mm;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header .date {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section h2 {
            font-size: 18px;
            margin-bottom: 10px;
            color: #333;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: 600;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .metrics {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Turno</h1>
        <div class="date">${data.shiftDate}</div>
    </div>

    <div class="section">
        <h2>Informações do Funcionário</h2>
        <div class="info-row">
            <span class="info-label">Nome:</span>
            <span class="info-value">${data.workerName}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Função:</span>
            <span class="info-value">${data.role}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Duração do Turno:</span>
            <span class="info-value">${data.shiftDuration}</span>
        </div>
    </div>

    <div class="section">
        <h2>Atividades</h2>
        <div class="info-row">
            <span class="info-label">Tarefas Concluídas:</span>
            <span class="info-value">${data.tasksCompleted} de ${data.tasksTotal}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Taxa de Conclusão:</span>
            <span class="info-value">${data.tasksTotal > 0 ? Math.round((data.tasksCompleted / data.tasksTotal) * 100) : 0}%</span>
        </div>
    </div>

    ${data.metrics ? `
    <div class="section">
        <h2>Métricas do Turno</h2>
        <div class="metrics">
            ${data.metrics.pressure !== undefined ? `
            <div class="info-row">
                <span class="info-label">Pressão:</span>
                <span class="info-value">${data.metrics.pressure}/100</span>
            </div>
            ` : ''}
            ${data.metrics.riskLevel !== undefined ? `
            <div class="info-row">
                <span class="info-label">Nível de Risco:</span>
                <span class="info-value">${data.metrics.riskLevel}/100</span>
            </div>
            ` : ''}
            ${data.metrics.healthStatus ? `
            <div class="info-row">
                <span class="info-label">Status de Saúde:</span>
                <span class="info-value">${data.metrics.healthStatus}</span>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Gerado automaticamente pelo ChefIApp POS Core</p>
        <p>${new Date().toLocaleString('pt-PT')}</p>
    </div>
</body>
</html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
    } else {
        // Fallback: create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-turno-${data.shiftDate.replace(/\//g, '-')}.html`;
        link.click();
        URL.revokeObjectURL(url);
    }
}
