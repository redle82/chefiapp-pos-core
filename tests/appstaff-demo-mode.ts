/**
 * 🎭 MODO DEMO AUTOMÁTICO — AppStaff Full Operation
 * 
 * Executa automaticamente o fluxo completo de demonstração,
 * baseado no teste E2E, mas otimizado para apresentação comercial.
 * 
 * Uso: npm run demo:appstaff
 */

import { chromium, BrowserContext, Page } from 'playwright';
import { v4 as uuid } from 'uuid';

const TEAM = [
    { id: 'waiter-a', name: 'Garçom A', role: 'waiter', tables: [1, 2, 3, 4] },
    { id: 'chef-1', name: 'Cozinheiro Principal', role: 'kitchen', tables: [] },
    { id: 'bartender-1', name: 'Bartender', role: 'bartender', tables: [] },
    { id: 'cleaner-1', name: 'Limpeza', role: 'cleaning', tables: [] },
];

const RESTAURANT_ID = 'demo-restaurant-' + uuid().slice(0, 8);
const BASE_URL = process.env.DEMO_BASE_URL || 'http://localhost:5173';

interface DemoMetrics {
    phase: string;
    timestamp: number;
    tasksGenerated: number;
    tasksByRole: Record<string, number>;
    eventsProcessed: number;
    duplicatesPrevented: number;
}

class AppStaffDemo {
    private context: BrowserContext | null = null;
    private pages: Map<string, Page> = new Map();
    private metrics: DemoMetrics[] = [];

    async start() {
        console.log('🎭 Iniciando Demo Automático do AppStaff...\n');

        const browser = await chromium.launch({ headless: false });
        this.context = await browser.newContext();

        // Criar sessões para equipe demo
        for (const staff of TEAM) {
            const page = await this.createStaffSession(staff);
            this.pages.set(staff.id, page);
            console.log(`✅ ${staff.name} conectado`);
        }

        console.log('\n📊 Demo iniciado. Executando fases...\n');
    }

    private async createStaffSession(staff: typeof TEAM[0]): Promise<Page> {
        const page = await this.context!.newPage();
        
        await page.addInitScript((staffData) => {
            localStorage.setItem('chefiapp_restaurant_id', RESTAURANT_ID);
            localStorage.setItem('chefiapp_user_role', staffData.role);
            localStorage.setItem('chefiapp_staff_id', staffData.id);
            localStorage.setItem('chefiapp_staff_name', staffData.name);
            localStorage.setItem('staff_role', staffData.role);
            localStorage.setItem('staff_worker_id', staffData.id);
            localStorage.setItem('staff_contract', JSON.stringify({
                type: 'Restaurante',
                mode: 'local',
                restaurantId: RESTAURANT_ID,
            }));
            process.env.APPSTAFF_SIMULATION = 'true';
        }, staff);
        
        await page.goto(`${BASE_URL}/app/staff`);
        await page.waitForTimeout(1000);
        
        // Check-in automático
        try {
            const checkInInput = page.locator('input[type="text"]').first();
            if (await checkInInput.isVisible({ timeout: 2000 })) {
                await checkInInput.fill(staff.name);
                await page.locator('button:has-text("Entrar"), button:has-text("Confirmar")').first().click();
                await page.waitForTimeout(500);
            }
        } catch (e) {}
        
        return page;
    }

