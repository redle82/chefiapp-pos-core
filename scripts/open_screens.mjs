#!/usr/bin/env node

/**
 * Script para abrir todas as telas do ChefIApp no navegador
 * e gerar screenshots para inspeção manual
 * 
 * Uso: node scripts/open_screens.mjs
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'artifacts/screenshots';
const TIMEOUT = 30000; // 30 segundos

// Lista de todas as rotas a abrir
const ROUTES = {
  employee: [
    '/employee/home',
    '/employee/tasks',
    '/employee/operation',
    '/employee/operation/kitchen',
    '/employee/mentor',
    '/employee/profile',
  ],
  manager: [
    '/manager/dashboard',
    '/manager/central',
    '/manager/schedule',
    '/manager/schedule/create',
    '/manager/reservations',
    '/manager/analysis',
  ],
  owner: [
    '/owner/vision',
    '/owner/stock',
    '/owner/purchases',
    '/owner/simulation',
    '/owner/config',
  ],
};

// Função para verificar se o servidor está rodando
async function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Função para iniciar o servidor Vite
function startServer() {
  console.log('🚀 Iniciando servidor Vite...');
  const merchantPortalPath = join(__dirname, '..', 'merchant-portal');
  
  const server = spawn('npm', ['run', 'dev'], {
    cwd: merchantPortalPath,
    shell: true,
    stdio: 'pipe',
  });

  server.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:') || output.includes('localhost')) {
      console.log('✅ Servidor iniciado!');
    }
  });

  server.stderr.on('data', (data) => {
    console.error(`Servidor stderr: ${data}`);
  });

  return server;
}

// Função para aguardar servidor ficar pronto
async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const isRunning = await checkServer(url);
    if (isRunning) {
      return true;
    }
    console.log(`⏳ Aguardando servidor... (${i + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

// Função para criar diretório de screenshots
function ensureScreenshotsDir() {
  if (!existsSync(SCREENSHOTS_DIR)) {
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`📁 Diretório criado: ${SCREENSHOTS_DIR}`);
  }
}

// Função para gerar nome de arquivo seguro
function sanitizeFilename(path) {
  return path.replace(/\//g, '_').replace(/^_/, '') || 'home';
}

// Função principal
async function main() {
  console.log('🔍 Verificando servidor...');
  
  // Verificar se servidor está rodando
  const isRunning = await checkServer(BASE_URL);
  
  let serverProcess = null;
  if (!isRunning) {
    console.log('⚠️  Servidor não está rodando. Iniciando...');
    serverProcess = startServer();
    
    // Aguardar servidor ficar pronto
    const serverReady = await waitForServer(BASE_URL);
    if (!serverReady) {
      console.error('❌ Servidor não iniciou a tempo. Abortando.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  } else {
    console.log('✅ Servidor já está rodando!');
  }

  // Criar diretório de screenshots
  ensureScreenshotsDir();

  // Iniciar navegador
  console.log('🌐 Iniciando navegador...');
  const browser = await chromium.launch({
    headless: false, // Abrir navegador visível
    channel: 'chrome', // Usar Chrome
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const results = {
    success: [],
    errors: [],
    total: 0,
  };

  // Abrir todas as rotas
  console.log('\n📱 Abrindo telas...\n');

  // Agrupar todas as rotas
  const allRoutes = [
    ...ROUTES.employee.map((r) => ({ path: r, category: 'employee' })),
    ...ROUTES.manager.map((r) => ({ path: r, category: 'manager' })),
    ...ROUTES.owner.map((r) => ({ path: r, category: 'owner' })),
  ];

  for (const { path, category } of allRoutes) {
    const url = `${BASE_URL}${path}`;
    results.total++;

    try {
      console.log(`  📄 ${category.toUpperCase()}: ${path}`);

      const page = await context.newPage();
      
      // Navegar para a página
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: TIMEOUT,
      });

      if (!response || response.status() !== 200) {
        throw new Error(`Status ${response?.status() || 'N/A'}`);
      }

      // Aguardar conteúdo carregar
      await page.waitForTimeout(1000);

      // Tirar screenshot
      const filename = sanitizeFilename(path);
      const screenshotPath = join(SCREENSHOTS_DIR, `${filename}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Verificar se há erros 404 ou problemas
      const title = await page.title();
      const hasError = title.includes('404') || page.url().includes('404');

      if (hasError) {
        throw new Error('Página retornou 404');
      }

      results.success.push({
        path,
        category,
        url,
        screenshot: screenshotPath,
        title,
      });

      console.log(`     ✅ OK - Screenshot: ${screenshotPath}`);

      // Manter página aberta (não fechar)
      // page.close() será feito no final

    } catch (error) {
      results.errors.push({
        path,
        category,
        url,
        error: error.message,
      });
      console.log(`     ❌ ERRO: ${error.message}`);
    }
  }

  // Manter navegador aberto para inspeção manual
  console.log('\n✅ Todas as telas foram abertas!');
  console.log('👀 Navegador permanecerá aberto para inspeção manual.');
  console.log('   Pressione Ctrl+C para fechar.\n');

  // Gerar relatório
  const report = generateReport(results);
  console.log(report);

  // Salvar relatório em arquivo
  const reportPath = 'artifacts/screens_report.md';
  if (!existsSync('artifacts')) {
    mkdirSync('artifacts', { recursive: true });
  }
  const fs = await import('fs/promises');
  await fs.writeFile(reportPath, report, 'utf-8');
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);

  // Não fechar navegador - deixar aberto para inspeção
  // await browser.close();

  // Se iniciou o servidor, não matar (deixar rodando)
  // if (serverProcess) {
  //   console.log('\n⚠️  Servidor continuará rodando. Feche manualmente se necessário.');
  // }
}

// Função para gerar relatório
function generateReport(results) {
  const { success, errors, total } = results;

  let report = `# 📱 Relatório de Abertura de Telas - ChefIApp\n\n`;
  report += `**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;
  report += `## 📊 Resumo\n\n`;
  report += `- **Total de telas:** ${total}\n`;
  report += `- **✅ Sucesso:** ${success.length}\n`;
  report += `- **❌ Erros:** ${errors.length}\n\n`;

  if (success.length > 0) {
    report += `## ✅ Telas Abertas com Sucesso\n\n`;
    const byCategory = {};
    success.forEach((item) => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push(item);
    });

    Object.entries(byCategory).forEach(([category, items]) => {
      report += `### ${category.toUpperCase()}\n\n`;
      items.forEach((item) => {
        report += `- **${item.path}**\n`;
        report += `  - URL: ${item.url}\n`;
        report += `  - Screenshot: ${item.screenshot}\n`;
        report += `  - Título: ${item.title}\n\n`;
      });
    });
  }

  if (errors.length > 0) {
    report += `## ❌ Erros\n\n`;
    errors.forEach((item) => {
      report += `- **${item.path}** (${item.category})\n`;
      report += `  - URL: ${item.url}\n`;
      report += `  - Erro: ${item.error}\n\n`;
    });
  }

  report += `\n---\n\n`;
  report += `**Screenshots salvos em:** \`${SCREENSHOTS_DIR}\`\n`;

  return report;
}

// Executar
main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
