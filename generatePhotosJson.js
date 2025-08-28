const fs = require("fs");
const path = require("path");

const productsDir = path.join(__dirname, "photos");
const outputFile = path.join(productsDir, "photos.json");

const products = fs.readdirSync(productsDir).filter(f => fs.statSync(path.join(productsDir, f)).isDirectory());

const photosJson = {};

products.forEach(product => {
  const productPath = path.join(productsDir, product);
  const files = fs.readdirSync(productPath).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  const colors = {};

  files.forEach(file => {
    // filename format: product_color_x.ext
    // e.g., tee_dark_grey_1.png
    const nameParts = file.split("_");
    if (nameParts.length < 3) return; // skip unexpected names

    // color is everything after the product name and before the last part
    const colorParts = nameParts.slice(1, -1);
    const colorName = colorParts.join(" ").toLowerCase();

    if (!colors[colorName]) colors[colorName] = [];
    colors[colorName].push(file);
  });

  // default price mapping (change as needed)
  let price = 0;
  switch (product) {
    case "tee": price = 55.5; break;
    case "hoodie": price = 75.5; break;
    case "longsleeve": price = 65.5; break;
    case "crewneck": price = 70.5; break;
    default: price = 50; break;
  }

  photosJson[product] = {
    price: price,
    colors: colors
  };
});

fs.writeFileSync(outputFile, JSON.stringify(photosJson, null, 2));
console.log("photos.json generated successfully!");
