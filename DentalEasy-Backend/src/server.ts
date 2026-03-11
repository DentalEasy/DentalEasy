import dotenv from 'dotenv';
import { app } from './app';

dotenv.config();

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`DentalEasy backend rodando na porta ${port}`);
});
