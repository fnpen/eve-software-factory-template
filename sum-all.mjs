const args = process.argv.slice(2);
const numbers = args.map((arg) => Number(arg));
const invalidIndex = args.findIndex(
  (arg, index) => arg.trim() === "" || !Number.isFinite(numbers[index])
);

if (invalidIndex === -1) {
  const sum = numbers.reduce((total, number) => total + number, 0);
  console.log(sum);
} else {
  console.error(
    `Invalid number at argument ${invalidIndex + 1}: ${JSON.stringify(args[invalidIndex])}. Expected a finite number.`
  );
  process.exitCode = 1;
}
