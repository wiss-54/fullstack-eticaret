require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend sunucusu ${PORT} portunda fırtına gibi çalışıyor!`);
});
