require("dotenv").config()
const fs = require("fs");
const Web3 = require("web3");
const crypto = require("crypto");

const web3 = new Web3(process.env.RPC_URL);
let count = 0

function generatePrivateKey() {
  const privateKeyBytes = crypto.randomBytes(32);
  return "0x" + privateKeyBytes.toString("hex");
}

async function getAddressAndBalance(privateKey) {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const address = account.address;
  const balance = await web3.eth.getBalance(address);
  return { privateKey, address, balance };
}

async function saveToCSV(data) {
  return new Promise((resolve, reject) => {
    const csvStream = fs.createWriteStream("private_keys_with_balance.csv", { flags: "a", encoding: "utf8" });
    data.forEach((item) => {
        csvStream.write(`"${count} ${item.privateKey}","${item.address}",${item.balance}\n`);
    });

    csvStream.end();
    csvStream.on("finish", resolve);
    csvStream.on("error", reject);
  });
}

async function main() {
  try {
    const privateKey = generatePrivateKey();
    const result = await getAddressAndBalance(privateKey);
    console.log(count, privateKey, result.balance);
    if (result.balance > 0) {
        await saveToCSV([result]);
    }
    count++
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

async function run() {
  while (true) {
    const promises = Array.from({ length: 500 }, () => main()); // Number of requests to execute concurrently
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 0)); // Add a delay between iterations
  }
}

run();
