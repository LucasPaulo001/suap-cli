import puppeteer from "puppeteer";
import inquirer from "inquirer";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { comparePass, hash } from "./services/hashPass.mjs";
import path from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.goto("https://suap.ifpb.edu.br/accounts/login/?next=/");

const main = async () => {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "user",
            message: "Informe o usuário (matrícula):"
        },
        {
            type: "password",
            name: "password",
            message: "Informe a senha (esta será a senha para login e validação futura):"
        }
    ]);

    const pass = answers.password;

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

    await page.type("#id_username", answers.user);
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
        await getDataAcademy("table.borda");
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
      });
    }

    return results;
  })

  const dirData = path.join(__dirname, "../boletim");
  await mkdir(dirData, { recursive: true });

  const filePath = path.join(dirData, "Boletim.json")
  await writeFile(filePath, JSON.stringify(tableData, null, 2));
  console.log("✅ Boletim salvo como boletim.json");
}

await main();