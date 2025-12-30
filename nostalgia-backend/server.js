require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./src/models");

const PORT = Number(process.env.PORT || 3030);

async function boot() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // simple sync for now; can migrate later
    app.listen(PORT, () => {
      console.log(`Backend listening on http://0.0.0.0:${PORT}`);
    });
  } catch (e) {
    console.error("Boot error:", e);
    process.exit(1);
  }
}

boot();
