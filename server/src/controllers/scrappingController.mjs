import { main } from "../services/scrapping.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Pegando credenciais e gerando dados
export const getData = async (req, res) => {
  try {
    const { user, password } = req.body;

    if (!user || !password) {
      return res.status(400).json({
        error: "Usuário e senha são obrigatórios!",
      });
    }

    const boletim = await main(user, password);

    res.status(200).json({
      success: true,
      boletim,
    });
  } catch (err) {
    console.log(err);
  }
};