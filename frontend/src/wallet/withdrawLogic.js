export async function simulateEscapeTransaction() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Escape transaction processed');
      resolve(true);
    }, 2000);
  });
}

export async function simulateWithdrawTransaction() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ ETH withdrawn successfully');
      resolve(true);
    }, 2000);
  });
}