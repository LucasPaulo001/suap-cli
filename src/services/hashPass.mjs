import bcrypt from "bcrypt";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Criptografar senha
export const hash = async (password) => {
    try{
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        const dir = path.join(__dirname, "../../pass_backup");
        await mkdir(dir, { recursive: true });

        const filePath = path.join(dir, "senha-segura.hash");
        await writeFile(filePath, hashPassword);
    }
    catch(err){
        console.log("Erro ao salvar a senha:", err);
    }
}

//Comparando senha
export const comparePass = async (password, filePass = "../../pass_backup/senha-segura.hash") => {
    try{

        const filePassHash = path.join(__dirname, filePass);
        const passHash = await readFile(filePassHash, "utf-8");

        if(!(await bcrypt.compare(password, passHash))){
            return false;
        }
        else{
            return true;
        }
    }
    catch(err){
        console.log("Erro ao salvar a senha:", err);
    }
}
