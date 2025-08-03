import bcrypt from "bcrypt";
import { mkdir } from "fs/promises";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const passDir = path.join(__dirname, "../pass_backup");
const passPath = path.join(__dirname, "../pass_backup/senha-segura.hash");

//Criptografar senha
export const hash = async (password) => {
    try{
        await mkdir(passDir, { recursive: true });
        const hashPassword = await bcrypt.hash(password, 10);
        await writeFile(passPath, hashPassword);
    }
    catch(err){
        console.log("Erro ao salvar a senha:", err);
    }
}

//Comparando senha
export const comparePass = async (password) => {
    const savedHash = await readFile(passPath, "utf-8");
    return await bcrypt.compare(password, savedHash);
}