    async runPhase(phaseName: string, duration: number = 5000) {
        console.log(`\n🔄 FASE: ${phaseName}`);
        console.log(`⏱️  Duração: ${duration / 1000}s\n`);

        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, duration));

        // Coletar métricas
        const metrics: DemoMetrics = {
            phase: phaseName,
            timestamp: startTime,
            tasksGenerated: 0,
            tasksByRole: {},
            eventsProcessed: 0,
            duplicatesPrevented: 0,
        };

        for (const [staffId, page] of this.pages) {
            const taskCount = await page.evaluate(() => {
                const selectors = ['[data-testid*="task"]', '[class*="task"]', '[class*="Task"]'];
                let count = 0;
                for (const selector of selectors) {
                    try {
                        count += document.querySelectorAll(selector).length;
                    } catch {}
                }
                return count;
            });

            const staff = TEAM.find(s => s.id === staffId);
            if (staff) {
                metrics.tasksByRole[staff.role] = (metrics.tasksByRole[staff.role] || 0) + taskCount;
                metrics.tasksGenerated += taskCount;
            }
        }

        this.metrics.push(metrics);
        this.printMetrics(metrics);
    }

    private printMetrics(metrics: DemoMetrics) {
        console.log('📊 Métricas:');
        console.log(`   Tarefas geradas: ${metrics.tasksGenerated}`);
        console.log(`   Por role:`);
        for (const [role, count] of Object.entries(metrics.tasksByRole)) {
            console.log(`     - ${role}: ${count}`);
        }
        console.log('');
    }

    async simulateWebOrder() {
        console.log('🌐 Simulando pedido web...');
        // Em produção, chamaria API real
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.runPhase('Pedido Web Processado', 3000);
    }

    async simulateQROrder(tableNumber: number) {
        console.log(`📱 Simulando pedido QR - Mesa ${tableNumber}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.runPhase(`Pedido QR Mesa ${tableNumber}`, 3000);
    }

    async simulatePayment(tableNumber: number) {
        console.log(`💳 Simulando pagamento - Mesa ${tableNumber}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.runPhase(`Pagamento Mesa ${tableNumber}`, 3000);
    }

    async simulateWaiterCall(tableNumber: number, times: number = 1) {
        console.log(`🔔 Simulando ${times} chamado(s) - Mesa ${tableNumber}...`);
        for (let i = 0; i < times; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        await this.runPhase(`Chamado Garçom Mesa ${tableNumber} (${times}x)`, 2000);
    }

    async generateReport() {
        console.log('\n📈 RELATÓRIO FINAL DA DEMONSTRAÇÃO\n');
        console.log('=' .repeat(50));
        
        const totalTasks = this.metrics.reduce((sum, m) => sum + m.tasksGenerated, 0);
        const avgTasksPerPhase = totalTasks / this.metrics.length;
        
        console.log(`Total de tarefas geradas: ${totalTasks}`);
        console.log(`Média por fase: ${avgTasksPerPhase.toFixed(1)}`);
        console.log(`Fases executadas: ${this.metrics.length}`);
        
        console.log('\n📊 Distribuição por Role:');
        const roleTotals: Record<string, number> = {};
        for (const metric of this.metrics) {
            for (const [role, count] of Object.entries(metric.tasksByRole)) {
                roleTotals[role] = (roleTotals[role] || 0) + count;
            }
        }
        for (const [role, count] of Object.entries(roleTotals)) {
            console.log(`   ${role}: ${count} tarefas`);
        }
        
        console.log('\n✅ Demonstração concluída com sucesso!');
        console.log('=' .repeat(50));
    }

    async stop() {
        if (this.context) {
            await this.context.close();
        }
    }
}

// Execução automática
async function runDemo() {
    const demo = new AppStaffDemo();
    
    try {
        await demo.start();
        
        // FASE 1: Restaurante Vazio
        await demo.runPhase('Restaurante Vazio - Tarefas Automáticas', 10000);
        
        // FASE 2: Pedidos Web
        await demo.simulateWebOrder();
        
        // FASE 3: Pedidos QR
        await demo.simulateQROrder(3);
        await demo.simulateQROrder(7);
        
        // FASE 5: Pagamento
        await demo.simulatePayment(5);
        
        // FASE 6: Chamados Múltiplos
        await demo.simulateWaiterCall(8, 3);
        
        // Relatório final
        await demo.generateReport();
        
    } catch (error) {
        console.error('❌ Erro na demonstração:', error);
    } finally {
        await demo.stop();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runDemo();
}

export { AppStaffDemo, runDemo };

