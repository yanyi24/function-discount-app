// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const error = {
    localizedMessage: "There is an order maximum of $1,000 for customers without established order history",
    target: "cart"
  };

  const orderSubtotal = parseFloat(input.cart.cost.subtotalAmount.amount);
  const errors = [];
  if (orderSubtotal > 1000.0) {
    // If the customer has ordered less than 5 times in the past,
    // then treat them as a new customer.
    const numberOfOrders = input.cart.buyerIdentity?.customer?.numberOfOrders ?? 0;

    if (numberOfOrders < 5) {
      errors.push(error);
    }
  }
  return {
    errors
  }
};