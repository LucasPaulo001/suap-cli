import puppeteer from "puppeteer";
import { existsSync } from "fs";
import { comparePass, hash } from "./hashPass.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();

await page.goto("https://suap.ifpb.edu.br/accounts/login/?next=/");

export const main = async (user, password) => {

    const pass = password;

    const senhaPath = path.join(__dirname, "../pass_backup/senha-segura.hash");
    if (!existsSync(senhaPath)) {
        await hash(pass);
        console.log("🔐 Senha salva com segurança em /pass_backup.");
    }
    else {
        const isValid = await comparePass(pass);
        if (!isValid) {
            console.log("❌ Senha incorreta! Encerrando.");
            await browser.close();
            process.exit(1);
        }
    }

    await page.type("#id_username", user);
    await page.type("#id_password", pass);

    await Promise.all([
        page.click('input[type="submit"][value="Acessar"]'),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    //Logando no suap
    try {
        await page.waitForSelector("#user-tools", { timeout: 5000 });
        console.log("✅ Logado com sucesso!");
    }
    catch {
        console.log("❌ Falha no login. Verifique usuário e senha.");
        await browser.close();
    }

    //Navegando até o boletim de estudante
    try {
        await goData("#link-1-meus-dados", 'a[data-tab="boletim"]');

        console.log("✅ Navegou para boletins!");
        const boletim = await getDataAcademy("table.borda");
        await browser.close();

        return boletim;
    }
    catch (err) {
        console.log("❌ Falha ao navegar para boletins:", err.message);
    }
}

//Função de direcionamento dos dados de boletim
const goData = async (bottomSelector, dataSelector) => {
    await page.waitForSelector(bottomSelector);
    await page.click(bottomSelector);

    // Espera um pouco para o segundo menu/tab carregar se for dinâmico
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.waitForSelector(dataSelector, { timeout: 5000 });
    await page.click(dataSelector);

    await new Promise(resolve => setTimeout(resolve, 1000));
};

//Função para pegar os dados do boletim e transformar em json
const getDataAcademy = async (table) => {
  await page.waitForSelector(table);

  const tableData = await page.$$eval(`${table} tbody tr`, (rows) => {
    const results = [];

    for(const row of rows) {
      const cols = Array.from(row.querySelectorAll("td")).map((td) =>
        td.innerText.trim()
      );

      if (cols.length < 12 || cols[0].toLowerCase() === "total") continue;

      const linkNotas = row.querySelector("a.popup")?.getAttribute("href") || null;

      results.push({
        diario: cols[0],
        disciplina: cols[1],
        cargaHoraria: cols[2],
        tempoAulas: cols[3],
        faltas: cols[4],
        frequencia: cols[5],
        situacao: cols[6],
        E1: cols[7],
        MD: cols[8],
        NAF: cols[9],
        MFD: cols[10],
        conceito: cols[11],
        detalhesLink: linkNotas
      });
    }

    return results;
  });

  for (let i = 0; i < tableData.length; i++) {
  const disciplina = tableData[i];
  if (!disciplina.detalhesLink) continue;

  try {
    // Busca a linha de volta no DOM usando um seletor baseado no nome da disciplina
    const rows = await page.$$('table.borda tbody tr');

    const row = rows.find(async (tr) => {
      const text = await tr.evaluate((el) => el.innerText);
      return text.includes(disciplina.disciplina);
    });

    if (!row) throw new Error("Linha da disciplina não encontrada.");

    const link = await row.$('a.popup');
    if (!link) throw new Error("Link da disciplina não encontrado.");

    await Promise.all([
      link.click(),
      page.waitForSelector('table.borda', { timeout: 5000 }),
    ]);

    const notasDetalhadas = await page.$$eval('table.borda tbody tr', (rows) =>
      rows.map((row) => {
        const cols = Array.from(row.querySelectorAll('td')).map((td) =>
          td.innerText.trim()
        );
        return {
          sigla: cols[0],
          tipo: cols[1],
          descricao: cols[2],
          peso: cols[3],
          nota: cols[4],
          data: cols[5],
        };
      })
    );

    disciplina.notas = notasDetalhadas;
    await page.keyboard.press('Escape');
    await new Promise((res) => setTimeout(res, 500));
  } catch (err) {
    console.error(`Erro ao acessar modal da disciplina ${disciplina.disciplina}:`, err.message);
    disciplina.notas = [];
  }

}

  console.log("Boletim gerado com sucesso!")
  return tableData
}
